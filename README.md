# Arini
A programming language for web developers. Arini becomes Node.js.

## Philosophy
A scope is any code inside `{` and `}`, and the idea of arini is, that's all you need. A scope can be a simple block of code, a function/method, a class, an interface, or any encapsolation you need. If you write code like I do, you might start out by writing a simple bit of code, then refactor some of that code into a function, then maybe later even create a class or two with several methods. The arini programming language makes migrating and merging paradigms easy by utilizing a single scope type.

As a bonus, using a single first-class scope type makes arini easy to learn and remember.

Before reading forward, all of the following content has been translated into an easy-to-take course that you can try on your web browser. https://www.katacoda.com/spn/scenarios/hello-world

## Getting Started
How to create an Arini Project with npm.

### First, make a directory for your project.

`mkdir project`{{execute}}

### Now, enter that directory

`cd project`{{execute}}

### Once you're in there, run npm init and install arini

`npm init && npm i --save -g arini && npm i --save arini`{{execute}}

Follow the directions from npm to initialize your Node.JS prackage.

#### Once that's done, create an arini program:
`touch program.ari`{{execute}}

Now, in your editor, open the `project` directory, and open up `program.ari`


Once opened, you can copy this code:
<pre class="file" data-filename="project/program.ari" data-target="replace">
  console.log("Sup?");
</pre>

#### Run the arini program:
`arini program.ari`{{execute}}

That's it!

## What does Arini look like?
In Arini, we have expressions, lists of expressions, identifiers, operators, and syntax used to craft those expressions. Control code (what you find in the root of an Arini program or in every scope) is a list of expressions seperated by semi-colons. Arini has a few basic types. [These basic types may be used to implement more abstract types.](https://github.com/s-p-n/arini/blob/master/docs/casting/custom.md).

### Primitive Types in Arini:
* A **boolean** is the token `true` or `false`.
<pre class="file" data-filename="project/program.ari" data-target="replace">
let foo = true or false; // true
let bar = true and false; // false
console.log(foo, bar);
</pre>
`arini program.ari`{{execute}}

* A **string** can be text surrounded by `""`, or `''`, or backticks.
<pre class="file" data-filename="project/program.ari" data-target="replace">
let foo = "I am a string.";
let bar = 'I am
    a multiline
    string';
let baz = \`
  I am a multiline string containing 2 variables:
  foo: ${foo}
  bar: ${bar}
  And that is that.
\`;
console.log(baz);
</pre>
`arini program.ari`{{execute}}

* A **number** is simply a number like JavaScript's Number.
<pre class="file" data-filename="project/program.ari" data-target="replace">
let a = 543;
let b = 1.25;
console.log(a + b);
</pre>
`arini program.ari`{{execute}}

* An **array** is a map of items. Arrays, if not named, use indices just like in most programming languages. Arini also supports named arrays. One big diference between Arini and JavaScript, is arrays. Arini takes JavaScript arrays and objects and consolidates their features. Interestingly, JavaScript already does this with the Array. So Arini builds on that.
<pre class="file" data-filename="project/program.ari" data-target="replace">
let foo = [
    question = "What is the answer to the universe and everything?",
    answer = 42
];
console.log(foo["question"]); // "What is the..."
console.log(foo.answer); // 42 
</pre>
<pre class="file" data-filename="project/program.ari" data-target="replace">
let bar = ["cow", "pig", "sheep"];
bar.forEach(#(val) {
    console.log(val);
});
</pre>
`arini program.ari`{{execute}}

* A **tag** is basically an XML tag- kinda like HTML. A Tag has a name and may contain attributes or children. Unlike XML/HTML, Tag children in Arini can be of any type or expression. Because of the first-class nature of Tag children, **each child of a Tag must be followed by a semi-colon**- just like everywhere else in the language. 
<pre class="file" data-filename="project/program.ari" data-target="replace">
let someVariable = &#x22;I&#x27;m some variable&#x22;;
let someSwitch = true;
let myComponent = &#x3C;someTag with=&#x22;attributes&#x22;&#x3E;
&#x22;I am some inner text.&#x22;;
&#x3C;nestedTag&#x3E;
 &#x22;This is a nested string in a nested tag.&#x22;;
 someVariable;
 {
  if (someSwitch) {
   return &#x3C;switch on=true /&#x3E;;
  } else {
   return &#x3C;switch on=false /&#x3E;;
  };
 }();
&#x3C;/nestedTag&#x3E;;
&#x3C;/someTag&#x3E;;
console.log(&#x22;&#x22; + myComponent.nestedTag.switch);
</pre>
`arini program.ari`{{execute}}

* A **scope** is kind of like a function from other languages, but has support for `public` and `protected` properties. If nothing is returned, a scope does not return `void` when invoked, it instead **returns the public properties available.** When extended, the public and protected properties are made available to the scope that extends it. `private` can be thought of as a synonym for `let`, but there are subtle differences. In essence, `private` and `let` are stored exactly the same way, just in slightly different places. They both work anywhere in the language exactly the same way- so I suggest to pick one and stick with it.
<pre class="file" data-filename="project/program.ari" data-target="replace">
let Guy {
 protected shared_secret = &#x22;it&#x27;s a foo!&#x22;;
 public sayHi (name = &#x22;no name&#x22;) {
   return &#x22;Hello, &#x22; + name;
 };
};
let someObj = Guy();
let GuysFriend {
 use Guy;
 public tellSecret() {
  console.log(shared_secret);
 };
};
let friend = GuysFriend();
friend.tellSecret();
</pre>
`arini program.ari`{{execute}}

# Now try experimenting :)


For further information on primitive types, visit the wiki.

## Arini is extensible.
Node.js modules can be used with require. Arini and JavaScript are similar enough, it just works for the most part. Try it! express works, mongo-js works, socket.io works. 

For more information on extensions, visit the wiki.

### Base Library
Scope comes with a base library necessary for basic programming. There are some constants under development right now, but the naming is not quite right yet, so please don't use them yet. I won't mention them for that purpose, but if you see `__blah` don't rely on it yet.

