# Custom Types

Arini allows you to intercept property declarations by creating casting functions. Whenever a cast keyword resolves to an ID that is a function, that function is called. 
```
	let Foo {
		console.log("Foo cast");
	};
	let Foo:bar = "hello"; //Foo cast
	console.log(bar); // undefined- we didn't do anything in our function.
```

## Arguments
Cast functions receive 3 arguments:
 * [Object:ctx] - the object the property is being assigned to.
 * [String:prop] - the property's string representation.
 * [(Any):value] - the value assigned to the property. 


To mimic the default behavior, we need simply set `ctx[prop]=value`.
```
	let Foo (ctx, prop, val) {
		console.log("Foo cast");
		return ctx[prop] = val;
	};
	let Foo:bar = "hello"; //Foo cast
	console.log(bar); // "hello"
```

This feature is powerful when combined with Object.defineProperty API. Let's create a Dynamic type, that takes a descriptor as the value, *but is **configurable** and **enumerable** by default.*
```
	let Dynamic (obj, prop, arr) {
		let descriptor = [
			enumerable = true,
			configurable = true,
			...arr
		];
		Object.defineProperty(obj, prop, descriptor);
	};
```

We now have a **Dynamic** function we can use to intercept property declarations. Note: due to our use of `...arr`, the value must be iterable (such as an array). Due to our inclusion into Object.defineProperty, the value must also satisfy the requirements for a [property descriptor].
```
	let Dynamic:always1 = [
		value = 1,
		writable = false
	];
	console.log(always1); // 1
```
Once the property is declared, our restrictions on assignments are changed. In the above use-case, we set the `value` to **1** and `writable` to **false**. The name, *always1*, is fitting, as it has a value of `1` that can never be changed. 
```
always1 = 12; // error!
```
Suppose you want to make `always1` silently fail instead of throw an error. To do that, you would use a getter/setter instead of a value and writable. In order to prevent error on future assignments, we need a setter- even if that setter is an empty function `{}`.
```
let Dynamic:always1 = [
    get{return 1;},
    set{}
];
always1 = 3;
console.log(always1); // 1
```

The **Dynamic** casting function is useful for much more than making a variable read-only. Getters and Setters are really cool, and worth looking at.

In most cases, you don't *need* casting to create getters and setters. Casting, however, makes the structured part of our code cleaner and more expressive.

Let's get into a more complex, but more realistic use-case. We'll create a `Person` with an `age` property. The `age` property must have special requirements though. A Person is not allowed to have an age less than 0. Also, a Person's age must not excede past 150.

```
let Person {
	let realAge = 0;
	public Dynamic:age = [
		get {
			return realAge;
		},
		set (newAge) {
			if (0 <= newAge <= 150) {
				return realAge = newAge;
			};
		}
	];
};
let sam = Person();
console.log(sam.age); // 0
sam.age = 175; // silently fails
console.log(sam.age); // 0
sam.age = 60; // age is now 60.
console.log(sam.age); // 60
```


[property descriptor]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#Description