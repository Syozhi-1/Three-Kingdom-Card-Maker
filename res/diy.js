var EXTRA_SEGMENTS = [];
var SKILL_TAGS = ['lord', 'compulsory', 'limit', 'wake'];
var TEXT_RANGES = [];
var currentItem = {};
var templateBlobUrls = [];
var cardBlobUrls = [];
var PREVENT_CORS_MODE = false;

window.onload = function() {
	if (location.href.match('content://') && !document.querySelector('[path="res/common.css"]')) {
		alert('您正在使用content://协议访问该页面，请改用file:///。')
	}
	document.getElementById('sel-template').innerHTML =
		TEMPLATES.map(function(e) {
			return '<option value="' + e.path + '">' + e.name + '</option>';
		}).join('');
	loadTemplate(TEMPLATES[0].path);
	if (PREVENT_CORS_MODE) {
		convertCommonStyle();
		loadFontPackage();
	}

	if (typeof CUSTOM_FONTS != 'undefined') {
		var fontStyles = [];
		var fontOptions = [];
		for (var i = 0; i < CUSTOM_FONTS.length; ++i) {
			var font = CUSTOM_FONTS[i];
			var name = font.name;
			var src;
			if (font.font) {
				src = 'local("' + font.font + '")';
			}else{
				src = 'url("fonts/' + font.file + '")';
			}
			fontStyles.push(
				'@font-face {\n'
				+ 'font-family:' + name + ';\n'
				+ 'src: ' + src + ';\n'
				+ '}'
				+ 'font[font="' + name + '"] {\n'
				+ 'font-family:' + name + ';\n'
				+ '}'
			);
			fontOptions.push('<option value="' + "font='" + name + "'" + '">' + name + '</option>');
		}
		document.getElementById('toolbarFont').innerHTML += fontOptions.join('');
		var style = document.createElement('style');
		style.innerHTML = fontStyles.join('');
		document.body.appendChild(style);
	}

	var toolbarFont = document.getElementById('toolbarFont');
	toolbarFont.onchange = function() {
		var value = this.value;
		if (value) {
			toggleTagPairs('<font ' + value + '>', '</font>');
			this.value = '';
		}
	}
}

function addSkill(){
	var skills = document.getElementById('panel-skill-list');
	var node = document.createElement('div');
	var length = skills.children.length;
	node.innerHTML = '<label>　　技能：</label><textarea id="panel-skill-'+length+'" title="输入技能名与说明。第一行为技能名，第二行及以后是技能说明。" onfocus="setTextToolbar(this)" on-blur="setTextToolbar()" onkeydown="editHotkey(event)"></textarea> <div class="panel-skill-tags" title="可以设置主公技、锁定技、限定技等特定样式。"><label><input type="checkbox">主</label><label> <input type="checkbox">锁</label><label><input type="checkbox">限</label> <label><input type="checkbox">衍</label></div>';
	skills.appendChild(node);
}
function removeSkill(){
	var skills = document.getElementById('panel-skill-list');
	skills.removeChild(skills.lastElementChild);
}

// 获取input选择的文件的路径。来源：http://www.bcty365.com/content-69-6242-1.html
function getFileURL(file) {
	var getUrl = null;
	if (window.createObjectURL != undefined) { // basic
		getUrl = window.createObjectURL(file);
	} else if (window.URL != undefined) { // mozilla(firefox)
		getUrl = window.URL.createObjectURL(file);
	} else if (window.webkitURL != undefined) { // webkit or chrome
		getUrl = window.webkitURL.createObjectURL(file);
	}
	return getUrl;
}
function revokeURL(file) {
	var getUrl = null;
	if (window.revokeObjectURL != undefined) { // basic
		getUrl = window.revokeObjectURL(file);
	} else if (window.URL != undefined) { // mozilla(firefox)
		getUrl = window.URL.revokeObjectURL(file);
	} else if (window.webkitURL != undefined) { // webkit or chrome
		getUrl = window.webkitURL.revokeObjectURL(file);
	}
	return getUrl;
}

function getImagePath(){
	var file = getFileURL(document.getElementById('panel-illustration').files[0]);
	document.getElementById('panel-illustration-online').value = file;
}
function getImagePathFront(){
	var file = getFileURL(document.getElementById('panel-illustration-front').files[0]);
	document.getElementById('panel-illustration-online-front').value = file;
}
function getImagePathPackage(){
	var file = getFileURL(document.getElementById('panel-package-file').files[0]);
	document.getElementById('panel-package').value = file;
}

function createFromInput(){
	document.getElementById('result').innerHTML = ''
	createCard(generateFromInput());
}

function createFromJson(){
	document.getElementById('result').innerHTML = ''
	createCard(JSON.parse(document.getElementById('panel-json-code').value));
}

function exportJson(){
	// 这样做可以有缩进，https://www.wuyanlin.cn/?p=761
	document.getElementById('panel-json-code').value
			= JSON.stringify(generateFromInput(), null, 4);
}

function generateFromInput(){

	var illustration = document.getElementById('panel-illustration-online').value;
	var kingdom = document.getElementById('panel-kingdom').value;
	var nickname = document.getElementById('panel-nickname').value;
	var name = document.getElementById('panel-name').value;
	var hp = document.getElementById('panel-hp').value;
	var style = document.getElementById('panel-style').value;
	var textSize = document.getElementById('sel-textsize').value;

	var skills = [];
	var skillNodes = document.getElementById('panel-skill-list').children;
	for (var i = 0; i < skillNodes.length; ++i){
		var text = skillNodes[i].getElementsByTagName('textarea')[0].value.match(/(.+)\r?\n([\s\S]+)/);
		if (!text || text.length <= 1)
			break;
		var skill = {'name': text[1], 'description': text[2]};
		var checkboxes = skillNodes[i].getElementsByClassName('panel-skill-tags')[0].getElementsByTagName('input');
		var tags = SKILL_TAGS.filter(function(e, i) {
			return checkboxes[i].checked;
		});
		if (tags.length > 0) {
			skill.tag = tags;
		}
		skills.push(skill);
	}

	var quote = document.getElementById('panel-quote').value;
	var comment = document.getElementById('panel-comment').value.split(/\r?\n/);
	var package = document.getElementById('panel-package').value;

	var adjust = document.getElementById('panel-illustration-adjust').value.split(/\s*,\s*/);
	var illuFront = document.getElementById('panel-illustration-online-front').value;
	if (adjust.length == 3 || illuFront){
		adjust = adjust.length == 3 ? adjust : [0, 0, 1];
		illustration = {
			'path': illustration,
			'pathFront': illuFront,
			'adjust': {'x': parseFloat(adjust[0]), 'y': parseFloat(adjust[1]), 'scale': parseFloat(adjust[2])}
			};
	}

	/*if (illustration.files[0]){
		// https://www.cnblogs.com/workky/p/6061931.html
		var reader = new FileReader();
		reader.readAsDataURL(illustration.files[0]);
		reader.onload = function(e){
			var image = card.getElementsByClassName('illustration')[0].children[0]
			image.src = this.result;
		}
	}*/

	var object = {
		'kingdom': kingdom,
		'name': name,
		'nickname': nickname,
		'hitpoints': hp,
		'style': style,
		'illustration': illustration,
		'skills': skills,
		'quote': quote,
		'comment': comment,
		'package': package,
		'textSize': textSize
	};

	if (EXTRA_SEGMENTS.length > 0) {
		object.extra = {};
		for (var i = 0; i < EXTRA_SEGMENTS.length; ++i) {
			var key = EXTRA_SEGMENTS[i];
			object.extra[key] = document.getElementById('panel-x-' + key).value;
		}
	}

	return object;
}

