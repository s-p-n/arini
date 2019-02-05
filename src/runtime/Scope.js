// set global for browser/node env:
if (typeof window !== "undefined") {
  if (typeof global === "undefined") {
    window["global"] = window;
  }
}
Object.defineProperty(Object.prototype, "compare", {
	enumerable: false,
	configurable: true,
	writable: true,
	value: function compare (b) {
		return (b !== undefined) && Object.keys(this).every(key => ((key in b) && (this[key] === b[key])));
	}
});
Object.defineProperty(Array.prototype, "each", {
	enumerable: false,
	configurable: true,
	writable: true,
	value: function each (f) {
		return Object.keys(this).every(key => f(key, this[key], this));
	}
});
const path = require('path');
const RandExp = require('randexp');

const Api = <include file="./Api.js"/>;
const Node = <include file="./Node.js"/>;
const TextNode = <include file="./TextNode.js"/>;
const associativeMap = <include file="./associativeMap.js"/>;
const priv = new WeakMap();
class Scope extends Api {
	constructor () {
		super();
		const self = this;
		const arini_dir = path.dirname(path.dirname(process.argv[1]));
		const script_dir = (process.argv[2] !== undefined) ? path.dirname(path.join(process.cwd(), process.argv[2])) : process.cwd();
		self._scoping = self.map([
			["let", self.array()],
			["private", self.array()],
			["protected", self.array()],
			["public", self.array()],
			["parent", null]
		]);

		function getId(prop, ctx) {
			for (let slot in ctx) {
				if (slot === "parent" || self.getType(ctx[slot]) !== "array") {
					continue;
				}
				if (prop in ctx[slot]) {
					return ctx[slot][prop];
				}
			}
			if (ctx.parent === null) {
				if (prop === "require") {
					return require;
				}
				if (prop === "__dirname") {
					return script_dir;
				}
				if (prop === "__arini_dir") {
					return arini_dir;
				}
				if (prop === "async") {
					return self.async;
				}
				return global[prop];
			}
			return getId(prop, ctx.parent);
		}

		function setId(prop, value, ctx) {
			for (let slot in ctx) {
				if (slot === "parent" || self.getType(ctx[slot]) !== "array") {
					continue;
				}
				if (prop in ctx[slot]) {
					return ctx[slot][prop] = value;
				}
			}
			if (ctx.parent === null) {
				return global[prop] = value;
			}
			return setId(prop, value, ctx.parent);
		}

		self.id = new Proxy(self._scoping, {
			get: function get (target, prop, receiver) {
				return getId(prop, self._scoping);
			},
			set: function set (target, prop, val, receiver) {
				return setId(prop, val, self._scoping);
			}
		})
	}

	after (promisable) {
		return Promise.resolve(promisable);
	}

	array (arr=[]) {
		const self = this;
		return arr;
	}

	asObj (expr) {
		let result = {};
		if (expr instanceof Map) {
			for (let [name, val] of expr) {
				result[name] = val;
			}
			return result;
		}



		return expr;
	}

	async async(f) {
		return new Promise(f);
	}

	createScope (f, hasReturn) {
		const self = this;
		let result = function Scope(...args) {
			const thisArg = f;
			return self.invokeExpression({
				function: f,
				arguments: args,
				context: thisArg,
				isExtension: f._beingUsed
			});
		};
		const define = function (prop, val) {
			self.createReference(result, prop, f);
			return result[prop] = val;
		};
		if (f.name !== "") {
			Object.defineProperty(result, "name", {value: f.name});
		}

		define("_hasReturn", hasReturn);
		define("_isScope", true);
		define("_parent", self._scoping);
		define("_beingUsed", false);
		define("_originalFunction", f);
		return result;
	}

	createUnpacker (f, supportedTypes=["array", "object", "map", "string"]) {
		const self = this;
		let result = function Unpackable(list=[], ...args) {
			return f.apply(list, args);
		}
		const define = function (prop, val) {
			self.createReference(result, prop, f);
			return result[prop] = val;
		};
		define("_isUnpackable", true);
		define("_supportedTypes", supportedTypes);
		define("_originalFunction", f);
		return result;
	}

	createReference (targetObj, targetProp, receiverObj, receiverProp=targetProp) {
		Object.defineProperty(receiverObj, receiverProp, {
			get: () => targetObj[targetProp],
			set: newVal => targetObj[targetProp] = newVal
		});
	}

