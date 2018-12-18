**웹 컴포넌트 개발시, 가상 돔과 데이터의 효율적인 상태관리와**
> **백그라운드 스토어** 에코시스템 기반의 **데이터 상태관리**를 사용하며 상태관리를 하며

>데이터의 업데이트에 따라 **각 탭**에 있는  **Virual Dom** 기반의 동일한 웹 컴포넌트의 데이터 싱크를 유지가능하게 해줍니다

>SNS 알림, 메일 알림등	탭간 다르게 보여지는 각 상태를 **새로고침 없이 동기화**를 가능하게 합니다.

**ajax 요청 구현시 유지보수 및 코드의 향상성을 떨어뜨리는 콜백 패턴이 아닌**

**[Promise](https://caniuse.com/#feat=async-functions) 패턴의 체이닝 메서드 구현을 통해 유지보수 및 코드의 향상성 관리가 가능합니다.**

> chrome, safari, firefox, Internet Explorer9 more than / cross browsing support

>자세한 내용은 아래 API 문서와 예제를 참조해주세요



## API

### _.addItem

addItem은 컴포넌트의 **생성**과 **추가**에 사용되는 메서드입니다.


**parameter** : {

>id: {string},

>template : {string},

>target : {dom.element},

>parent : {

>>id : {string},

>>idx : {number}

>},

>data : {object},

>created : {function},

>changed : {function},

>css : {url address}

}

**return** : {
> id : {string},

> idx : {number}

}

&nbsp;



**template** 과 **data** 바인딩

>script 태그 내에 삽입하는 방식과 자바스크립트 변수안에 템플릿을 삽입하는 방식을 사용하고 있으며 

>virtual dom 방식의 dom관리를 통해 스토어의 수정 발생시 템플릿의 해당 보간자 영역의 repaint의 가벼운 수정 방식을 사용하고 있습니다.

> [template type1 on jsfiddle](https://jsfiddle.net/understore/xjgxouLa/)

> [template type2 on jsfiddle](https://jsfiddle.net/understore/bzvxvL1w/)


**css**

>스타일은 css 파일의 경로 넣어 사용되며, 스타일 모듈화는 스타일과 중복되지 않도록 scoped 방식을 채용하고 있으며 있습니다. 

>컴포넌트(custom element) 셀렉터는 **:root** 입니다 

>[css import on jsfiddle](https://jsfiddle.net/understore/4y78mtpj/)


**events**는 이벤트 바인딩이며 @click="function_name"으로 바인딩이 가능하며 아래 예제를 참조

>[event bind on jsfiddle](https://jsfiddle.net/understore/z8c9ngku/)

&nbsp;

**생성**에서의 필수옵션은 id, template, target, data이며
추가 옵션은 events, css, sync 이며 아래 예제를 참조


_.addItem({ 

> id : "example_component", 

> template : '<example_component><span>{this.text}</span></example_component>',

> css : "http://example.com/css/style.css",

> target : document.querySelector(".target"), 

> data : {text : "hello world"},

> parent : {

>> id: {string},

>> idx : {number}

> },

> events : {

>> onEvent : {

>>>function(event){ } 

>>}

>}

});

&nbsp;

**추가**에서의 필수옵션은 id, data 이며 아래 예제를 참조

_.addItem({ 
>id : "example_component", 

>data : {text : "hello world"},

> parent : {

>> id: {string},

>> idx : {number}

> }

});


&nbsp;

## _.setItem

setItem은 컴포넌트의 **수정**에 사용되는 메서드입니다.

**parameter** : {
>id: {string},

>idx : {number}, // idx default : 0

> data : {object}

}

**return** : undefined






```
_.setItem({ 
	id : "example_component", 
	data : {text : "텍스트를 수정"} 
});
```

```
=> undefined
```
&nbsp;

## _.getItem

getItem은 컴포넌트  **이벤트, 컴포넌트, 데이터, 확장 컴포넌트**의 값을 가져오는데 사용되는 메서드입니다.

**parameter** : {

>id : {string},

>idx : {number}

}

**return** : {

>target : {element},

>data : {object},

>element : {component element},

>[event params...](https://developer.mozilla.org/ko/docs/Web/API/Event)

}

```
var item = _.getItem({
	id : "example_component",
	idx : 1
});
  
console.log(item);
```

```
=> { Event object......, data : addItem add data!, elment : ▶<example_component>...</example_component>  }
```

&nbsp;

## _.getItems

getItems은 **getItem**의 확장 유틸리티 메서드로 컴포넌트의 정보를 배열 값으로 모두 가져오는데 사용됩니다.

**parameter** : {

> id : { string }

}

**return** : [

>event :{

>>target : {element},

>>data : {object},

>>element : {component element},

>>[event params...](https://developer.mozilla.org/ko/docs/Web/API/Event)

>}

> event : {same object},

> event : {same object},

> more ...

]

```
var item = _.getItems({
	id : "example_component"
});
  
console.log(item);
```

```
=> [Array Extend event object]
```

&nbsp;
## _.removeItem

removeItem은 컴포넌트를  **삭제**의 할때 사용되며 해당 컴포넌트, 바인딩된 이벤트, 데이터를 한번에 삭제하는 메서드입니다,

**parameter** : { 
>id : "example_component", 

>idx : 2

};

**return** : undefined

```
_.removeItem({ 
	id : "example_component", 
	idx : 2
});
```

```
=> undefined
```

&nbsp;

## _.clear

clear는 removeItem 확장 유틸리티 메서드이며 컴포넌트를  **모두삭제**의 할때 사용되며 모든 컴포넌트, 바인딩된 이벤트, 데이터를 한번에 삭제합니다.

**parameter** : {
> id : {string}

}

**return** : undefined

```
var item = _.clear({id: “example_component”});

console.log(item);
```

```
=> 17  // example_component items removed length
```
&nbsp;


## _.fetch

promise 패턴 기반의 ajax 요청 메소드입니다.

**parameter** : 

url : {string},

{

> method : {string},

> headers : {object},

> cache : {boolean},

> timeout : {number}

}

**return** : {
> status : {number},

> body : {JSON or string}

}

체인 메서드를 위한 확장 유틸리티 **then** 메서드를 추가 제공하며.
> callback hell 패턴이 아닌 체이닝 메서드 형식으로 코드의 가독성 관리가 가능하며

> 사용방법은 아래 "fetch & then example" 예제를 참고

요청취소를 위한 **abort** 메서드를 추가 제공합니다.
> _.abort(); // 호출시 기존에 요청한 체이닝 메서드 요청을 block하고 제거합니다.


```
// fetch & then example
// example01.json
{
	data : {
		name : "understore"
	}
}

// example02.json
{
	data : {
		value : "library"
	}
}
```

```
_.fetch("example01.json", {
    // method : "GET", default method value "GET"
	cache: true,
	// headers :{"Accept": "text/json","goooood": "understore"} <- example case
}).then(function(res){
    this.v = res.data.name;
}).then(function(){
    console.log("example01 ajax : ", res);
})
.fetch("example02.json", {
    method : "GET",
	cache: true,
	headers :{"Accept": "text/text","goooood": 11111}
}).then(function(res){
    console.log("example02 ajax : ", res);
    this.v = this.v + " " + res.data.name;
}).then(function(){
    console.log(this.v);
})console.log(item);
```

```
=> "example01 ajax : ", {
	data : {
		name : "understore"
	}
}

=> "example02 ajax : ", {
	data : {
		name : "web component library"
	}
}

=> "understore web component library"
```

&nbsp;

## _.then

promise 패턴 기반의 체인 메소드입니다.

**parameter** : {function}

**return** : undefined
```
_.then(function(){
	this.v = 0;
	for(var i = 0, len = 5; i < len; i++){
		this.v += i;	
	}
}).then(function(){
    console.log("count v : ", this.v);
}).then(function(){
    for(var i = 0, len = 5; i < len; i++){
		this.v -= i;	
	}
}).then(function(){
    console.log("count v : ", this.v);
})
```

```
=> count v :  10
=> count v :  0
```
&nbsp;




## 예제

[Todomvc example on jsfiddle](https://fiddle.jshell.net/understore/x2seku4z/show/)
>창 혹은 탭을 두개 여시고 컴포넌트간의 데이터의 동기화를 확인하세요