function loadTemplate(template){
	for (var i = templateBlobUrls.length - 1; i >= 0; --i) {
		revokeURL(templateBlobUrls[i]);
	}
	templateBlobUrls.length = 0;
	var templatePath = template + '/style.css';
	var cssElement = document.getElementById('meta-template-css');

	var bufferedElement = document.querySelector('[path="' + templatePath + '"]');
	if (bufferedElement) {
		cssElement.href = getFileURL(new Blob([bufferedElement.innerText]));
		templateBlobUrls.push(cssElement.href);
	}else {
		cssElement.href = 'templates/' + templatePath;
	}

	var onload = function(){
		var style = window.getComputedStyle(document.getElementsByClassName('card')[0]);
		var variants = style.getPropertyValue('--variants').trim().split(/\s*,\s*/);

		var panel = document.getElementById('panel-style');
		var oldVariant = panel.value;
		panel.innerHTML = '';

		for (var i = 0; i < variants.length; i += 2){
			var option = document.createElement('option');
			option.value = variants[i + 1];
			option.innerHTML = variants[i];
			if (option.value == oldVariant) {
				option.selected = true;
			}
			panel.appendChild(option);
		}

		EXTRA_SEGMENTS.length = 0;
		var extra = style.getPropertyValue('--extra-segments').trim();
		var extraHTML = '';
		if (extra) {
			extra = extra.split(/\s*,\s*/);
			var extraTypes = style.getPropertyValue('--extra-segment-types').trim();
			if (extraTypes) {
				extraTypes = extraTypes.split(/\s*,\s*/);
			}
			var defaults = style.getPropertyValue('--extra-segment-defaults').trim();
			if (defaults) {
				defaults = defaults.split(/\s*,\s*/);
			}

			for (var i = 0; i < extra.length; i += 2){
				var key = extra[i + 1];
				var type = extraTypes[i >> 1] || 'text';
				var value = defaults[i >> 1] ? "value='" + defaults[i >> 1] + "'" : '';
				if (type == 'enum') {
					var values = style.getPropertyValue('--extra-' + key + '-values').trim().split(/\s*,\s*/);
					var nameVar = style.getPropertyValue('--extra-' + key + '-names');
					var names = nameVar ? nameVar.trim().split(/\s*,\s*/) : values;
					var options = [];
					for (var j = 0; j < values.length; ++j) {
						options.push('<option value="' + values[j] + '">' + names[j] + '</option>');
					}
					extraHTML += "<span><label for='panel-x-" + key + "'>" + extra[i]
						+ "：</label><select id='panel-x-" + key + "' class='short' " + value + ">'"
						+ options.join('') + "'</select></span>";
				}else{
					extraHTML += "<span><label for='panel-x-" + key + "'>" + extra[i]
						+ "：</label><input id='panel-x-" + key + "' class='short' type='" + type
						+ "'" + value + "/></span>";
				}
				EXTRA_SEGMENTS.push(key);
			}
		}
		document.getElementById('panel-extra').innerHTML = extraHTML;

		var textRangeValue = style.getPropertyValue('--text-ranges');
		TEXT_RANGES = textRangeValue ? textRangeValue.trim().split(/\s*,\s*/) : [80, 140, 200, 215];

		if (PREVENT_CORS_MODE)
			loadMobileSrcs(style);

		zoomCard();
	}

	// 来源：https://www.cnblogs.com/telwanggs/p/11045773.html
	if (cssElement.readyState){ // IE
		cssElement.onreadystatechange = function(){
			if (cssElement.readyState == 'loaded' || cssElement.readyState == 'complete'){
				cssElement.onreadystatechange = null;
				onload();
			}
		};
	}else{ // 其他浏览器
		cssElement.onload = onload;
	}
	setTimeout(onload, 500);

}


function imageAdjustFeedback(image){
	var scale = (image.scrollWidth / image.naturalWidth + image.scrollHeight / image.naturalHeight) / 2;
	document.getElementById('panel-illustration-adjust').value =
			image.offsetLeft + ', ' + image.offsetTop + ', ' + scale.toFixed(4);
}

function replaceSpecialCharacters(string){
	return string.replace(/\n/g, '<br/>').replace(/(?<!\<font) /g, '&nbsp;');
}

