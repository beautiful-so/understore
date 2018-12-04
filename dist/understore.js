(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.understore = factory());
}(this, (function () { 'use strict';
	var understore = {};
	var $tore;
	var $dom, dom = {};
	var options = {};
	var events = {};
	var $for = {};
	var index = {};

	(function () { 
		var uid = Math.random().toString(36).substring(7);
		var ifrm = document.createElement("iframe");
		ifrm.setAttribute("src", "about:blank");
		ifrm.id = "understore"+uid;

		window.addEventListener("storage", StorageChanged);
		document.head.appendChild(ifrm);
		$dom = document.getElementById("understore"+uid).contentDocument;
		$tore = document.getElementById("understore"+uid).contentWindow;

		typeof window._ == "undefined" ? window._ = {} : "";

		understore = {
			getCookie : GetCookie,
			setCookie : SetCookie,
			getItem : GetItem,
			getItems : GetItems,
			init : Init,
			addItem : function(option){
				option = Async(option, "init");
				option ? Init(option) : "";
			},
			setItem : function(option){
				option = Async(option, "setItem");
				option ? SetItem(option) : "";
			},
			removeItem : function(option){
				option = Async(option, "removeItem");
				option ? RemoveItem(option) : "";
			},
			clear : function(option){
				var len = 0;
				option = Async(option, "clear");
				len = option ? Clear(option) : 0;
			}
		};

		mixin(window._, understore);
	})();

	function mixin(receiver, supplier) {
		for (var property in supplier) {
			if(supplier.hasOwnProperty(property)){
				receiver[property] = supplier[property];
			}
		}
		return receiver;
	}

	function Await(o){
		var states, task;

		if(o){
			var idx = index[o.option.id];
			if(typeof Await.promise == "undefined"){
				!Await.tasks ? Await.tasks = [] : "";
				if(typeof Await.tasks == "object"){
					if(o.action == "init"){
						states = typeof idx != "undefined" ? false : o;
					}else{
						states = o;
					}
				}else{
					states = o;
				}
			}else{
				if(o.promise){
					states = o;
				}else{
					o.promise = true;
					if(o){
						states = o;
					}else{
						Await.tasks.push(o);
						task = Await.tasks.shift();

						if(task){
							understore[task.action](task);
						}
					}
				}
			}
		}else{
			task = Await.tasks.shift();

			if(task){
				understore[task.action](task);
			}else{
				Await.promise = false;
			}
		}

		return states;
	}

	function Async(option, action){
		var states = Await({option: option, action:action, promise : option.promise});

		if(typeof option.option != "undefined"){
			var promise = option.option.promise;
			option = option.option;
			option.promise = promise;
		}else{
			option = states ? option : states;
		}
		return option;
	}

	function Template(html, obj, id, idx){
		var re = /{([^}]+)?}/g, code = 'var r=[];\n', cursor = 0, match;
		var reThis = /this\./g;
		var eRe = /(@\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;
		var attrRe = /(\S+)=["']/g;
		var add = function(line, js) {
			var on = line.match(eRe);
			var key = "";
			var handler = "";setTimeout(function(){},0);
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
					_key = _key != $key ? "-"+$key+"=\\\""+_key+"\\\"" : "-"+_key;\
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

	function Render(option, data){
		var _dom = dom[option.id][option.idx.toString()] = {};
		var element = document.createElement("div");
			element.innerHTML = option.body;

		var tagName = element.childNodes[0].nodeName.toLowerCase();
			element = element.querySelector(tagName);
		
		function eventBind(event, element, option, _option, _value){
			return function(event){
				var o = GetItem(_option);
				event.id  = _option.id;
				event.idx = _option.idx;
				event.element = element;
				event.data = o.data;
				if(_option.parent){
					event.parent = GetItem(_option.parent);
				}
				Await.tasks = [];
				option.events[_value](event);
			};
		}

		function parse(target, node, data){
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

						var name  = attribute.nodeName;
						var value = attribute.nodeValue;

						if (name.indexOf("_") == 0){
							var _name = name.replace("_", "");
							var _value = attribute.nodeValue;
							_dom[_name] = {
								element : childNode,
								attr : _value,
								event : {}
							};
							setTimeout(function(childNode, name){
								childNode.removeAttribute(name);
							}, 0, childNode, name);
						}

						if(name.indexOf("-") == 0){
							var _name = name.replace("-", "");
							var _value = attribute.nodeValue;
							_dom[_name] = {
								element : childNode,
								attr : _value,
								event : {}
							};
							setTimeout(function(childNode, name){
								childNode.removeAttribute(name);
							}, 0, childNode, name);
						}

						if(name.indexOf("on") == 0){
							var _value = attribute.nodeValue;
							var _option = JSON.stringify(option);
								_option = JSON.parse(_option);
							var handle = eventBind(window.event, element, option, _option, _value);

							childNode.addEventListener(name.replace("on", ""), handle);
							if(_dom[name]){
								_dom[name].events = {
									type : name.replace("on", ""),
									element : childNode,
									handle : handle
								};
							}else{
								_dom[name] = {
									events : {
										type : name.replace("on", ""),
										element : childNode,
										handle : handle
									}
								};
							}

							setTimeout(function(childNode, name){
								childNode.removeAttribute(name);
							}, 0, childNode, name);
						}
					}
				}

				if (childNode.parentNode == node) {
					if (childNode.childNodes.length) {
						var _target = document.createElement(nodeName);
						parse(_target, childNode, data);
					} else {
						_dom.node = element;
						if(option.insert == "prepend"){
							option.target.insertBefore(element);
						}else{
							option.target.appendChild(element);
						}
					}
				} 
			}
		}
		parse(option.target, element, data);
	}

	function Repaint(o, value){
		var el = o.element;
		var attr = o.attr;

		if(attr){
			el[attr] = value;
			el.setAttribute(attr, value);
		}else{
			el.innerHTML = value;
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
			attr = attr.toLowerCase();
			if(_dom){
				if(_dom[attr]){
					Repaint(_dom[attr], value);   
				}
			}
		}
	}

	function Diff(obj1, obj2, v) {
		for (var prop in obj1) {
			obj1.hasOwnProperty(prop) && prop != '__proto__' ? obj1[prop] != obj2[prop] ? DiffChanged(v, prop) : "" : "";
		}
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

			if(typeof idx != "undefined"){
				var state = newValue ? newValue.$tate : "";
				option.idx = idx*1;
				option.type = state.type;

				if(state.type === "add"){
					option.insert = state.insert;
					option.cache = false;
					option.body = Template(option.template, newValue, id, idx, state.parent);
					state.parent ? newValue.parent = state.parent : "";

					Continue(option, newValue);
				}else if(state.type === "set"){
					newValue.id = id;
					newValue.idx = idx;
					option.data = [newValue];
					delete newValue.$tate;
					Diff(newValue, oldValue, option);
				}else if(!newValue){
					option.type = "remove";
					var _idx = index[id].indexOf(idx*1);
					option.data = [newValue];

					for (var property in dom[id][idx]) {
						if(dom[id][idx].hasOwnProperty(property)){
							if(property != "property"){
								if(property.indexOf("on") == 0){
									for(var e in dom[id][idx][property].events){
										var type = dom[id][idx][property].events.type;
										var handle = dom[id][idx][property].events.handle;
										dom[id][idx][property].events.element.removeEventListener(type, handle);
									}
								}
							}
						}
					}

					dom[id][idx].node.parentNode.removeChild(dom[id][idx].node);
					delete dom[id][idx];

					index[id].splice(_idx, 1);

					if(index[id].length == 0){
						delete $for[id];
					}

					option.sync ? SetCookie(id, index[id]) : "";
				}
				ChangedItem(option);
			}
			Await.promise = true;
			Await();
		}
	}

	function While(id){
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
				data.parent = option.parent;

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
				data.id = option.id;
				data.idx = option.idx;
				option.parent = parent;
				Continue(option, data);
			}
		}		
	}

	function Continue(option, data){
		Render(option, data);

		!option.cache ? option.insert == "prepend" ? index[option.id].unshift(option.idx) : index[option.id].push(option.idx) : "";
		!option.cache && option.sync ? SetCookie(option.id, index[option.id]) : "";

		if(typeof $for[option.id] != "undefined"){
			if($for[option.id].idx < $for[option.id].len){
				$for[option.id].idx = $for[option.id].idx+1;
				While(option.id);
			}else{
				delete option.cache;
				typeof option.created != "undefined" ? option.created(option) : "";
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

	function Init(option){
		var id = option.id;
		typeof option.events != "undefined" ? events[id] = option.events : "";
		typeof option.css != "undefined" ? SetStyle(option) : "";

		typeof dom[id] == "undefined" ? dom[id] = {} : "";
		typeof index[id] == "undefined" ? index[id] = [] : "";

		index[id] = option.sync ? JSON.parse("["+GetCookie(id)+"]") : index[id];
		var len = index[id].length;

		if(len > 0 && option.sync){
			option.data = [];
			for(var i = 0; i < len; i++){
				var idx = index[id][i];
				var key = id+"-!#"+idx;
				var data = option.sync ? localStorage.getItem(key) : sessionStorage.getItem(key);
				var obj = JSON.parse(data);

				if(obj){
					typeof obj.$tate != "undefined" ? obj.parent = obj.$tate.parent : "";
					option.data.push(obj);
				}
			}
		}
		return AddItem(option);
	}

	function AddItem(option){
		var id = option.id;
		if(typeof options[id] == "undefined"){
			options[id] = option;
		}

		if(typeof option.data != "undefined"){
			var typeof_array = typeof option.data.length == "undefined";
			option.data = typeof_array ? [option.data] : option.data;

			if(option.data.length > 0){
				var len = option.data.length-1;
				var for_type = typeof $for[id] == "undefined";
				if(typeof option.template == "undefined"){
					option.template = options[id].template;
					option.target = options[id].target;
				}else{
					option.cache = option.sync ? true : false;
				}

				if(!for_type){
					index[id].length ? $for[id].len = Math.max.apply(null, index[id]) : "";
				}

				$for[option.id] = {
					idx : (for_type ? 0 : $for[id].idx + 1),
					len : (for_type ? len : $for[id].len + 1),
					option : option,
					type : typeof_array,
					promise : undefined
				};
				return While(id);
			}
		}
	}

	function SetItem(option){
		var id = option.id;
		typeof option.idx == "undefined" ? option.idx = 0 : "";
		typeof option.template == "undefined" ? option.template = options[id].template : "";
		var key = getIdx(option, option.idx);
		var sync = options[id].sync;
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
	}

	function GetItems(option){
		var data = [];
		var id = option.id;
		var item = index[id];

        if(item){
        	var len = item.length;
            for(var i = 0; i < len; i++){
                var idx = typeof index[id][i] != "undefined" ? index[id][i] : 0;
                data.push(GetItem({id : option.id, idx :idx}));
            }
        }

		return data;
	}

	function GetItem(option){
		var data = {};
		var id = option.id;
		var _dom = dom[id];

		if(typeof _dom != "undefined"){
			var idx = option.idx;
			var key =id+"-!#"+idx;
			var len = Object.keys(_dom).length-1;
			var sync = options[id].sync;
			var d = sync ? localStorage.getItem(key) : sessionStorage.getItem(key);
				d = d ? JSON.parse(d) : null;

			data = {data : d, element : _dom[idx].node, id : id, idx : idx};
		}else{
			data = null;
		}

		return data;
	}

	function RemoveItem(option){
		var id = option.id;
		var idx = option.idx;
		var key = id+"-!#"+idx;
		var v, sync = options[id].sync;
			v = sync ? $tore.localStorage.removeItem(key) : $tore.sessionStorage.removeItem(key);
		return;
	}

	function Clear(option){
		var id = option.id;
		var item = index[id];
		var len = item ? item.length : false;

		if(len){
			var end = len-1;
			for(var i = 0; i < len; i++){
				understore.removeItem({id : id, idx : item[i]}); 
			}
		}

		return;
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
		var id = option.id;
		var cssText = "";
		var uid = Math.random().toString(36).substring(7);
		var link = document.createElement("link");
		link.href = option.css;
		link.id = uid;
		link.rel = "stylesheet";
		link.type = "text/css";
		link.onload = function(){
			var $tyle = document.createElement('style');
			$tyle.id = uid+id;
			var style = $dom.styleSheets[0];
			document.head.appendChild($tyle);
			$dom.getElementById(uid).outerHTML = "";

			for(var i = 0, len = style.cssRules.length; len > i; i++){
				var cssRule = style.cssRules[i];

				if(cssRule.style){
					cssRule.cssText.indexOf(":root") === -1 ? cssText += id+" "+cssRule.cssText : cssText += cssRule.cssText.replace(/:root/gi, id);
				}else{
					var rule = "";
					for(var s = 0,len = cssRule.cssRules.length; s < len; s++){
						cssRule.cssRules[s].cssText.indexOf(":root") === -1 ? rule += id+" "+cssRule.cssRules[s].cssText : rule += cssRule.cssRules[s].cssText.replace(/:root/gi, id);
					}
					cssText += "@media "+cssRule.media.mediaText + "{"+rule+"}";
				}
			}
			$tyle.textContent = cssText;
			localStorage.setItem("$tyle_"+id, option.css+"_$tyle"+cssText);
		};
		$dom.head.appendChild(link);
		return cssText;
	}

	function SetStyle(option){
		var id = option.id;
		if(typeof option.css != "undefined" && !document.getElementById("understore_style"+id)){
			var cache = localStorage.getItem("$tyle_"+id);

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

	return understore;
})));