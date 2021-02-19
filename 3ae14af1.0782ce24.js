(window.webpackJsonp=window.webpackJsonp||[]).push([[10],{105:function(e,t,n){"use strict";n.d(t,"a",(function(){return s})),n.d(t,"b",(function(){return h}));var a=n(0),i=n.n(a);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function r(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function p(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var c=i.a.createContext({}),b=function(e){var t=i.a.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):r(r({},t),e)),n},s=function(e){var t=b(e.components);return i.a.createElement(c.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return i.a.createElement(i.a.Fragment,{},t)}},u=i.a.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,l=e.parentName,c=p(e,["components","mdxType","originalType","parentName"]),s=b(n),u=a,h=s["".concat(l,".").concat(u)]||s[u]||d[u]||o;return n?i.a.createElement(h,r(r({ref:t},c),{},{components:n})):i.a.createElement(h,r({ref:t},c))}));function h(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,l=new Array(o);l[0]=u;var r={};for(var p in t)hasOwnProperty.call(t,p)&&(r[p]=t[p]);r.originalType=e,r.mdxType="string"==typeof e?e:a,l[1]=r;for(var c=2;c<o;c++)l[c]=n[c];return i.a.createElement.apply(null,l)}return i.a.createElement.apply(null,n)}u.displayName="MDXCreateElement"},79:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return l})),n.d(t,"metadata",(function(){return r})),n.d(t,"toc",(function(){return p})),n.d(t,"default",(function(){return b}));var a=n(3),i=n(7),o=(n(0),n(105)),l={id:"shape",title:"Shape",generated:"@generated"},r={unversionedId:"api/shape",id:"api/shape",isDocsHomePage:!1,title:"Shape",description:"shape.bzl provides a convenient strongly-typed bridge from Buck bzl parse",source:"@site/docs/api/gen-shape.md",slug:"/api/shape",permalink:"/antlir/docs/api/shape",editUrl:"https://github.com/facebookincubator/antlir/edit/master/website/docs/api/gen-shape.md",version:"current",sidebar:"docs",previous:{title:"vm.*_unittest",permalink:"/antlir/docs/runtime/vm-runtime/vm-unittest"},next:{title:".bzl and TARGETS",permalink:"/antlir/docs/contributing/coding-conventions/bzl-and-targets"}},p=[{value:"Shape objects",id:"shape-objects",children:[]},{value:"Shape Types",id:"shape-types",children:[]},{value:"Field Types",id:"field-types",children:[]},{value:"Optional and Defaulted Fields",id:"optional-and-defaulted-fields",children:[]},{value:"Loaders",id:"loaders",children:[]},{value:"Serialization formats",id:"serialization-formats",children:[]},{value:"Naming Conventions",id:"naming-conventions",children:[]},{value:"Example usage",id:"example-usage",children:[]},{value:"<code>shape</code>",id:"shape",children:[]},{value:"<code>new</code>",id:"new",children:[]},{value:"<code>field</code>",id:"field",children:[]},{value:"<code>dict</code>",id:"dict",children:[]},{value:"<code>list</code>",id:"list",children:[]},{value:"<code>tuple</code>",id:"tuple",children:[]},{value:"<code>union</code>",id:"union",children:[]},{value:"<code>unionT</code>",id:"uniont",children:[]},{value:"<code>enum</code>",id:"enum",children:[]},{value:"<code>path</code>",id:"path",children:[]},{value:"<code>target</code>",id:"target",children:[]},{value:"<code>layer</code>",id:"layer",children:[]},{value:"<code>loader</code>",id:"loader",children:[]},{value:"<code>json_file</code>",id:"json_file",children:[]},{value:"<code>python_data</code>",id:"python_data",children:[]},{value:"<code>do_not_cache_me_json</code>",id:"do_not_cache_me_json",children:[]},{value:"<code>render_template</code>",id:"render_template",children:[]}],c={toc:p};function b(e){var t=e.components,n=Object(i.a)(e,["components"]);return Object(o.b)("wrapper",Object(a.a)({},c,n,{components:t,mdxType:"MDXLayout"}),Object(o.b)("p",null,"shape.bzl provides a convenient strongly-typed bridge from Buck bzl parse\ntime to Python runtime."),Object(o.b)("h2",{id:"shape-objects"},"Shape objects"),Object(o.b)("p",null,"Shape objects are immutable instances of a shape type, that have been\nvalidated to match the shape type spec as described below."),Object(o.b)("h2",{id:"shape-types"},"Shape Types"),Object(o.b)("p",null,"Shape types are a collection of strongly typed fields that can be validated\nat Buck parse time (by ",Object(o.b)("inlineCode",{parentName:"p"},"shape.new"),") and at Python runtime (by ",Object(o.b)("inlineCode",{parentName:"p"},"shape.loader"),"\nimplementations)."),Object(o.b)("h2",{id:"field-types"},"Field Types"),Object(o.b)("p",null,"A shape field is a named member of a shape type. There are a variety of field\ntypes available:\nprimitive types (bool, int, float, str)\nother shapes\nhomogenous lists of a single ",Object(o.b)("inlineCode",{parentName:"p"},"field")," element type\ndicts with homogenous key ",Object(o.b)("inlineCode",{parentName:"p"},"field")," types and homogenous ",Object(o.b)("inlineCode",{parentName:"p"},"field")," value type\nheterogenous tuples with ",Object(o.b)("inlineCode",{parentName:"p"},"field")," element types\nenums with string values\nunions via shape.union(type1, type2, ...)"),Object(o.b)("p",null,"If using a union, use the most specific type first as Pydantic will attempt to\ncoerce to the types in the order listed\n(see ",Object(o.b)("a",Object(a.a)({parentName:"p"},{href:"https://pydantic-docs.helpmanual.io/usage/types/#unions"}),"https://pydantic-docs.helpmanual.io/usage/types/#unions"),") for more info."),Object(o.b)("h2",{id:"optional-and-defaulted-fields"},"Optional and Defaulted Fields"),Object(o.b)("p",null,"By default, fields are required to be set at instantiation time\n(",Object(o.b)("inlineCode",{parentName:"p"},"shape.new"),")."),Object(o.b)("p",null,"Fields declared with ",Object(o.b)("inlineCode",{parentName:"p"},"shape.field(..., default='val')")," do not have to be\ninstantiated explicitly."),Object(o.b)("p",null,"Additionally, fields can be marked optional by using the ",Object(o.b)("inlineCode",{parentName:"p"},"optional")," kwarg in\n",Object(o.b)("inlineCode",{parentName:"p"},"shape.field")," (or any of the collection field types: ",Object(o.b)("inlineCode",{parentName:"p"},"shape.list"),",\n",Object(o.b)("inlineCode",{parentName:"p"},"shape.tuple"),", or ",Object(o.b)("inlineCode",{parentName:"p"},"shape.dict"),")."),Object(o.b)("p",null,"For example, ",Object(o.b)("inlineCode",{parentName:"p"},"shape.field(int, optional=True)")," denotes an integer field that\nmay or may not be set in a shape object."),Object(o.b)("p",null,"Obviously, optional fields are still subject to the same type validation as\nnon-optional fields, but only if they have a non-None value."),Object(o.b)("h2",{id:"loaders"},"Loaders"),Object(o.b)("p",null,Object(o.b)("inlineCode",{parentName:"p"},"shape.loader")," codegens a type-hinted Python library that is capable of\nparsing and validating a shape object at runtime.\nThe return value of shape.loader is the fully-qualified name of the\n",Object(o.b)("inlineCode",{parentName:"p"},"python_library")," rule that contains the implementation of this loader."),Object(o.b)("h2",{id:"serialization-formats"},"Serialization formats"),Object(o.b)("p",null,"shape.bzl provides two mechanisms to pass shape objects to Python runtime code."),Object(o.b)("p",null,Object(o.b)("inlineCode",{parentName:"p"},"shape.json_file")," dumps a shape object to an output file. This can be read\nfrom a file or resource, using ",Object(o.b)("inlineCode",{parentName:"p"},"read_resource")," or ",Object(o.b)("inlineCode",{parentName:"p"},"read_file")," of the\ngenerated loader class."),Object(o.b)("p",null,Object(o.b)("inlineCode",{parentName:"p"},"shape.python_data")," dumps a shape object to a raw python source file. This\nis useful for some cases where a python_binary is expected to be fully\nself-contained, but still require some build-time information. It is also\nuseful in cases when shapes are being dynamically generated based on inputs\nto a macro. See the docblock of the function for an example."),Object(o.b)("h2",{id:"naming-conventions"},"Naming Conventions"),Object(o.b)("p",null,"Shape types should be named with a suffix of '_t' to denote that it is a\nshape type.\nShape instances should conform to whatever convention is used where they are\ndeclared (usually snake_case variables)."),Object(o.b)("h2",{id:"example-usage"},"Example usage"),Object(o.b)("p",null,"Inspired by ",Object(o.b)("inlineCode",{parentName:"p"},"image_actions/mount.bzl"),":"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{}),'mount_t = shape.shape(\n    mount_config=shape.shape(\n        build_source=shape.shape(\n            source=str,\n            type=str,\n        ),\n        default_mountpoint=str,\n        is_directory=bool,\n    ),\n    mountpoint = shape.field(str, optional=True),\n    target = shape.field(str, optional=True),\n)\n\nmount = shape.new(\n    mount_t,\n    mount_config=shape.new(\n        mount.mount_config,\n        build_source=shape.new(\n            mount.mount_config.build_source,\n            source="/etc/fbwhoami",\n            type="host",\n        ),\n        default_mountpoint="/etc/fbwhoami",\n        is_directory=False,\n    ),\n)\n')),Object(o.b)("p",null,"See tests/shape_test.bzl for full example usage and selftests."),Object(o.b)("h1",{id:"api"},"API"),Object(o.b)("h2",{id:"shape"},Object(o.b)("inlineCode",{parentName:"h2"},"shape")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"shape(**fields)")),Object(o.b)("p",null,"Define a new shape type with the fields as given by the kwargs."),Object(o.b)("p",null,"Example usage:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{}),"shape.shape(hello=str)\n")),Object(o.b)("h2",{id:"new"},Object(o.b)("inlineCode",{parentName:"h2"},"new")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"new(shape, **fields)")),Object(o.b)("p",null,"Type check and instantiate a struct of the given shape type using the\nvalues from the **fields kwargs."),Object(o.b)("p",null,"Example usage:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{}),'example_t = shape.shape(hello=str)\nexample = shape.new(example_t, hello="world")\n')),Object(o.b)("h2",{id:"field"},Object(o.b)("inlineCode",{parentName:"h2"},"field")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"field(type, optional, default)")),Object(o.b)("p",null,"No docstring available."),Object(o.b)("h2",{id:"dict"},Object(o.b)("inlineCode",{parentName:"h2"},"dict")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"dict(key_type, val_type, **field_kwargs)")),Object(o.b)("p",null,"No docstring available."),Object(o.b)("h2",{id:"list"},Object(o.b)("inlineCode",{parentName:"h2"},"list")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"list(item_type, **field_kwargs)")),Object(o.b)("p",null,"No docstring available."),Object(o.b)("h2",{id:"tuple"},Object(o.b)("inlineCode",{parentName:"h2"},"tuple")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"tuple(*item_types, **field_kwargs)")),Object(o.b)("p",null,"No docstring available."),Object(o.b)("h2",{id:"union"},Object(o.b)("inlineCode",{parentName:"h2"},"union")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"union(*union_types, **field_kwargs)")),Object(o.b)("p",null,"No docstring available."),Object(o.b)("h2",{id:"uniont"},Object(o.b)("inlineCode",{parentName:"h2"},"unionT")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"unionT(*union_types)")),Object(o.b)("p",null,"No docstring available."),Object(o.b)("h2",{id:"enum"},Object(o.b)("inlineCode",{parentName:"h2"},"enum")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"enum(*values, **field_kwargs)")),Object(o.b)("p",null,"No docstring available."),Object(o.b)("h2",{id:"path"},Object(o.b)("inlineCode",{parentName:"h2"},"path")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"path(**field_kwargs)")),Object(o.b)("p",null,"No docstring available."),Object(o.b)("h2",{id:"target"},Object(o.b)("inlineCode",{parentName:"h2"},"target")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"target(**field_kwargs)")),Object(o.b)("p",null,"No docstring available."),Object(o.b)("h2",{id:"layer"},Object(o.b)("inlineCode",{parentName:"h2"},"layer")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"layer(**field_kwargs)")),Object(o.b)("p",null,"No docstring available."),Object(o.b)("h2",{id:"loader"},Object(o.b)("inlineCode",{parentName:"h2"},"loader")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"loader(name, shape, classname, **kwargs)")),Object(o.b)("p",null,"codegen a fully type-hinted python source file to load the given shape"),Object(o.b)("h2",{id:"json_file"},Object(o.b)("inlineCode",{parentName:"h2"},"json_file")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"json_file(name, instance, shape)")),Object(o.b)("p",null,"Serialize the given shape instance to a JSON file that can be used in the\n",Object(o.b)("inlineCode",{parentName:"p"},"resources")," section of a ",Object(o.b)("inlineCode",{parentName:"p"},"python_binary")," or a ",Object(o.b)("inlineCode",{parentName:"p"},"$(location)")," macro in a\n",Object(o.b)("inlineCode",{parentName:"p"},"buck_genrule"),"."),Object(o.b)("p",null,"Warning: this will fail to serialize any shape type that contains a\nreference to a target location, as that cannot be safely cached by buck."),Object(o.b)("h2",{id:"python_data"},Object(o.b)("inlineCode",{parentName:"h2"},"python_data")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"python_data(name, instance, shape, module, classname, **python_library_kwargs)")),Object(o.b)("p",null,"Codegen a static shape data structure that can be directly 'import'ed by\nPython. The object is available under the name \"data\". A common use case\nis to call shape.python_data inline in a target's ",Object(o.b)("inlineCode",{parentName:"p"},"deps"),", with ",Object(o.b)("inlineCode",{parentName:"p"},"module"),"\n(defaults to ",Object(o.b)("inlineCode",{parentName:"p"},"name"),") then representing the name of the module that can be\nimported in the underlying file."),Object(o.b)("p",null,"Example usage:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{}),'python_binary(\n    name = provided_name,\n    deps = [\n        shape.python_data(\n            name = "bin_bzl_args",\n            instance = shape.new(\n                some_shape_t,\n                var = input_var,\n            ),\n            shape = some_shape_t,\n        ),\n    ],\n    ...\n)\n')),Object(o.b)("p",null,"can then be imported as:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{}),"from .bin_bzl_args import data\n")),Object(o.b)("h2",{id:"do_not_cache_me_json"},Object(o.b)("inlineCode",{parentName:"h2"},"do_not_cache_me_json")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"do_not_cache_me_json(instance, shape)")),Object(o.b)("p",null,"Serialize the given shape instance to a JSON string, which is the only\nway to safely refer to other Buck targets' locations in the case where\nthe binary being invoked with a certain shape instance is cached."),Object(o.b)("p",null,"Warning: Do not ever put this into a target that can be cached, it should\nonly be used in cmdline args or environment variables."),Object(o.b)("h2",{id:"render_template"},Object(o.b)("inlineCode",{parentName:"h2"},"render_template")),Object(o.b)("p",null,"Prototype: ",Object(o.b)("inlineCode",{parentName:"p"},"render_template(name, instance, shape, template)")),Object(o.b)("p",null,"Render the given Jinja2 template with the shape instance data to a file."),Object(o.b)("p",null,"Warning: this will fail to serialize any shape type that contains a\nreference to a target location, as that cannot be safely cached by buck."))}b.isMDXComponent=!0}}]);