function createCard(object){
	currentItem = object;
	for (var i = cardBlobUrls.length - 1; i >= 0; --i) {
		revokeURL(cardBlobUrls[i]);
	}
	cardBlobUrls.length = 0;

	var card = document.getElementById('template').getElementsByClassName('card')[0].cloneNode(true);
	document.getElementById('result').appendChild(card);
	card.className = 'card ' + object.style;

	if (object.kingdom) {
		var kingdom = object.kingdom;
		var kingdomElement = card.getElementsByClassName('custom-kingdom')[0];
		kingdomElement.innerHTML = kingdom;
		kingdomElement.setAttribute('value', kingdom);
		kingdomElement.setAttribute('length', getTextLength(kingdom));
		if (kingdom.length >= 2) {
			var c1 = kingdom.charCodeAt(0), c2 = kingdom.charCodeAt(1);
			if (c1 >= 0xd830 && c1 <= 0xfe0f && c2 >= 0xd830 && c2 <= 0xfe0f) {
				kingdomElement.setAttribute('lang', 'emoji');
				kingdomElement.setAttribute('length', 1);
			}
		}
	}else {
		//card.getElementsByClassName('custom-kingdom')[0].style.display = 'none';
	}
	card.setAttribute('kingdom', object.kingdom || '');

	var nicknameElement = card.getElementsByClassName('nickname')[0];
	var nickname = object.nickname || '';
	nicknameElement.innerHTML = nickname;
	nicknameElement.setAttribute('value', nickname);
	nicknameElement.setAttribute('length', getTextLength(nickname));
	if (nickname.length > 4){
		nicknameElement.classList.add('nickname-small');
	}
	card.setAttribute('nickname', nickname);

	var nameElement = card.getElementsByClassName('name')[0];
	var name = typeof(object.name) == 'object' ? object.name.text : object.name;
	var nameLength = getTextLength(name);
	nameElement.innerHTML = replaceSpecialCharacters(name);
	nameElement.setAttribute('value', name.replace(/<[^>]+>/g, ''));
	nameElement.setAttribute('length', nameLength);
	if (nameLength > 4){
		nameElement.classList.add('name-small');
	}
	if (object.name.font){
		nameElement.style.fontFamily = object.name.font;
	}
	card.setAttribute('name', name);

	var hp = object.hitpoints;
	var drained = 0, overflow = 0;
	if (typeof hp == 'string') {
		var match;
		if (match = hp.match(/^(\d+)\/(\d+)\+(\d+)$/)) { // A/B+C
			hp = +match[1]; drained = match[2] - hp; overflow = +match[3];
			if (drained < 0) {
				hp += overflow; overflow += -drained; drained = 0;
			}
		}else if (match = hp.match(/^(\d+)\/(\d+)$/)) { // A/B
			hp = +match[1]; drained = match[2] - hp;
			if (drained < 0) {
				overflow = -drained; drained = 0;
			}
		}else if (match = hp.match(/^(\d+)\+(\d+)$/)) { // A+C
			overflow = +match[2]; hp = overflow + +match[1];
		}else {
			drained = Math.round((hp % 1) * 10);
		}
	}else {
		drained = Math.round((hp % 1) * 10);
	}
	hp = Math.floor(hp);
	var hitpoints = card.getElementsByClassName('hitpoints')[0]
	hitpoints.setAttribute('hp', hp);
	hitpoints.setAttribute('maxhp', drained ? hp + drained : hp - overflow);
	hitpoints.setAttribute('total', drained ? hp + drained + overflow : hp);
	for (var i = 1, limit = Math.min(drained ? hp : hp - overflow, 100); i <= limit; ++i){
		var node = document.createElement('li')
		hitpoints.appendChild(node)
	}
	if (drained > 0){
		hitpoints.setAttribute('losthp', drained);
		for (var i = 1; i <= drained; ++i){
			var node = document.createElement('li')
			node.className = 'drained';
			hitpoints.appendChild(node)
		}
	}
	if (overflow > 0){
		hitpoints.setAttribute('overflow', overflow);
		for (var i = 1; i <= overflow; ++i){
			var node = document.createElement('li')
			node.className = 'overflow';
			hitpoints.appendChild(node);
		}
	}

	if (object.skills.length == 0) {
		card.getElementsByClassName('description')[0].classList.add('empty');
	}else {
		var skills = [];
		var descs = [];
		var textLength = 0;
		for (var i = 0; i < object.skills.length; ++i){
			skills.push(object.skills[i].name);
			textLength += getTextLength(object.skills[i].description);
			descs.push(object.skills[i].description
				.replace(/♠/g, '<i class="suit suit-spade"></i>')
				.replace(/♥/g, '<i class="suit suit-heart"></i>')
				.replace(/♦/g, '<i class="suit suit-diamond"></i>')
				.replace(/♣/g, '<i class="suit suit-club"></i>')
			);
		}

		var descElement = card.getElementsByClassName('description')[0];
		var textSize = object.textSize;
		var isOverMax = false;  // 技能内容是否溢出
		if (textSize == 'tiny') {
			descElement.classList.add('description-tiny');
		}else if (textSize == 'small') {
			descElement.classList.add('description-small');
		}else if (textSize == 'large') {
			descElement.classList.add('description-large');
		}else if (textSize == 'normal') {

		}else {
			if (textLength < TEXT_RANGES[0]){
				descElement.classList.add('description-large');
			}else if (textLength >= TEXT_RANGES[3]){
				isOverMax = true;
				descElement.classList.add("description-tiny");
			}else if (textLength >= TEXT_RANGES[2]){
				descElement.classList.add('description-tiny');
			}else if (textLength >= TEXT_RANGES[1]){
				descElement.classList.add('description-small');
			}
			descElement.setAttribute('length', textLength);
			descElement.setAttribute('length10', Math.floor(textLength / 10));
			descElement.setAttribute('length100', Math.floor(textLength / 100));
		}

		for (var i=0; i<descs.length; ++i){
			var tags = object.skills[i].tag || [];
			var node = document.createElement('label');
			node.className = 'pointer ' + tags.join(' ');
			node.innerHTML = skills[i];
			node.setAttribute('length', getTextLength(skills[i]));
			descElement.appendChild(node);
			var paragraph = document.createElement('p');
			paragraph.innerHTML = descs[i].replace(/\r?\n/g, '<br/>').replace(/(“)/g, '<b></b>$1'); // 防止引号bug
			paragraph.className = tags.join(' ');
			descElement.appendChild(paragraph);
			height = descElement.scrollHeight;
		}

		// 动态设置技能框高度
		if (isOverMax) {
			var descElementPro = card.getElementsByClassName("description-pro-bg")[0];
			var partner = card.getElementsByClassName("partner")[0];
			let height_text = descElement.offsetHeight - 110 + "px";
			descElementPro.setAttribute('style', 'height: '+ height_text);
		}

		if (object.quote) {
			var lines = object.quote.split(/\r?\n/g);
			if (lines.length > 1) {
				lines[lines.length - 1] = '<span class="author">' + lines[lines.length - 1] + '</span>';
			}
			descElement.innerHTML += '<p class="quote">' + lines.join('<br/>') + '</p>';
		}
	}

	var left = card.getElementsByClassName('trademark')[0]
	var right = card.getElementsByClassName('index')[0]
	var center = card.getElementsByClassName('illustrator')[0]
	var comment = object.comment;
	if (comment.length == 3){
		left.innerHTML = comment[0]
		center.innerHTML = comment[1]
		right.innerHTML = comment[2]
	}else if (comment.length == 2){
		left.innerHTML = comment[0]
		right.innerHTML = comment[1]
	}else if (comment.length == 1){
		right.innerHTML = comment[0]
	}

	var package = object.package;
	if (package) {
		var packageElement = card.getElementsByClassName('package')[0];
		if (package.length > 8 && package.indexOf(':') >= 0) {
			// packageElement.style.backgroundImage = 'url("' + package + '")';
			// packageElement.innerHTML = ' ';
			packageElement.innerHTML = '<img src="' + package + '">';
			packageElement.setAttribute('image', '');
		}else{
			packageElement.innerHTML = package;
			packageElement.setAttribute('length', getTextLength(package));
			packageElement.setAttribute('value', package);
		}
	}

	if (object.extra) {
		for (var i = 0; i < EXTRA_SEGMENTS.length; ++i) {
			var key = EXTRA_SEGMENTS[i];
			var div = document.createElement('div');
			var value = object.extra[key]
			div.className = key;
			div.setAttribute('value', value);
			div.setAttribute('length', getTextLength(value));
			div.innerHTML = value;
			card.appendChild(div);
			card.setAttribute('extra-' + key, value);
			card.style.setProperty('--extra-' + key, value);
		}
	}

	zoomCard();
	document.getElementById('btn-scroll-right').style.display = '';

	for (var elements = card.querySelectorAll('*'), i = elements.length - 1; i >= 0; --i) {
		var element = elements[i];
		var style = getComputedStyle(element);
		if (style.webkitBackgroundClip == 'text') {
			element.classList.add('_use-gradient');
		}
		var svgTemplate = style.getPropertyValue('--svg-template');
		if (svgTemplate) {
			svgTemplate = svgTemplate.replace(/\{[\w\-\.]+\}/g, function(r) {
				var key = r.slice(1, -1);
				if (key[0] == '-') {
					return style.getPropertyValue(key);
				}else{
					return eval('object["' + key.replace(/\./g, '"]["') + '"]') || '';
				}
			});
			var url = getFileURL(new Blob([svgTemplate], {type: 'image/svg+xml'}));
			element.style.setProperty('--svg-image', 'url("' + url + '")');
			element.style.setProperty('--svg-template', 'initial');
			cardBlobUrls.push(url);
			if (style.getPropertyValue('--svg-rasterize') == 'raster') {
				var canvas = document.createElement('canvas');
				var image = new Image();
				image.onload = function() {
					var width = image.naturalWidth * 1;
					var height = image.naturalHeight * 1;
					canvas.width = width;
					canvas.height = height;
					var ctx = canvas.getContext('2d');
					ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, width, height);
					canvas.toBlob(function(blob) {
						url = getFileURL(blob);
						element.style.setProperty('--svg-image', 'url("' + url + '")');
						cardBlobUrls.push(url);
					});
				}
				image.src = url;
			}
		}
	}

	// 可改变图像位置的拖动事件
	if (!object.illustration) {
		card.getElementsByClassName('illustration')[0].innerHTML = '';
		card.getElementsByClassName('illustration')[1].innerHTML = '';
	}else {
		var image = card.getElementsByClassName('illustration')[0].children[0];
		var image2 = card.getElementsByClassName('illustration')[1].children[0];
		card.drag = {'x': 0, 'y': 0, 'factor': 1.0, 'dragging': 0};

		function adjustImage(image) {
			var adjust = object.illustration.adjust;
			if (adjust){
				image.style.width = image.naturalWidth * adjust.scale + 'px'
				image.style.height = image.naturalHeight * adjust.scale + 'px'
				image.style.left = adjust.x + 'px'
				image.style.top = adjust.y + 'px'
				card.drag.factor = adjust.scale
			}
		}

		image.onload = function(){
			if (typeof(object.illustration) == 'object'){
				adjustImage(image);
			}

			card.onmousedown = function(event){
				card.drag.x = event.offsetX - image.offsetLeft
				card.drag.y = event.offsetY - image.offsetTop
				card.drag.dragging = 1;
			}

			card.onmousemove = function(event){
				if (card.drag.dragging) {
					image.style.left = event.offsetX - card.drag.x + 'px';
					image.style.top = event.offsetY - card.drag.y + 'px';
					image2.style.left = image.style.left;
					image2.style.top = image.style.top;
				}
			}

			card.onmouseup = function(event){
				card.drag.dragging = 0;
				imageAdjustFeedback(image);
			}

			card.addEventListener("wheel", function(event){
				var delta = event.deltaY / 4000;
				var factor = Math.max(card.drag.factor - delta, 0);
				var rate = factor / card.drag.factor;
				card.drag.factor = factor;

				var left = event.offsetX + (image.offsetLeft - event.offsetX) * rate + 'px';
				var top = event.offsetY + (image.offsetTop - event.offsetY) * rate + 'px';
				var width = image.naturalWidth * factor + 'px';
				var height = image.naturalHeight * factor + 'px';
				image2.style.left = image.style.left = left
				image2.style.top = image.style.top = top
				image2.style.width = image.style.width = width
				image2.style.height = image.style.height = height

				imageAdjustFeedback(image);
			});

			function triggerEventTouch(type, event){
				event.preventDefault();
				event.stopPropagation();
				event = event.targetTouches[0];
				event.offsetX = event.clientX - card.clientLeft;
				event.offsetY = event.clientY - card.clientTop;
				card[type](event);
			}
			function getTouchDistance(event){
				var touch0 = event.targetTouches[0];
				var touch1 = event.targetTouches[1];
				return Math.sqrt(Math.pow(touch0.clientX - touch1.clientX, 2)
					+ Math.pow(touch0.clientY - touch1.clientY, 2));
			}

			card.addEventListener("touchstart", function(event){
				if (event.targetTouches.length == 1) {
					triggerEventTouch('onmousedown', event);
				}else if (event.targetTouches.length == 2) {
					card.drag.originFactor = card.drag.factor / getTouchDistance(event);
				}
			});

			card.addEventListener("touchmove", function(event){
				if (event.targetTouches.length == 1) {
					triggerEventTouch('onmousemove', event);
					imageAdjustFeedback(image);
				}else if (event.targetTouches.length == 2) {
					var factor = Math.max(getTouchDistance(event) * card.drag.originFactor, 0);
					var rate = factor / card.drag.factor;
					card.drag.factor = factor;

					var offsetX = (event.targetTouches[0].clientX + event.targetTouches[1].clientX) / 2 + card.clientLeft;
					var offsetY = (event.targetTouches[0].clientY + event.targetTouches[1].clientY) / 2 + card.clientTop;

					image2.style.left = image.style.left = offsetX + (image.offsetLeft - offsetX) * rate + 'px'
					image2.style.top = image.style.top = offsetY + (image.offsetTop - offsetY) * rate + 'px'
					image2.style.width = image.style.width = image.naturalWidth * factor + 'px';
					image2.style.height = image.style.height = image.naturalHeight * factor + 'px';
				}
			});

			card.addEventListener("touchend", function(event){
				if (event.targetTouches.length == 1) {
					triggerEventTouch('onmouseup', event);
				}else if (event.targetTouches.length == 2) {
					imageAdjustFeedback(image);
				}
			});


		};

		image2.onload = function(){
			if (typeof(object.illustration) == 'object'){
				adjustImage(image2);
			}
		}
		image2.onerror = function() {
			this.style.display = 'none';
		}


		if (typeof(object.illustration) !== 'object') {
			image.src = object.illustration;
		}else {
			image.src = object.illustration.path;
			image2.src = object.illustration.pathFront;

			console.log(image.src, image2.src);
		}
	}
}

