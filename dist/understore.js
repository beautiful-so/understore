(function (global, factory) {
	understore = typeof _ == "undefined" ? _ = {} : {};
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.understore = factory());
}(this, (function () { 'use strict';
	var $tore, $ync = true;
	var $dom, dom = {};
	var options = {};
	var $for = {};
	var index = {};

	(function () { 
		var uid = Math.random().toString(36).substring(7);
		var ifrm = document.createElement("iframe");
		ifrm.setAttribute("src", "about:blank");
		ifrm.id = "understore"+uid;

		window.onfocus = function(e){$ync = true;};
		window.onblur = function(e){$ync = false;};
		window.onstorage = StorageChanged;
		document.head.appendChild(ifrm);
		$dom = document.getElementById("understore"+uid).contentDocument;
		$tore = document.getElementById("understore"+uid).contentWindow;

		understore.getItem = GetItem;
		understore.getItems = GetItems;
		understore.addItem = AddItem;
		understore.setItem = SetItem;
		understore.clear = Clear;
		understore.removeItem = RemoveItem;
		understore.getCookie = GetCookie;
		understore.setCookie = SetCookie;
		
		mixin(_, understore);
	})();

	function mixin(receiver, supplier) {
		for (var property in supplier) {
			if(supplier.hasOwnProperty(property)){
				receiver[property] = supplier[property]
			}
		}
		return receiver;
	}

	function Repaint(o, value){
		var el = o.element;
		var attr = o.attr;

		if(attr == ""){
		   el.innerHTML = value;
		}else if(attr == "value"){
			el[attr] = value;
		}else{
			el.setAttribute(attr, value);
		}
	}

	function DiffChanged(v, prop){
		var id = v.id;
		var value = v.data[0][prop];
		var _dom = dom[v.id][v.idx];
		var k = "";
		var attr = prop;

		if(typeof value === "object"){
			var path = JSON.stringify(value);
			path = path.replace(/":/g,"\\\.").replace(/{"/g,"").split("\\\.");
			path.pop();
			if(path.length){
				for(var i = 0, len = path.length; i < len; i++){
					value = value[path[i]];
				}
			}
			k = prop+"-"+path.toString().replace(/,/g, "-");
		}else{
			k = prop;
		}

		if(k != "$ync"){
			Repaint(_dom[attr], value);
			
		}
	}

	function Diff(obj1, obj2, v) {
		for (var prop in obj1) {
			obj1.hasOwnProperty(prop) && prop != '__proto__' ? obj1[prop] != obj2[prop] ? DiffChanged(v, prop) : "" : "";
		}
	}

	function Template(html, obj, id, idx){
		var re = /{([^}]+)?}/g, code = 'var r=[];\n', cursor = 0, match;
		var reThis = /this\./g;
		var eRe = /(@\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;
		var attrRe = /(\S+)=["']/g;
		var add = function(line, js) {
			var on = line.match(eRe);
			var key = "";
			var handler = "";
			if(on){
				for(var i = 0, len = on.length-1; i <= len; i++){
					var _on = on[i].split("=");
					line = line.replace(/@/, "on");
					handler = "\""+_on[1].replace(/[\'\""]/g,"")+"\"";
					line = line.replace(_on[1], handler);
				}
			}else if(reThis.exec(line) != null){
				key = line.replace(reThis, "");
				key = key.replace(/\./g, "-");
				key = key.replace(/ /g, "");
			}
			var _code = '\
			var s = r[r.length-1];\
			var key = s.match('+attrRe+');\
			var $key = "'+key+'";\
			if(s[s.length-1] == ">") { \
				r[r.length-1] = s.replace(/>$/," _'+key+'>")\
			}else if(key){\
				key = key[key.length-1];\
				var _key = key.replace("=\\\"", "").replace("=\\\'", "");\
				_key = _key != $key ? "-"+$key+"=\\\""+_key+"\\\"" : "_"+_key;\
				r[r.length-1] = s.replace(key, ""+_key+" "+key);\
			};\
			r.push(' + line + ');\n\n';
			var _line = 'r.push("' + line.replace(/"/g, '\\"') + '");\n';
			js ? (code += _code) : (code += line != '' ? _line : '');
			return add;
		};
		while(match = re.exec(html)) {
			add(html.slice(cursor, match.index))(match[1], true);
			cursor = match.index + match[0].length;
		}
		add(html.substr(cursor, html.length - cursor));
		code += 'return r.join("");';
		return new Function(code.replace(/[\r\t\n]/g, '')).apply(obj);
	}

	function Typeof_option(option){
		return typeof option.option != "undefined" ? option.option : option;
	}

	function StorageChanged(e){
		if(e.oldValue != e.newValue){
			var newValue = typeof e.newValue != "undefined" && e.newValue != "" ? JSON.parse(e.newValue) : "";
			var oldValue = typeof e.oldValue != "undefined" && e.oldValue != "" ? JSON.parse(e.oldValue) : "";

			var key = e.key;
				key = key.split("-!#");
			var id = key[0];
			var idx = key[1];
			var option = new Object(options[id]);

			if($ync || option.sync){
				if(typeof idx != "undefined"){
					var state = newValue ? newValue.$tate : "";
					option.idx = idx*1;
					option.type = state.type;

					if(state.type === "add"){
						option.insert = state.insert;
						option.cache = false;

						option.body = Template(option.template, newValue, id, idx, state.parent);
						Async(option);
					}else if(state.type === "set"){
						option.data = [newValue];
						delete newValue.$tate;
						Diff(newValue, oldValue, option);
					}else if(!newValue){
						option.type = "remove";
						var _idx = index[id].indexOf(idx*1);
						option.data = [newValue];
						dom[id][idx].parentNode.removeChild(dom[id][idx]);
						delete dom[id][idx];

						index[id].splice(_idx, 1);

						if(index[id].length == 0){
							delete $for[id];
						}

						option.sync ? SetCookie(id, index[id]) : "";
					}
					ChangedItem(option);
				}
			}
		}
	}

	function Render(option){
		var _dom = dom[option.id];
			_dom =_dom[option.idx.toString()] = {};
		var element = document.createElement("div");
			element.innerHTML = option.body;

		var tagName = element.childNodes[0].nodeName.toLowerCase();
			element = element.querySelector(tagName);

		function parse(target, node){
			for (var i = 0, len1 = node.childNodes.length; i < len1; i++) {
				var childNode = node.childNodes[i];
				var nodeType = childNode.nodeType;
				var nodeName = childNode.nodeName.toLowerCase();
				var _nodeName = nodeName.replace("#", "");
				var nodeValue = childNode.nodeValue;
				var attributes = childNode.attributes;

				if (attributes){
					for (var c = 0, len2 = attributes.length; c < len2; c++) {
						var attribute = attributes[c];
						if (attribute.specified) {
							var name  = attribute.nodeName;
							var value = attribute.nodeValue;
							
							
							if (name.indexOf("_") == 0){
								setTimeout(function(childNode, name, value, _dom_){
									var _name = name.replace("_", "");
									_dom_[_name] = {
										element : childNode,
										attr : value
									};
									childNode.removeAttribute(name);
								}, 0, childNode, name, value, _dom);
							}
							if(name.indexOf("-") == 0){
								setTimeout(function(childNode, name, value, _dom_){
									var _name = name.replace("-", "");
									_dom_[_name] = {
										element : childNode,
										attr : value
									};
									childNode.removeAttribute(name);
								}, 0, childNode, name, value, _dom);
							}

							if(name.indexOf("on") > -1){
								setTimeout(function(childNode, name, value){
									childNode.addEventListener(name.replace("on", ""), function(event){
										option.events[name](event, this, option);
									});
									childNode.removeAttribute(name);
								}, 0, childNode, name, value);
							}

						}
					}
				}

				if (childNode.parentNode == node) {
					if (childNode.childNodes.length) {
						var _target = document.createElement(nodeName);
						parse(_target, childNode);
					} else {
						if(option.insert == "prepend"){
							option.target.insertBefore(element);
						}else{
							option.target.appendChild(element);
						}
					}
				} 
			}
		}
		parse(option.target, element);
	}

	function Async(option){
		Render(option);

		!option.cache ? option.insert == "prepend" ? index[option.id].unshift(option.idx) : index[option.id].push(option.idx) : "";
		!option.cache && option.sync ? SetCookie(option.id, index[option.id]) : "";

		if(typeof $for[option.id] != "undefined" && $ync){
			if($for[option.id].idx < $for[option.id].len){
				$for[option.id].idx = $for[option.id].idx+1;
				Loop(option.id);
			}else{
				delete option.cache;
				ChangedItem(option);
			}
		}else if(option.sync){
			var len = index[option.id].length;
			var for_type = typeof $for[option.id] == "undefined";
			var typeof_array = typeof option.data == "undefined";

			!for_type && index[option.id].length ? $for[option.id].len = Math.max.apply(null, index[option.id]) : "";
			!for_type && index[option.id].length ? $for[option.id].id = Math.max.apply(null, index[option.id]) : "";
			$for[option.id] = {
				idx : (for_type ? 0 : $for[option.id].idx + 1),
				len : (for_type ? len : $for[option.id].len + 1),
				option : option,
				type : typeof_array,
				promise : undefined
			};
		}
	}

	function getIdx(option, idx){
		var id = option.id;
		var len = typeof dom[id] != "undefined" ? Object.keys(dom[id]).length : 0;
		var key = id + "-!#" + (typeof idx != "undefined" ? idx : len);
		return key;
	}

	function ChangedItem(option){
		option.changed ? option.changed(option) : "";
	}

	function AddItem(option){
		if(!understore){
			understore = typeof _ == "undefined" ? _ = {} : {};  
		}

		typeof option.events != "undefined" ? understore[option.id] = option.events : "";
		typeof option.created != "undefined" ? option.created(option) : "";
		typeof option.css != "undefined" ? SetStyle(option) : "";

		typeof dom[option.id] == "undefined" ? dom[option.id] = {} : "";
        typeof index[option.id] == "undefined" ? index[option.id] = [] : "";

		index[option.id] = option.sync ? JSON.parse("["+GetCookie(option.id)+"]") : index[option.id];
		var len = index[option.id].length;

		if(len > 0 && option.sync){
			option.data = [];
			option.cache = true;
			for(var i = 0; i < len; i++){
				var idx = index[option.id][i];
				var data = option.sync ? localStorage.getItem(option.id+"-!#"+[idx]) : sessionStorage.getItem(option.id+"-!#"+[idx]);

				if(obj){
					typeof obj.$tate != "undefined" ? obj.parent = obj.$tate.parent : "";
					option.data.push(obj);
				}
			}
		}else{
			option.cache = false;
		}
		return SyncItem(option);
	}

	function SyncItem(option){
		if(typeof options[option.id] == "undefined"){
			document.createElement(option.id);
			options[option.id] = option;
		}
		if(typeof option.data != "undefined"){
			var typeof_array = typeof option.data.length == "undefined";
			typeof_array ? option.data = [option.data] : "";
			if(option.data.length > 0){
				var len = option.data.length-1;
				var for_type = typeof $for[option.id] == "undefined";
				if(typeof option.template == "undefined"){
					option.template = options[option.id].template;
					option.target = options[option.id].target;
				}

				if(!for_type){
					index[option.id].length ? $for[option.id].len = Math.max.apply(null, index[option.id]) : "";
					$ync ? $for[option.id].idx = $for[option.id].len : "";
				}

				$for[option.id] = {
					idx : (for_type ? 0 : $for[option.id].idx + 1),
					len : (for_type ? len : $for[option.id].len + 1),
					option : option,
					type : typeof_array,
					promise : undefined
				};
				return Loop(option.id);
			}
		}
	}

	function Loop(id){
		var len = $for[id].len;
		var option = $for[id].option;
		var idx = $for[id].idx;
		var sync = options[id].sync;

		if(typeof dom[option.id] != "undefined" && !option.cache){
			option.idx = Object.keys(dom[id]).length;
		}else if(typeof index[option.id] != "undefined"){
			typeof index[option.id][idx] != "undefined" ? option.idx = index[option.id][idx]*1 : option.idx = idx;
		}else{
			option.idx = idx;
		}
		var key = getIdx(option, idx);

		var data = option.data[($for[id].type ? 0 : idx)];

		if(data){
			!sync ? data.$ync = Math.random().toString(36).substring(7) : "";
			var _data = JSON.stringify(data);

			if(!option.cache){
				data.$tate = {
					type : "add",
					parent : option.parent,
					insert : option.insert
				};
				_data = JSON.stringify(data);
				sync ? $tore.localStorage.setItem(key, _data) : $tore.sessionStorage.setItem(key, _data);
				return {id : id , idx : idx};
			}else{
				var parent;
				if(typeof data.$tate != "undefined"){
					parent = data.$tate.parent; 
					option.insert = data.$tate.insert;
				}
				option.body = Template(option.template, data, option.id, option.idx, parent);
				option.cache = true;
				Async(option);
			}
		
		}
	}

	function SetItem(option){
		typeof option.idx == "undefined" ? option.idx = 0 : "";
		typeof option.template == "undefined" ? option.template = options[option.id].template : "";
		var key = getIdx(option, option.idx);
		var sync = options[option.id].sync;
		var newValue = option.data;
		var oldValue = sync ? $tore.localStorage.getItem(key) : $tore.sessionStorage.getItem(key);

		oldValue = JSON.parse(oldValue);
		oldValue != null ? delete oldValue.$tate : "";
		oldValue = JSON.stringify(oldValue);
		var _newValue = JSON.stringify(newValue);

		if(oldValue != _newValue){
			typeof newValue.$tate == "undefined" ? newValue.$tate = { type : "set" } : newValue.$tate.type = "set";
			_newValue = JSON.stringify(newValue);
			sync ? $tore.localStorage.setItem(key, _newValue) : $tore.sessionStorage.setItem(key, _newValue);
		}
		return;
	}

	function GetItems(option){
		option = Typeof_option(option);
		var data = [];
		var id = option.id;
		var item = index[id];
		var len = item.length;

        if(len){
            for(var i = 0; i < len; i++){
                var idx = typeof index[id][i] != "undefined" ? index[id][i] : 0;
                data.push(GetItem({id : option.id, idx :idx}));
            }
        }

		return data;
	}

	function GetItem(option){
		option = Typeof_option(option);
		var data = {};
		var id = option.id;
		var _dom = dom[id];

		if(typeof _dom != "undefined"){
			typeof option.idx == "undefined" ? option.idx = 0 : "";
			var len = Object.keys(_dom).length-1;
			var sync = options[id].sync;
			var d = sync ? localStorage.getItem(id+"-!#"+option.idx) : sessionStorage.getItem(id+"-!#"+option.idx);
				d = d ? JSON.parse(d) : null;

			data = {data : d, element : _dom[option.idx], id : id, idx : option.idx};
		}else{
			data = null;
		}

		return data;
	}

	function RemoveItem(option){
		var v, sync = options[option.id].sync;
			v = sync ? $tore.localStorage.removeItem(option.id+"-!#"+option.idx) : $tore.sessionStorage.removeItem(option.id+"-!#"+option.idx);
		return v;
	}

	function Clear(option){
		var id = typeof option == "string" ? option : option.id;
		var item = index[id];
		var len = item ? item.length : false;

		if(len){
			for(var i = 0; i < len; i++){
				understore.removeItem({id : id, idx : item[i]});
			}
		}

		return len;
	}

	function SetCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
	}

	function GetCookie(cname) {
		var name = cname + "=";
		var decodedCookie = decodeURIComponent(document.cookie);
		var ca = decodedCookie.split(';');
		for(var i = 0; i <ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	function GetStyle(option){
		var cssText = "";
		var uid = Math.random().toString(36).substring(7);
		var link = document.createElement("link");
		link.href = option.css;
		link.id = uid;
		link.rel = "stylesheet";
		link.type = "text/css";
		link.onload = function(){
			var $tyle = document.createElement('style');
			$tyle.id = uid+option.id;
			var style = $dom.styleSheets[0];
			document.head.appendChild($tyle);
			$dom.getElementById(uid).outerHTML = "";

			for(var i = 0, len = style.cssRules.length; len > i; i++){
				var cssRule = style.cssRules[i];

				if(cssRule.style){
					cssRule.cssText.indexOf(":root") === -1 ? cssText += option.id+" "+cssRule.cssText : cssText += cssRule.cssText.replace(/:root/gi, option.id);
				}else{
					var rule = "";
					for(var s = 0,len = cssRule.cssRules.length; s < len; s++){
						cssRule.cssRules[s].cssText.indexOf(":root") === -1 ? rule += option.id+" "+cssRule.cssRules[s].cssText : rule += cssRule.cssRules[s].cssText.replace(/:root/gi, option.id);
					}
					cssText += "@media "+cssRule.media.mediaText + "{"+rule+"}";
				}
			}
			$tyle.textContent = cssText;
			localStorage.setItem("$tyle_"+option.id, option.css+"_$tyle"+cssText);
		};
		$dom.head.appendChild(link);
		return cssText;
	}

	function SetStyle(option){
		if(typeof option.css != "undefined" && !document.getElementById("understore_style"+option.id)){
			var cache = localStorage.getItem("$tyle_"+option.id);

			if(cache){
				cache = cache.split("_$tyle");
				if(option.css == cache[0]){
					var $tyle = document.createElement('style');
					$tyle.textContent = cache[1];
					document.head.appendChild($tyle);
				}else{
					GetStyle(option);  
				}	
			}else{
				GetStyle(option);
			}
		}
	}
})));