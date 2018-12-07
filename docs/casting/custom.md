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

This feature is powerful when combined with Object.defineProperty API. Let's create a Dynamic type, that takes a descriptor as the value, *but is configurable and enumerable by default.*
```
	let Dynamic (obj, prop, arr) {
		let descriptor = [
			enumerable = true,
			configurable = true,
			...arr
		];
		Object.defineProperty(obj, prop, descriptor);
	};
	let Dynamic:always1 = [
		value = 1,
		writable = false
	];
	console.log(always1);
	always1 = 12;
	console.log(always1);
```