function zoomCard() {
	var result = document.getElementById('result');
	var card = result.getElementsByClassName('card')[0];
	if (card) {
		var maxwidth = window.innerWidth - 32;
		var maxheight = window.innerHeight - 32;
		if (card.clientHeight > maxheight || card.clientWidth > maxwidth) {
			var rate = Math.min(maxheight / card.clientHeight, maxwidth / card.clientWidth);
			result.style.transform = 'translate(' + card.clientWidth * (rate - 1) / 2
				+ 'px, ' + card.clientHeight * (rate - 1) / 2
				+ 'px) scale(' + rate + ')';
		}else{
			result.style.transform = '';
		}
	}
}

var mode = false;
function switchInterface(){
	if (mode){
		document.getElementById('panel-normal').style.display = '';
		document.getElementById('panel-json').style.display = 'none';
		this.value = '切换到JSON界面';
	}else{
		document.getElementById('panel-normal').style.display = 'none';
		document.getElementById('panel-json').style.display = '';
		this.value = '切换到表单界面';
	}
	mode = !mode;
}

function exportForm(){
	var object = JSON.parse(document.getElementById('panel-json-code').value);

	if (typeof(object.illustration) == 'object'){
		var illu = object.illustration;
		document.getElementById('panel-illustration-online').value = illu.path || '';
		document.getElementById('panel-illustration-online-front').value = illu.pathFront || '';
		document.getElementById('panel-illustration-adjust').value = illu.adjust.x + ', ' + illu.adjust.y + ', ' + illu.adjust.scale
	}else{
		document.getElementById('panel-illustration-online').value = object.illustration || '';
		document.getElementById('panel-illustration-online-front').value = '';
	}

	document.getElementById('panel-name').value = object.name
	document.getElementById('panel-nickname').value = object.nickname

	document.getElementById('panel-hp').value = object.hitpoints;

	document.getElementById('sel-textsize').value = object.textSize || 'auto';

	var style = document.getElementById('panel-style')
	var options = style.getElementsByTagName('option')
	for (var i in options){
		var option = options[i]
		if (option.value == object.style){
			style.value = object.style
			break;
		}
	}

	var skills = object.skills;
	var skillsElement = document.getElementById('panel-skill-list');
	for (var i = 0; i < skills.length; ++i){
		var skill = skills[i];
		var skillElement = document.getElementById('panel-skill-' + i);
		if (!skillElement){
			addSkill();
			skillElement = document.getElementById('panel-skill-' + i);
		}

		skillElement.value = skill.name + '\r\n' + skill.description;
		var tagElements = skillsElement.children[i]
			.getElementsByClassName('panel-skill-tags')[0].getElementsByTagName('input');
		var tags = skill.tag || [];
		for (var j = 0; j < SKILL_TAGS.length; ++j) {
			tagElements[j].checked = tags.indexOf(SKILL_TAGS[j]) >= 0;
		}
	}
	while (document.getElementById('panel-skill-' + skills.length)){
		removeSkill();
	}

	document.getElementById('panel-kingdom').value = object.kingdom || '';

	document.getElementById('panel-quote').value = object.quote || '';
	document.getElementById('panel-comment').value = object.comment.join('\r\n');
	document.getElementById('panel-package').value = object.package || '';

	if (object.extra) {
		for (var i = 0; i < EXTRA_SEGMENTS.length; ++i) {
			var key = EXTRA_SEGMENTS[i];
			var element = document.getElementById('panel-x-' + key);
			if (element) {
				element.value = object.extra[key];
			}
		}
	}

}

