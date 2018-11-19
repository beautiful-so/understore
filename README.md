# Understore

5가지 함수로 웹 컴포넌트 개발을 시작하세요. IE9 레거시 브라우저를 지원하며, 백그라운드 스토어 에코시스템을 기반으로 창과 창간의 컴포넌트의 상태관리의 최신화를 가능하게 하며 현존하는 웹 컴포넌트 라이브러리중 Understore가 유일합니다.

Understore의 api는 [추가, 가져오기, 모두가져오기, 삭제, 모두삭제] 총 5개이며 추가로 2개의 유틸리티를 제공하며 웹 개발이 가장 힘든 부분인 컴포넌트가 확장되면 확장될수록 컴포넌트간의 상태관리의 높은 러닝커브와 유지보수의 어려움을 해결하기 위한 라이브러리입니다.

자세한 내용은 아래 API 문서와 예제를 참조해주세요

## _.addItem

_.addItem은 웹컴포넌트의 __생성__과 __추가__에 사용됩니다.


__parameter__ : [type object]

>	{

>>	id: { string },

>>	template : {string}

>>	target : {dom.element}

>>	data : { object }

>>	created : { function }

>>	changed : { function }

>}

__return__ : [type undefined]
undefined

&nbsp;



__template__ 과 __data__의 사용법은 script 태그 내에 삽입하는 방식과 자바스크립트 변수안에 템플릿을 삽입하는 방식을 사용하고 있으며 virtual dom 방식의 dom관리를 통해 스토어의 수정 발생시 템플릿의 해당 보간자 영역의 repaint의 가벼운 수정 방식을 사용하고 있습니다.

> [template type1 on jsfiddle](https://jsfiddle.net/understore/xjgxouLa/)

> [template type2 on jsfiddle](https://jsfiddle.net/understore/bzvxvL1w/)


__css__ 는 스타일 파일의 경로를 넣으면 됩니다., 경우 스타일과 중복되지 않도록 scoped 가능한 css import 방식을 제공하고 있습니다. (스타일 사용의 방식은 custom element 셀렉터 사용시 :root로 사용가능합니다.)

>[css import on jsfiddle](https://jsfiddle.net/understore/4y78mtpj/)


__events__는 이벤트 바인딩이며 @click="function_name"으로 바인딩이 가능하며 아래 예제를 참조

>[event bind on jsbin](https://jsfiddle.net/understore/z8c9ngku/)

&nbsp;

__생성__에서의 필수옵션은 id, template, target, data이며
추가 옵션은 events, css, sync 이며 아래 예제를 참조


>_.addItem({ 

>>id : "example_component", 

>>template : '<example_component><span>{this.text}</span></example_component>',

>>css : "http://example.com/css/style.css",

>>target : document.querySelector(".target"), 

>>data : {text : "hello world"} 

>});

&nbsp;

__추가__에서의 필수옵션은 id, data 이며 아래 예제를 참조

>_.addItem({ 
>>id : "example_component", 
>>data : {text : "hello world"} 

>});
'''

&nbsp;

## _.setItem

 __parameter__ : [type object]
>	{
>> id: { string }

>>	idx : { num } // idx default : 0

>> data : { object }

>}

__return__ : [type undefined]
undefined





```
_.setItem({ 
	id : "example_component", 
	data : {text : "텍스트를 수정"} 
});

=> undefined
```
&nbsp;

## _.getItem


 __parameter__ : [type object]
> {

>> id : { string },

>> data : { object }

>}

__return__ : [event object] 확장으로 [data, element]
{
	data : { object },
	el : { dom.element 
}

```
var item = _.getItem({
	id : "example_component",
	idx : 1
});
  
console.log(item);
=> { Event object......, data : addItem add data!, elment : ▶<example_component>...</example_component>  }


```



&nbsp;
## _.removeItem



parameter : [type object]

>_.removeItem({ 
>>id : "example_component", 

>>idx : 2

>});

__return__ : [type undefined]

```
_.removeItem({ 
	id : "example_component", 
	idx : 2
});

=> undefined
```

&nbsp;

## _.clear

__parameter__ : [type string]
>{
>> id : {string}

>}

__return__ : [type number]
{
	data : { object },
	el : { dom.element }
}


```
var item = _.clear({id: “example_component”});

console.log(item);
=> 17  // example_component items removed length
```
&nbsp;




## 예제

[Todomvc example on jsfiddle](https://jsfiddle.net/understore/x2seku4z/)