	declare (slot, ...sets) {
		const self = this;
		let slots = ['let', 'private', 'protected', 'public'];
		let results = [];
		for (let [name, value, cast] of sets) {
			if(name instanceof Array) {
				if (value !== null && typeof value[Symbol.iterator] === 'function') {
					let result = [];
					for (let i = 0; i < name.length; i += 1) {
						let val;
						if (value[name[i]] !== undefined) {
							val = value[name[i]];
						} else if (value.length <= i) {
							val = undefined;
						} else {
							val = value[i];
						}
						result.push([name[i], val]);
					}
					self.declare(slot, ...result)
				} else if (typeof value === "object") {
					let result = [];
					for (let i = 0; i < name.length; i += 1) {
						let val;
						if (value[name[i]] !== undefined) {
							val = value[name[i]];
						}
						result.push([name[i], val]);
					}
					self.declare(slot, ...result);
				} else {
					throw new Error("Attempt to iterate over non-iterable during declaration");
				}
				continue;
			}

			// make sure slot is an allowed slot
			if (slots.indexOf(slot) === -1) {
				console.log("WARNING: Use of unsupported property storage slot:", slot);
				console.log("failing silently- returning false.")
				// this shouldn't really happen.. but it can.
				return false;
			}
			/** Thought: Why error on duplicate (below), where we can more easily and 
				intuitively overwrite it?
			**
			if (self._scoping[slot].has(name)) {
				throw new Error(`'${slot} ${name}' already declared.`);
			}
			**/
			if (cast !== undefined) {
				//console.log("cast exists:");
				//console.log(cast);

				if (cast === String) {
					//console.log("cast to string");
					let val = String(value);
					Object.defineProperty(self._scoping[slot], name, {
						get() {
							//console.log(`${name} str-getter`);
							return val;
						},
						set(newValue) {
							//console.log(`${name} str-setter => "${newValue}"`);
							if (typeof newValue === "string") {
								return val = newValue;
							}
							return val = String(newValue);
						},
						enumerable: true
					});
				} else if (cast === Number) {
					//console.log("cast to number");
					let val = Number(value);
					Object.defineProperty(self._scoping[slot], name, {
						get() {
							//console.log(`${name} num-getter`);
							return val;
						},
						set(newValue) {
							//console.log(`${name} num-setter => "${newValue}"`);
							if (typeof newValue === "number") {
								return val = newValue;
							}
							return val = Number(newValue);
						},
						enumerable: true
					});
				} else {
					cast(self._scoping[slot], name, value);
				}
			} else {
				self._scoping[slot][name] = value;
			}
			//console.log(self._scoping[slot]);
			//console.log(self._scoping[slot][name]);
			results.push(value);
		}
		// not necessary to return anything
		//return results[results.length - 1];
	}

	has (a, b) {
		return Object.values(a).some(val => Object.is(val, b));
	}

	getType (expr) {
		if (typeof expr === "undefined") {
			return "undefined";
		}
		if (expr instanceof Array) {
			return "array";
		}
		if (expr instanceof Map) {
			return "map";
		}
		if (expr instanceof RegExp) {
			return "regex";
		}
		return typeof expr;
	}

	in (a, b) {
		return a in b;
	}

	invokeExpression(config = {
		function: function () {},
		arguments: [],
		context: this,
		isExtension: false
	}) {
		const self = this;
		let scoping,result;

		if (!config.function._isScope) {
			return config.function.apply(config.context, config.arguments);
		}

		scoping = self._scoping;
		
		if (config.function === undefined) {
			throw new Error(`Call to undefined expression`);
		}
		self._scoping = self.map([
			["let", self.array()],
			["private", self.array()],
			["protected", self.array()],
			["public", self.array()],
			["parent", config.function._parent]
		]);

		result = config.function.apply(config.context, config.arguments);
		//console.log("scoping:");
		//console.log(self._scoping);

		if (result === undefined) {
			if (config.isExtension === true) {
				result = self.map([
					["public", self._scoping.public],
					["protected", self._scoping.protected]
				]);
			} else {
				result = self._scoping.public;
			}
		}
		
		self._scoping = scoping;
		return result;
	}

	map (items=[]) {
		const self = this;
		let arr = [];
		for (let [name, val] of items) {
			arr[name] = val;
		}
		return self.array(arr);
	}

	randexp (...args) {
		return new RandExp(...args);
	}

	random (n=1) {
		const self = this;
		n = parseInt(n);
		return self.createUnpacker(function () {
			let list = this;
			let result;
			let isStr = false;
			let keys = Object.keys(list);
			if (self.getType(list) === "regex") {
				let r = self.randexp(list);
				if (n === 1) {
					return r.gen();
				}
				result = [];
				for (let i = 0; i < n; i += 1) {
					result.push(r.gen());
				}
				return self.array(result);
			}
			if (self.getType(list) === "string") {
				isStr = true;
			}
			if (n === 1) {
				return list[keys[Math.floor(Math.random() * keys.length)]];
			}

			result = [];
			for (let i = 0; i < n && keys.length > 0; i += 1) {
				let key = keys.splice(Math.floor(Math.random() * keys.length),1)[0];
				result.push(list[key]);
			}
			if (!isStr) {
				return self.array(result);
			}
			return result.join('');
		}, ["array", "object", "map", "string", "regex"]);
	}