imageCreating = false;
function createImage() {
	if (!imageCreating) {
		var result = document.getElementById('result');

		var scale = +document.getElementById('sel-scale').value;
		if (scale > 0) {
			scale /= window.devicePixelRatio;
		}else if (scale == -1) {
			scale = 1;
		}else if (scale == -2) {
			scale = Math.min((window.innerWidth - 4) / result.clientWidth, (window.innerHeight - 4) / result.clientHeight);
		}

		var card0 = result.children[0];
		if (card0) {
			var card = document.createElement('div');
			result.appendChild(card);
			card.outerHTML = card0.outerHTML;
			card = result.children[1];
			card0.style.display = 'none';

			imageCreating = true;
			card.classList.add('on-rendering');
			var transform = result.style.transform;
			var transformZoomed = 'scale(' + scale + ')';
			result.style.transform = transformZoomed;

			// 因html2canvas忽略text-shadow受transform的影响，所以换算
			var subElements = card.querySelectorAll('*');
			var subElementStyles = [];
			for (var i = 0; i < subElements.length; ++i) {
				var style = getComputedStyle(subElements[i]);
				var st = {textShadow: style.textShadow};
				subElementStyles[i] = st;
				if (style.writingMode == 'vertical-rl') {
					st.writingMode = 'vertical-rl';
				}
				if (style.webkitBackgroundClip == 'text') {
					st.webkitBackgroundClip = 'text';
				}
			};
			for (var i = 0; i < subElementStyles.length; ++i) {
				var style = subElementStyles[i];
				var textShadow = style.textShadow;
				if (textShadow && textShadow != 'none') {
					subElements[i].style.textShadow =
						textShadow.replace( // 0 will be converted to 0px automatically
							/([\d\.\-]+(?:px|em|ex|ch|rem))\s+([\d\.\-]+(?:px|em|ex|ch|rem))\s*([\d\.\-]+(?:px|em|ex|ch|rem))?/g,
							function(m, x, y, z) {
								var s = 'calc\(' + scale + ' * ' + x + '\) calc\(' + scale + ' * ' + y + '\) ';
								if (z) {
									s += 'calc\(' + scale * window.devicePixelRatio + ' * ' + z + '\) ';
								}
								return s;
							}
						);
				}
				if (style.writingMode == 'vertical-rl') {
					convertVerticalText(subElements[i]);
				}
			}

			var promise = Promise.resolve();

			result.style.transform = '';
			document.body.parentElement.style.width = '10000px';
			for (var i = 0; i < subElementStyles.length; ++i) { // 制造渐变文字
				if (subElementStyles[i].webkitBackgroundClip == 'text') {
					(function(element) {
						var computedStyle = getComputedStyle(element);
						if (computedStyle.getPropertyValue('--value')) {
							element.innerHTML = computedStyle.getPropertyValue('--value');
						}
						if (!element.innerHTML)  return;

						var textShadow = element.style.textShadow;
						element.style.textShadow = 'none';
						element.style.color = 'transparent';
						element.style.transform = transformZoomed;
						promise = promise.then(function() {
							var textImage;
							return html2canvas(element).then(function(canvas) {
								textImage = new Image();
								textImage.src = canvas.toDataURL();
								element.style.color = '';
								element.style.backgroundImage = 'none';
								return html2canvas(element, {backgroundColor: null});
							}).then(function(canvas) {
								var width = canvas.width, height = canvas.height; // Must be greater than 0
								var adata = canvas.getContext('2d').getImageData(0, 0, width, height).data;
								canvas = document.createElement('canvas');
								canvas.width = width; canvas.height = height;
								var context = canvas.getContext('2d');
								context.drawImage(textImage, 0, 0);
								var imageData = context.getImageData(0, 0, width, height);
								var cdata = imageData.data;
								for (var i = cdata.length - 1; i >= 0; i -= 4) {
									cdata[i] = adata[i];
								}
								context.putImageData(imageData, 0, 0);
								var fillImage = new Image();
								fillImage.src = canvas.toDataURL();
								element.insertBefore(fillImage, element.childNodes[0]);
								var r = scale * window.devicePixelRatio;
								fillImage.style.width = width / r + 'px';
								fillImage.style.height = height / r + 'px';
								fillImage.className = '_gradient-text';
								//fillImage.style.left = element.offsetLeft + 'px';
								//fillImage.style.top = element.offsetTop + 'px';
								element.style.textShadow = textShadow;
								element.style.textAlign = '';
								element.style.transform = '';
							});
						});
					})(subElements[i]);
				}
			}

			promise.then(function() {
				result.style.transform = transformZoomed;
				result.style.setProperty('--output-scale', scale);
				return html2canvas(result, {
					allowTaint: true,
					useCORS: true
				});
			}).then(function(canvas) {
				document.body.parentElement.style.width = '';
				imageCreating = false;
				var output = document.getElementById('output');
				output.innerHTML = '';
				var outputElement = canvas;
				try {
					var image = new Image();
					image.src = canvas.toDataURL();
					image.height = canvas.height / window.devicePixelRatio;
					outputElement = image;
					image.onclick = function() {
						if (confirm('下载图片吗？')) {
							var a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
							a.download = currentItem.nickname + '-' + currentItem.name + '.png';
							if (navigator.userAgent.match('MQQBrowser')) { // QQ浏览器不支持Blob图片
								a.href = image.src;
								a.click();
							}else{
								canvas.toBlob(function(blob) {
									a.href = getFileURL(blob);
									a.click();
									cardBlobUrls.push(a.href);
								});
							}
						}
					}
				}catch(e) {
					console.log('无法导出成image，只能使用canvas。');

					var hint = document.createElement('h3');
					hint.innerHTML = '点击图片来切换底色，然后截图保存<br/>（电脑版可直接右键保存）';
					hint.className = 'panel-hint';
					output.appendChild(hint);

					var currentColor = 0;
					canvas.onclick = function() {
						switch(currentColor = (currentColor + 1) % 4) {
							case 1: output.style.backgroundColor = '#F00'; break;
							case 2: output.style.backgroundColor = '#0F0'; break;
							case 3: output.style.backgroundColor = '#00F'; break;
							default: output.style.backgroundColor = ''; break;
						}
						hint.innerHTML = '';
						event.preventDefault();
						event.stopPropagation();
					}
				}

				output.appendChild(outputElement);
				output.style.display = '';
				result.style.transform = transform;
				result.style.setProperty('--output-scale', '');
				card0.style.display = '';
				result.removeChild(card);

			}, function() {
				imageCreating = false;
			});

		}
	}
}

