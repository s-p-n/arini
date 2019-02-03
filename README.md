# Arini
A programming language for web developers. Arini becomes Node.js.

## Philosophy
A scope is any code inside `{` and `}`, and the idea of arini is, that's all you need. A scope can be a simple block of code, a function/method, a class, an interface, or any encapsolation you need. If you write code like I do, you might start out by writing a simple bit of code, then refactor some of that code into a function, then maybe later even create a class or two with several methods. The arini programming language makes migrating and merging paradigms easy by utilizing a single scope type.

As a bonus, using a single first-class scope type makes arini easy to learn and remember.

## Getting Started
### Option 1: Global Install
>Arini can be installed with npm:
>
	npm i -g arini
>
>Arini uses the package `source-map-support` as an attempt to make runtime-errors debuggable.

>Once installed, you can run your programs with the `arini` command:
>	
	arini myProgram.ari

## What does Arini look like?
In Arini, we have expressions, lists of expressions, identifiers, operators, and syntax used to craft those expressions. Control code (what you find in the root of an Arini program or in every scope) is a list of expressions seperated by semi-colons. Arini has a few basic types. [These basic types may be used to implement more abstract types.](https://github.com/s-p-n/arini/blob/master/docs/casting/custom.md).

### Primitive Types in Arini:
* A **boolean** is the token `true` or `false`.
```
let foo = true or false; // true
let bar = true and false; // false
```

* A **string** can be text surrounded by `""`, or `''`, or ``.
```
"I am a string.";
'I am
a multiline
string';
```
* A **number** is simply a number like JavaScript's Number.
```
543;
1.25;
```
* An **array** is a map of items. Arrays, if not named, use indices just like in most programming languages. Arini also supports named arrays. One big diference between Arini and JavaScript, is arrays. Arini takes JavaScript arrays and objects and consolidates their features. Interestingly, JavaScript already does this with the Array. So Arini builds on that.
```
let foo = [
	question = "What is the answer to the universe and everything?",
	answer = 42
];
print(foo["question"]); // "What is the..."
print(foo.answer); // 42 

let bar = ["cow", "pig", "sheep"];
bar.forEach(#(val) {
	print(val);
});
/*
cow
pig
sheep
*/
```
	
* A **tag** is basically an XML tag- kinda like HTML. A Tag has a name and may contain attributes or children. Unlike XML/HTML, Tag children in Arini can be of any type or expression. Because of the first-class nature of Tag children, **each child of a Tag must be followed by a semi-colon**- just like everywhere else in the language. 
```	
let someVariable = "I'm some variable";
let someSwitch = true;

let myComponent = <someTag with="attributes">
    "I am some inner text.";
    <nestedTag>
        "This is a nested string in a nested tag.";
        someVariable;
        if (someSwitch) {
            return <switch on=true />;
        } else {
            return <switch on=false />;
        };
    </nestedTag>;
</someTag>;
print(myComponent.nestedTag.switch.on); 
//true
```
* A **scope** is kind of like a function from other languages, but has support for `public` and `protected` properties. If nothing is returned, a scope does not return `void` when invoked, it instead **returns the public properties available.** When extended, the public and protected properties are made available to the scope that extends it. `private` can be thought of as a synonym for `let`, but there are subtle differences. In essence, `private` and `let` are stored exactly the same way, just in slightly different places. They both work anywhere in the language exactly the same way- so I suggest to pick one and stick with it.
```
let Guy {
	protected shared_secret = "it's a foo!";
	public sayHi (name = "no name") {
		return "Hello, " + name;
	};
};

let someObj = Guy();
/*
someObj becomes an array with the method: sayHi(name)
*/

let GuysFriend {
	use Guy;
	public tellSecret() {
		console.log(shared_secret);
	};
};
let friend = GuysFriend();
friend.tellSecret(); // "It's a foo!"
```

For further information on primitive types, visit the wiki.

## Arini is extensible.
Node.js modules can be used with require. Arini and JavaScript are similar enough, it just works for the most part. Try it! express works, mongo-js works, socket.io works. 

For more information on extensions, visit the wiki.

### Base Library
Scope comes with a base library necessary for basic programming. There are some constants under development right now, but the naming is not quite right yet, so please don't use them yet. I won't mention them for that purpose, but if you see `__blah` don't rely on it yet.

