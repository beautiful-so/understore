(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.understore = factory());
}(this, (function () {
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
			fetch : Fetch,
			then : Then,
			catch : Catch,
			abort : Abort,
			init : Init,
			addItem : function(option){
				option = Async(option, "init");
				return option ? Init(option) : undefined;
			},
			setItem : function(option){
				option = Async(option, "setItem");
				option ? SetItem(option) : undefined;
				return;
			},
			removeItem : function(option){
				option = Async(option, "removeItem");
				option ? RemoveItem(option) : undefined;
				return;
			},
			clear : function(option){
				option = Async(option, "clear");
				option ? Clear(option) : undefined;
				return;
			}
		};

		Chain.duration = 10;
		Chain.tasks = [];
		Await.tasks = [];
		Catch.error = [];

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
	
	function Request(url, obj){
		Fetch.request = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
		Request.timeout = obj.timeout ? setTimeout(Abort, obj.timeout) : false;
		if(obj.cache){
			var _url = url.indexOf("?") > -1 ? "&" : "?";
			url += _url+Math.random().toString(36).substring(7);
		}
		Fetch.request.onreadystatechange = function (e) {
			try{
				if (e.target.readyState == 4) {
					clearTimeout(Request.timeout);
					delete Request.timeout;

					var res = {
						status : e.target.status,
						body : {}
					};

					try{
						res.body = JSON.parse(e.target.responseText);
					}catch(err){
						res.body = "";
						res.body = e.target.responseText;
					}

					delete Fetch.request;
					Chain(res);
				}
			}catch(err){
				delete Fetch.request;
				console.log(err);
			}
		};
		Fetch.request.open(obj.method, url, true);
		if(obj.headers){
			for (var header in obj.headers) {
				if(obj.headers.hasOwnProperty(header)){
					Fetch.request.setRequestHeader(header, obj.headers[header]);
				}
			}
		}
		obj.body ? Fetch.request.send(obj.body) : Fetch.request.send();	
	}

	function Abort(){
		if(typeof Fetch.request == "object"){
			Fetch.request.abort();
			delete Fetch.request;
			Chain.tasks.splice(0,Chain.tasks.length);
		}
	}

	function Fetch(url, obj){
		clearInterval(Chain.task);
		try{
			if(typeof url == "string"){
				if(typeof obj == "undefined"){
					obj = {
						method : "GET"
					};
				}else{
					obj.method = typeof obj.method == "undefined" ? "GET" : obj.method;
				}
				var _task = [url, obj];
				_task.key = "fetch";

				Chain.tasks.push(_task);
				Chain.task = setInterval(Chain, Chain.duration);

				return {
					then : Then,
					fetch : Fetch,
					catch : Catch
				};
			}
		}catch(err){
			console.log(err);
		}
	}

	function Chain(res){
		clearInterval(Chain.task);
		try{
			if(Chain.tasks.length > 0){
				var task = Chain.tasks.shift();
				var key = task.key;

				if(key == "fetch"){
					Request(task[0], task[1]);
				}else if(key == "catch"){
					if(Catch.error.length){
						task(Catch.error);
						Catch.error.splice(0, Catch.error.length);
					}
				}else if(key == "then"){
					typeof res != "undefined" ? task(res) : task();
					Chain();
				}else{
					Catch.error.splice(0, Catch.error.length);
				}
			}
		}catch(err){
			Catch.error.push(err);
			console.log(err);
			clearInterval(Chain.task);
		}
	}
	
	function Catch(task){
		clearInterval(Chain.task);
		try{
			if(typeof task == "function"){
				task.key = "catch";
				Chain.tasks.push(task);
				if (Chain.tasks.length == 1)
					Chain.task = !Chain.task ? setInterval(Chain, Chain.duration) : undefined;
				return {
					then : Then,
					fetch : Fetch,
					catch : Catch 
				};
			}
		}catch(err){
			console.log(err);
		}
	}

	function Then(task){
		clearInterval(Chain.task);
		try{
			if(typeof task == "function"){
				task.key = "then";
				Chain.tasks.push(task);
				Chain.task = setInterval(Chain, Chain.duration);

				return {
					then : Then,
					fetch : Fetch,
					catch : Catch 
				};
			}
		}catch(err){
			console.log(err);
		}
	}

	function Await(o){
		if(o){
			if(!o.option.promise){
				o.option.promise = true;
				if(typeof Await.task != "undefined"){
					Await.tasks.push(o);
					clearInterval(Await.task);
					Await.task = setInterval(Await, 9);
					return;
				}else if(typeof Await.task == "undefined"){
					Await.task = true;
				}
			}
		}else{
			var task = Await.tasks.shift();

			if(task){
				var option = task.option;
				understore[task.action](option);
			}else{
				Await.tasks.length = 0;
				clearInterval(Await.task);
				delete Await.task;
			}
		}

		return o;
	}

	function Async(option, action){
		var states = Await({option: option, action:action});
		
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
				if(Chain.tasks.length == 0){
					var id = event.id  = _option.id;
					var idx= event.idx = _option.idx;
					var __dom = dom[id][idx];

					var o = GetItem(_option);
					event.element = element;
					event.data = o.data;
					if(_option.parent){
						event.parent = GetItem(_option.parent);
					}

					if(__dom){
						for (var property in __dom) {
							if(__dom.hasOwnProperty(property)){
								if(property.indexOf("on") == 0){
									var type = __dom[property].events.type;
									var handle = __dom[property].events.handle;

									__dom[property].events.element.removeEventListener(type, handle);
								}
							}
						}
					}

					option.events[_value](event);

					if(_dom){
						for (var property in _dom) {
							if(_dom.hasOwnProperty(property)){
								if(property.indexOf("on") == 0){
									var type = _dom[property].events.type;
									var handle = _dom[property].events.handle;

									_dom[property].events.element.addEventListener(type, handle);
								}
							}
						}
					}
				}
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
			if(obj1.hasOwnProperty(prop) && prop != '__proto__'){
				DiffChanged(v, prop);
			}
		}
	}

	function StorageChanged(e){
		if(e.oldValue != e.newValue){
			var newValue = typeof e.newValue != "undefined" && e.newValue != "" ? JSON.parse(e.newValue) : "";
			var oldValue = typeof e.oldValue != "undefined" && e.oldValue != "" ? JSON.parse(e.oldValue) : "";
			clearInterval(Await.task);
			var key = e.key;
				key = key.split("-!#");
			var id = key[0];
			var idx = key[1];
			var option = new Object(options[id]);
			var _dom = dom[id][idx];

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
					Await.task = setInterval(Await);
				}else if(!newValue){
					option.type = "remove";
					var _idx = index[id].indexOf(idx*1);
					option.data = [newValue];

					if(_dom){
						for (var property in _dom) {
							if(_dom.hasOwnProperty(property)){
								if(property.indexOf("on") == 0){
									var type = _dom[property].events.type;
									var handle = _dom[property].events.handle;
									_dom[property].events.element.removeEventListener(type, handle);
								}
							}
						}
					}

					_dom.node.parentNode.removeChild(_dom.node);
					delete _dom;

					index[id].splice(_idx, 1);

					if(index[id].length == 0){
						delete $for[id];
					}

					option.sync ? SetCookie(id, index[id]) : "";
					Await.task = setInterval(Await);
				}
				ChangedItem(option);
			}
		}
	}

	function While(id){
		clearInterval(Await.task);
		var len = $for[id].len;
		var idx = $for[id].idx;
		var option = $for[id].option;

		if(option.cache){
			option.idx = index[id].length ? index[id][idx] : idx;
		}else{
			option.idx = index[id].length ? Math.max.apply(null, index[id])+1 : idx;
		}

		var sync = options[id].sync;
		var key = getIdx(option, option.idx);
		var data = option.data[idx];

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
				Await.task = setInterval(Await);
			}
		}else if(option.sync){
			var len = index[option.id].length;
			var for_type = typeof $for[option.id] == "undefined";
			var typeof_array = typeof option.data == "undefined";

			$for[option.id] = {
				idx : 0,
				len : len,
				option : option,
				type : typeof_array
			};
		}
	}

	function getIdx(option, idx){
		var id = option.id;
		var key = id + "-!#" + idx;
		return key;
	}

	function ChangedItem(option){
		option.changed ? option.changed(option) : "";
	}

	function Init(option){
		var id = option.id;

		typeof options[id] == "undefined" ? options[id] = option : "";
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

				$for[option.id] = {
					idx : 0,
					len : len,
					option : option,
					type : typeof_array
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
		
		if(oldValue != "undefined"){
			oldValue = JSON.parse(oldValue);
			oldValue != null ? delete oldValue.$tate : "";
			oldValue = JSON.stringify(oldValue);
		}

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