var VERTICAL_SYMBOLS = {};
(function(){
	var source = '—（）︷︸︹︺【】《》〈〉「」『』，。、：；！？';
	var target = '︱︵︶︷︸︹︺︻︼︽︾︿﹀﹁﹂﹃﹄';
	for (var i = 0; i < source.length; ++i) {
		VERTICAL_SYMBOLS[source[i]] = target[i];
	}
	VERTICAL_SYMBOLS.pattern = new RegExp('[' + source + ']', 'g');
})();
function convertVerticalText(element){
	convertText(element, VERTICAL_SYMBOLS.pattern, function(r) {
		return '<span>' + VERTICAL_SYMBOLS[r] + '</span>';
	});
	if (getComputedStyle(element).textOrientation == 'upright') {
		convertText(element, /([\x20-\x7e])/g, '<span class="_rendering-rotated-letter">$1</span>');
	}else {
		if (getComputedStyle(element).fontFamily.match(/\bSymbolAnd\b/)) {
			convertText(element, /[&]/g, '<span class="_rendering-symbol-and-vertical">&</span>');
		}
		convertText(element, /([\x20-\x7e])/g, '<span class="_rendering-rotated-word">$1</span>');
	}
}

function convertText(element, pattern, replace) {
	var childNodes = element.childNodes;
	var length = childNodes.length;
	for (var i = length - 1; i >= 0; --i) {
		var child = childNodes[i];
		if (child instanceof Text) {
			var text = child.textContent;
			var matches = text.match(pattern);
			if (matches) {
				element.removeChild(child);
				var node = document.createElement('span');
				if (i >= length) {
					element.appendChild(node);
				}else {
					element.insertBefore(node, element.childNodes[i]);
				}
				node.outerHTML = text.replace(pattern, replace);
			}
		}
	}
}

