let attr = [id= "realFoo", class= "foo bar", isReal= true];

// When like attributes are found in XML, later ones take precedence.
// foo will become <foo id="realFoo" class="big bold thing" isReal=true />
let foo = <foo 
	id="fakeFoo" 
	isReal=false 
	...attr 
	class="red" 
	class="big bold thing" 
/>;

console.log(foo);