	range (start=0, end=0, inc=1) {
		let len, result, isStr = false;

		// inc must be a number.
		if (typeof inc !== "number") {
			return [];
		}

		// support numbers or chars.
		if (typeof start === "string" && 
			typeof end === "string" && 
			start.length === 1 && 
			end.length === 1
		) {
			start = start.charCodeAt(0);
			end = end.charCodeAt(0);
			isStr = true;
		} else if (!(typeof start === "number" && typeof end === "number")) {
			return [];
		}
		if (start === end) {
			return start;
		}

		if (start > end) {
			inc = -Math.abs(inc);
			len = Math.floor((start - end) / (-inc));
		} else {
			inc = Math.abs(inc);
			len = Math.floor((end - start) / inc);
		}
		result = new Array(len + 1);
		for (let i = 0, n = start; i <= len; i += 1, n += inc) {
	        result[i] = n;
	    }
	    if (isStr) {
	    	return String.fromCharCode(...result);
	    }
		return this.array(result);
	}

	set (obj, prop, val) {
		const self = this;
		
		let slots = [
			'let',
			'private',
			'protected',
			'public',
			'parent'
		];

		//console.log("SET::");
		//console.log(obj);
		//console.log(prop);
		//console.log(val);

		if (obj === global) {
			if (prop in global) {
				return obj[prop] = val;
			} else {
				throw `${prop} is not defined.`;
			}
		}
		for (let slot of slots) {
			if (!obj.hasOwnProperty(slot)) {
				break;
			}
			if (obj[slot] === null) {
				return self.set(global, prop, val);
			}
			if (slot === "parent") {
				return self.set(obj.parent, prop, val);
			}
			if (prop in obj[slot]) {
				//console.log("prop exists:", prop, "as", obj[slot][prop]);
				obj[slot][prop] = val;
				//console.log("is now:", obj[slot][prop]);
				return obj[slot][prop];
			}
		}
		return obj[prop] = val;
	}

	sizeCmp (a, b, op) {
		/* The reason I do it this way instead of just spitting raw 'expr < expr',
			is to allow for chaining. 1 < 2 < 3 < 4 < 5; // true
		*/
		console.log(a, b, op);
		let bool = false;
		switch (op) {
			case '<':
				bool = a < b;
				break;
			case '>':
				bool = a > b;
				break;
			case '<=':
				bool = a <= b;
				break;
			case '>=':
				bool = a >= b;
				break;
		}
		console.log("Creating sizeCmp obj:", a, b, op, bool);
		return {
			[Symbol.toPrimitive](hint) {
				console.log("hint", hint);
				 if (hint === "number") {
				 	return +b;
				 }
				 return bool;
			}
		}
	}

	toBoolean (val) {
		if (val) {
			if (val == false) {
				return false;
			}
			return true;
		}
		return false
	}

	unpack (list=[]) {
		const self = this;
		let result = Object.create(null);
		result.using = function (unpackable) {
			const type = self.getType(unpackable);
			if (type === "string" || 
				(type === "number" &&
					parseInt(unpackable) === unpackable)) {
				return list[unpackable];
			}
			if (type === "unpackable" && 
				unpackable._supportedTypes.includes(scope.getType(list))) {
				return unpackable(list);
			}
			if (type === "scope" || type === "function") {
				return unpackable(list);
			}
		}
		return result;
	}

	use (
		scope,
		as, 
		only,
		args = []
	) {
		const self = this;
		let result;
		let container;
		if (self.getType(scope) !== "function") {
			// this is bad- trying to use something that isn't a function is illogical.. should we error?
			console.log("attempting to use non-function");
			process.exit(1);
			return;
		}
		if (scope._isScope) {
			scope._beingUsed = true;
			result = scope(...args);
		} else {
			let properties = Object.getOwnPropertyDescriptors(scope.prototype);
			//console.log(properties);
			//console.log([...Object.entries(properties)]);
			result = self.map([
				["public", []],
				["protected", []]
			]);
			Object.defineProperties(result.public, properties);
			//console.log(result);
		}
		if (self.getType(as) === "undefined") {
			container = self._scoping;
		} else {
			self.declare("let", as);
			container = self.id[as];
		}
		if (self.getType(only) === "undefined") {
			container.public = result.public;
			container.protected = result.protected;
			//self.shallowClone(container.public, result.public);
			//self.shallowClone(container.protected, result.protected);
		}
	}

	wait (seconds) {
		return new Promise(resolve => setTimeout(resolve, seconds));
	}

	xml (name, ...rest) {
		const self = this;
		let children = [];
		let attributes = {};
		switch (rest.length) {
			case 0:
				break;
			case 1:
				if (self.getType(rest[0]) === "array") {
					children = rest[0];
				} else {
					attributes = rest[0];
				}
				break;
			case 2:
				attributes = rest[0];
				children = rest[1];
				break;
		}
		if (/^[A-Z]/.test(name[0])) {
			let id = self.id[name];
			if (self.getType(id) === "function") {
				let props = {...attributes};
				props.children = children;
				return id(props);
			}
		}
		return new Node(name, attributes, children);
	}
}

return Scope;