function getTextLength(text) {
	return text ? text.replace(/<[^>]+>/g, '').length : 0;
}

function hideOutput() {
	document.getElementById('output').style.display = 'none';
	document.getElementById('output').style.backgroundColor = '';
}

function scrollPage() {
	if (window.scrollX >= 50) {
		window.scrollTo(0, 0);
	}else{
		window.scrollTo(1e4, 0);
	}
}

function popupHintBalloon(event) {
	var target = event.target;
	var title;
	while (!(title = target.title) && target.parentElement) {
		target = target.parentElement;
	}
	if (target.parentElement && target.parentElement.id == 'textToolbar') {
		return;
	}
	var hint = document.getElementById('panel-hint-balloon');
	if (title) {
		hint.style.opacity = '';
		var offsetX = target.offsetLeft;
		var offsetY = target.offsetTop;
		hint.style.left = offsetX + 'px';
		hint.style.top = offsetY + target.clientHeight + 2 + 'px';
		hint.innerHTML = title;
	}else{
		hint.style.opacity = '0';
	}
}


function exportCardHTML() {
	var html = document.body.parentElement.outerHTML;
	var cardHtml = document.getElementById('result').children[0].outerHTML;
	return html.replace(/<script>[\s\S]+?<\/script>/, '').replace(/<body>[\s\S]+?<\/body>/, '<body>' + cardHtml + '<\/body>');
}

function openCardHTML() {
	var a = document.createElement('a');
	a.href = 'data: text/html; plain, ' + encodeURIComponent(exportCardHTML()), '_blank';
	a.download = document.body.querySelector('#result .name').innerHTML + '.html';
	a.click();
}



function startCrop(){
	var input = document.getElementById('in-trim-file');
	var file = input.files[0];
	if (file) {
		var image = new Image();
		image.src = getFileURL(input.files[0]); // Not revoked
		image.onload = function() {
			var canvas = document.getElementById('canvas-trim');
			var width0 = image.naturalWidth;
			var height0 = image.naturalHeight;
			canvas.width = width0;
			canvas.height = height0;
			var context = canvas.getContext('2d');
			context.drawImage(image, 0, 0);
			var data = context.getImageData(0, 0, width0, height0);
			var d = data.data;

			var xr, xg, xb;
			switch(+document.getElementById('sel-trim-background').value) {
				case 1: xr = 255; xg = 0; xb = 0; break;
				case 2: xr = 0; xg = 255; xb = 0; break;
				case 3: xr = 0; xg = 0; xb = 255; break;
			}

			/*function equalPixel(offset) {
				return d[offset] === xr && d[offset + 1] === xg && d[offset + 2] === xb;
			}
			function unequalPixel(offset) {
				return d[offset] !== xr || d[offset + 1] !== xg || d[offset + 2] !== xb;
			}*/

			function equalPixel(offset) {
				return Math.abs(d[offset] - xr) <= 32 && Math.abs(d[offset + 1] - xg) <= 32 && Math.abs(d[offset + 2] - xb) <= 32;
			}
			function unequalPixel(offset) {
				return Math.abs(d[offset] - xr) > 32 || Math.abs(d[offset + 1] - xg) > 32 || Math.abs(d[offset + 2] - xb) > 32;
			}

			var top = 0, bottom = height0 - 1;
			for (var i = 0; i < height0; ++i) {
				var offset = i * width0 * 4;
				if (equalPixel(offset) && equalPixel(offset - 4)) {
					top = i;
					break;
				}
			}
			for (var i = top + 1; i < height0; ++i) {
				var offset = i * width0 * 4;
				if (unequalPixel(offset) || unequalPixel(offset - 4)) {
					bottom = i;
					break;
				}
			}

			for (var i = top; i < bottom; ++i) {
				for (var j = width0 - 2; j >= 1; --j) {
					var offset = (i * width0 + j) * 4;
					if (unequalPixel(offset)) {
						top = i; i = bottom;
						break;
					}
				}
			}

			for (var i = bottom; i > top; --i) {
				for (var j = width0 - 2; j >= 1; --j) {
					var offset = ((i - 1) * width0 + j) * 4;
					if (unequalPixel(offset)) {
						bottom = i; i = top;
						break;
					}
				}
			}

			var left = Math.floor(width0 / 2), right = Math.ceil(width0 / 2);
			for (var i = top; i < bottom; ++i) {
				for (var j = 1; j < left; ++j) {
					var offset = (i * width0 + j) * 4;
					if (unequalPixel(offset)) {
						left = Math.min(left, j); break;
					}
				}
				for (var j = width0 - 1; j > right; --j) {
					var offset = (i * width0 + j) * 4;
					if (unequalPixel(offset)) {
						right = Math.max(right, j) + 1; break;
					}
				}
			}

			if (document.getElementById('in-trim-blur').checked) {
				++left; ++top; --right; --bottom;
			}

			canvas.width = right - left;
			canvas.height = bottom - top;
			context.drawImage(image, -left, -top);

			document.getElementById('trim-result').src = canvas.toDataURL();
		}
	}
}


function showTrimPanel(show){
	document.getElementById('panel-trim').style.display = show ? '' : 'none';
}

