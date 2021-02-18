(window.webpackJsonp=window.webpackJsonp||[]).push([[30],{100:function(e,n,t){"use strict";t.r(n),t.d(n,"frontMatter",(function(){return a})),t.d(n,"metadata",(function(){return c})),t.d(n,"toc",(function(){return l})),t.d(n,"default",(function(){return s}));var r=t(3),i=t(7),o=(t(0),t(105)),a={id:"pyre",title:"Pyre"},c={unversionedId:"contributing/coding-conventions/pyre",id:"contributing/coding-conventions/pyre",isDocsHomePage:!1,title:"Pyre",description:"We've begun incrementally adopting Pyre into antlir/. The following are some",source:"@site/docs/contributing/coding-conventions/pyre.md",slug:"/contributing/coding-conventions/pyre",permalink:"/antlir/docs/contributing/coding-conventions/pyre",editUrl:"https://github.com/facebookincubator/antlir/edit/master/website/docs/contributing/coding-conventions/pyre.md",version:"current",sidebar:"docs",previous:{title:".bzl and TARGETS",permalink:"/antlir/docs/contributing/coding-conventions/bzl-and-targets"},next:{title:"Python",permalink:"/antlir/docs/contributing/coding-conventions/python"}},l=[{value:"Generators",id:"generators",children:[]},{value:"AnyStr =&gt; MehStr",id:"anystr--mehstr",children:[]}],b={toc:l};function s(e){var n=e.components,t=Object(i.a)(e,["components"]);return Object(o.b)("wrapper",Object(r.a)({},b,t,{components:n,mdxType:"MDXLayout"}),Object(o.b)("p",null,"We've begun incrementally adopting Pyre into ",Object(o.b)("inlineCode",{parentName:"p"},"antlir/"),". The following are some\nnoteworthy snags of Pyre that we've discovered through this adoption, and\nrecommended conventions to handle them."),Object(o.b)("h2",{id:"generators"},"Generators"),Object(o.b)("ul",null,Object(o.b)("li",{parentName:"ul"},Object(o.b)("p",{parentName:"li"},'We commonly use "generators" for the purpose of lazily returning values, but\nrarely in the sense of sending/receiving. Consider the simple function\nbelow:'),Object(o.b)("pre",{parentName:"li"},Object(o.b)("code",Object(r.a)({parentName:"pre"},{}),"def fn(limit: int):\n    for i in range(limit):\n        yield i\n"))),Object(o.b)("li",{parentName:"ul"},Object(o.b)("p",{parentName:"li"},"Both ",Object(o.b)("inlineCode",{parentName:"p"},"Generator[int, None, None]")," and ",Object(o.b)("inlineCode",{parentName:"p"},"Iterator[int]")," would be valid return\ntype annotations for this. If the 2nd and 3rd arguments to the ",Object(o.b)("inlineCode",{parentName:"p"},"Generator"),"\nannotation will be ",Object(o.b)("inlineCode",{parentName:"p"},"None")," (i.e. messaging is unused), then the preferred\nannotation is ",Object(o.b)("inlineCode",{parentName:"p"},"Iterator"),"."))),Object(o.b)("h2",{id:"anystr--mehstr"},"AnyStr =",">"," MehStr"),Object(o.b)("ul",null,Object(o.b)("li",{parentName:"ul"},"When calling ",Object(o.b)("inlineCode",{parentName:"li"},"subprocess"),", a list containing both ",Object(o.b)("inlineCode",{parentName:"li"},"str")," and ",Object(o.b)("inlineCode",{parentName:"li"},"bytes")," can be\nprovided (e.g. ",Object(o.b)("inlineCode",{parentName:"li"},'["ls", b"-a"'),"])."),Object(o.b)("li",{parentName:"ul"},"Because of our heavy interaction with the OS, we often find ourselves\ninteracting with both ",Object(o.b)("inlineCode",{parentName:"li"},"bytes")," (typically abstracted as ",Object(o.b)("inlineCode",{parentName:"li"},"Path")," in ",Object(o.b)("inlineCode",{parentName:"li"},"fs_utils"),")\nand ",Object(o.b)("inlineCode",{parentName:"li"},"str"),", and providing a combination of these to ",Object(o.b)("inlineCode",{parentName:"li"},"subprocess.")),Object(o.b)("li",{parentName:"ul"},"Unfortunately, the existing\n",Object(o.b)("a",Object(r.a)({parentName:"li"},{href:"https://docs.python.org/3/library/typing.html#typing.AnyStr"}),"AnyStr")," is\nonly meant to be used for functions accepting a mix of string types, but not\nfor mutable type declarations."),Object(o.b)("li",{parentName:"ul"},"For this reason, we've created a new type ",Object(o.b)("inlineCode",{parentName:"li"},"MehStr")," which is simply a\n",Object(o.b)("inlineCode",{parentName:"li"},"Union[str, bytes]"),", and can be used to e.g. annotate arg lists containing\nboth string types being passed to ",Object(o.b)("inlineCode",{parentName:"li"},"subprocess")," as described above."),Object(o.b)("li",{parentName:"ul"},"NB: ",Object(o.b)("inlineCode",{parentName:"li"},"MehStr")," should only be used in specific cases required to satisfy Pyre,\notherwise ",Object(o.b)("inlineCode",{parentName:"li"},"AnyStr")," should be used"),Object(o.b)("li",{parentName:"ul"},"See ",Object(o.b)("a",Object(r.a)({parentName:"li"},{href:"https://fb.prod.workplace.com/groups/pyreqa/3065532970203181"}),"https://fb.prod.workplace.com/groups/pyreqa/3065532970203181")," for more\ncontext")))}s.isMDXComponent=!0},105:function(e,n,t){"use strict";t.d(n,"a",(function(){return p})),t.d(n,"b",(function(){return m}));var r=t(0),i=t.n(r);function o(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function a(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function c(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?a(Object(t),!0).forEach((function(n){o(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):a(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function l(e,n){if(null==e)return{};var t,r,i=function(e,n){if(null==e)return{};var t,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||(i[t]=e[t]);return i}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(i[t]=e[t])}return i}var b=i.a.createContext({}),s=function(e){var n=i.a.useContext(b),t=n;return e&&(t="function"==typeof e?e(n):c(c({},n),e)),t},p=function(e){var n=s(e.components);return i.a.createElement(b.Provider,{value:n},e.children)},u={inlineCode:"code",wrapper:function(e){var n=e.children;return i.a.createElement(i.a.Fragment,{},n)}},d=i.a.forwardRef((function(e,n){var t=e.components,r=e.mdxType,o=e.originalType,a=e.parentName,b=l(e,["components","mdxType","originalType","parentName"]),p=s(t),d=r,m=p["".concat(a,".").concat(d)]||p[d]||u[d]||o;return t?i.a.createElement(m,c(c({ref:n},b),{},{components:t})):i.a.createElement(m,c({ref:n},b))}));function m(e,n){var t=arguments,r=n&&n.mdxType;if("string"==typeof e||r){var o=t.length,a=new Array(o);a[0]=d;var c={};for(var l in n)hasOwnProperty.call(n,l)&&(c[l]=n[l]);c.originalType=e,c.mdxType="string"==typeof e?e:r,a[1]=c;for(var b=2;b<o;b++)a[b]=t[b];return i.a.createElement.apply(null,a)}return i.a.createElement.apply(null,t)}d.displayName="MDXCreateElement"}}]);