function loadMobileSrcs(style) { // 用于移动版的解包
	var list = [];
	var i = 0, prop;
	var count = 0;
	document.getElementById('unpackedSrc').innerHTML = '';
	while (prop = style.getPropertyValue('--c-srcUrl-' + i)) {
		(function(i1, prop) {
			var match = prop.match(/url\("(.+?)"\)/);
			if (match) {
				++count;
				var url = match[1];
				var xhr = new XMLHttpRequest();
				xhr.responseType = "blob";
				xhr.onload = function() {
					if (this.status == 200) {
						var blob = this.response;
						list[i1] = getFileURL(blob);
						templateBlobUrls.push(list[i1]);
						if (--count <= 1) {
							document.getElementById('unpackedSrc').innerHTML = '.card {'
							 + list.map(function(e, j) {
								return '--c-srcUrl-' + j + ': url("' + e + '")';
							}).join(';') + '}';
						}
					}
				}
				xhr.open("get", url, true);
				xhr.send();
			}
		})(i, prop);
		++i;
	}

}

function convertCommonStyle() {
	var commonStyle = document.querySelector('[path=".css"]');
	if (commonStyle) {
		// TODO
	}
}


function setContainImageSize() {
	var card = document.querySelector('#result .card');
	if (!card) return;

	var imageContainers = card.getElementsByClassName('illustration');
	var image = imageContainers[0].children[0];
	var image2 = imageContainers[1].children[0];
	if (image && image.naturalWidth) {
		var naturalWidth = image.naturalWidth;
		var naturalHeight = image.naturalHeight;
		var drag = card.drag;
		var coordinates;
		var coordVar;
		if (image2 && image2.getAttribute('src')) {
			coordVar = getComputedStyle(card).getPropertyValue('--illustration-front-coordinates');
		}else{
			coordVar = getComputedStyle(card).getPropertyValue('--illustration-coordinates');
		}
		if (coordVar) {
			coordinates = coordVar.trim().split(/\s+/).map(function(e) {
				return parseInt(e);
			});
		}else{
			coordinates = [0, 0, card.clientWidth, card.clientHeight];
		}
		if (drag) {
			var scale = Math.max(coordinates[2] / image.naturalWidth, coordinates[3] / image.naturalHeight);
			var width = image.naturalWidth * scale;
			var height = image.naturalHeight * scale;
			var left = (coordinates[2] - width) / 2 + coordinates[0];
			var top = (coordinates[3] - height) / 2 + coordinates[1];
			image.style.width = width + 'px';
			image.style.height = height + 'px';
			image.style.left = left + 'px';
			image.style.top = top + 'px';
			if (image2) {
				image2.style.width = image.style.width;
				image2.style.height = image.style.height;
				image2.style.left = image.style.left;
				image2.style.top = image.style.top;
			}
			drag.x = left;
			drag.y = top;
			drag.factor = scale;
			imageAdjustFeedback(image);
		}
	}
}


function loadFontPackage() {
	var cssElement = document.querySelector('[path="res/common.css"]');
	if (cssElement) {
		alert('您需要加载字体包（pak文件）才能正确生成图片。点击页面以进行该操作。');
		var face = document.createElement('div');
		face.setAttribute('style', 'position: fixed; z-index: 1000; background-color: white; opacity: 0.5; left: 0; right: 0; top: 0; bottom: 0;');
		document.body.appendChild(face);

		face.onclick = function() {
			var fileInput = document.createElement('input');
			fileInput.type = 'file';
			fileInput.onchange = function() {
				var file = this.files[0];
				if (file) {
					var fonts = [];
					var fr = new FileReader();
					fr.onloadend = function(){
						var content = this.result;
						var length = content.byteLength;
						var offset = 0;
						while (offset < length) {
							var l = new Uint32Array(content.slice(offset, offset + 4))[0];
							offset += 4;
							var n = Array.prototype.map.call(
								new Uint8Array(content.slice(offset, offset + l)),
								function(e) {
									return String.fromCharCode(e);
								}).join('');
							offset += l;
							var k = new Uint32Array(content.slice(offset, offset + 4))[0];
							offset += 4;
							var f = content.slice(offset, offset + k);
							offset += k;
							fonts.push({name: n.toLowerCase(), content: getFileURL(new Blob([f]))});
						}
						if (fonts.length > 0) {
							cssElement.innerHTML = cssElement.innerHTML.replace(/\.\.\/fonts\/[^)'"]+/g, function(r) {
								var path = r.toLowerCase();
								for (var i = fonts.length - 1; i >= 0; --i ){
									if (fonts[i].name == path) {
										return fonts[i].content;
									}
								}
							});
							document.body.removeChild(face);
						}
					}
					fr.readAsArrayBuffer(file);
				}
			}
			fileInput.click();
		}
	}
}

var currentTextArea = null;
var lastTextTimeout = null;
var toolbarFont = false;
function setTextToolbar(element) {
	var hint = document.getElementById('textToolbar');
	if (element) {
		hint.style.opacity = '';
		var offsetX = element.offsetLeft;
		var offsetY = element.offsetTop;
		hint.style.left = offsetX + 'px';
		hint.style.top = offsetY + 'px';
		hint.style.display = 'initial';
		currentTextArea = element;
		clearTimeout(lastTextTimeout);
	}else{
		clearTimeout(lastTextTimeout);
		lastTextTimeout = setTimeout(function() {
			if (!toolbarFont) {
				hint.style.display = '';
				currentTextArea = null;
			}
		}, 200);
	}
}
function toggleTagPairs(prefix, postfix) {
	if (currentTextArea) {
		var start = currentTextArea.selectionStart;
		var end = currentTextArea.selectionEnd;
		var text = currentTextArea.value.slice(start, end);
		var prefixLength = prefix.length;
		var postfixLength = postfix.length;
		if (text.slice(0, prefixLength) == prefix && text.slice(-postfixLength) == postfix) {
			currentTextArea.setRangeText(text.slice(prefixLength, -postfixLength), start, end);
			currentTextArea.setSelectionRange(start, end - prefixLength - postfixLength);
		}else{
			currentTextArea.setRangeText(prefix + text + postfix, start, end);
			currentTextArea.setSelectionRange(start, end + prefixLength + postfixLength);
		}
		currentTextArea.focus();
	}
}

function editHotkey(event) {
	if (event.ctrlKey) {
		switch (event.keyCode) {
			case 66: toggleTagPairs('<b>', '</b>'); break;
			case 73: toggleTagPairs('<i>', '</i>'); break;
			case 85: toggleTagPairs('<u>', '</u>'); break;
			case 68: toggleTagPairs('<del>', '</del>'); break;
			default: return;
		}
		event.preventDefault();
	}
}