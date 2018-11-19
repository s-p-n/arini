// set global for browser/node env:
if (typeof window !== "undefined") {
  if (typeof global === "undefined") {
    window["global"] = window;
  }
}

const Node = <include file="./Node.js"/>;
const TextNode = <include file="./TextNode.js"/>;
const associativeMap = <include file="./associativeMap.js"/>;
const priv = new WeakMap();
class Scope {
	constructor () {
		const self = this;
		self._scoping = {
			let: self.map(),
			private: self.map(),
			protected: self.map(),
			public: self.map(),
			parent: null
		};

		function getId(prop, ctx) {
			for (let slot in ctx) {
				if (slot === "parent" || typeof ctx[slot].has !== "function") {
					continue;
				}
				if (ctx[slot].has(prop)) {
					return ctx[slot][prop];
				}
			}
			if (ctx.parent === null) {
				return global[prop];
			}
			return getId(prop, ctx.parent);
		}

		function setId(prop, value, ctx) {
			for (let slot in ctx) {
				if (slot === "parent" || typeof ctx[slot].has !== "function") {
					continue;
				}
				if (ctx[slot].has(prop)) {
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
		/*Object.defineProperty(arr, "random", {
			value(n=1) {
				let result;
				let keys = Object.keys(this);
				n = parseInt(n);
				if (n === 1) {
					return this[keys[Math.floor(Math.random() * keys.length)]];
				}

				result = [];
				for (let i = 0; i < n && keys.length > 0; i += 1) {
					let key = keys.splice(Math.floor(Math.random() * keys.length),1)[0];
					result.push(this[key]);
				}
				return self.array(result);
			},
			configurable: false,
			writable: false,
			enumerable: false
		});
		*/
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

	createScope (f) {
		const self = this;
		let result = function Scope(...args) {
			const thisArg = this;
			return self.invokeExpression({
				function: f,
				arguments: args,
				context: thisArg,
				isExtension: f._beingUsed
			});
		};
		const define = function (prop, val) {
			Object.defineProperty(result, prop, {
				get: () => f[prop],
				set: newVal => f[prop] = newVal
			});
			return result[prop] = val;
		};
		define("_isScope", true);
		define("_parent", self._scoping);
		define("_beingUsed", false);
		define("_originalFunction", f);
		return result;
	}

	declare (slot, ...sets) {
		const self = this;
		let slots = ['let', 'private', 'protected', 'public'];
		let results = [];
		for (let [name, value] of sets) {
			if(name instanceof Array) {
				if (value !== null && typeof value[Symbol.iterator] === 'function') {
					let result = [];
					for (let i = 0; i < name.length; i += 1) {
						let val;
						if (value.length <= i) {
							val = undefined;
						} else {
							val = value[i];
						}
						result.push([name[i], val]);
					}
					self.declare(slot, ...result)
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
			self._scoping[slot][name] = value;
			results.push(value);
		}
		// not necessary to return anything
		//return results[results.length - 1];
	}

	has (a, b) {
		return Object.values(a).some(val => Object.is(val, b));
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
			throw new Error(`Call to undefined scope`);
		}
		self._scoping = {
			let: self.map(),
			private: self.map(),
			protected: self.map(),
			public: self.map(),
			parent: config.function._parent
		};
		
		result = config.function(...config.arguments);
		//console.log("scoping:");
		//console.log(self._scoping);

		if (result === undefined) {
			if (config.isExtension === true) {
				result = self.map(
					["public", self._scoping.public],
					["protected", self._scoping.protected]
				);
			} else {
				result = self._scoping.public;
			}
		}
		
		self._scoping = scoping;
		return result;
	}

	map (items) {
		const self = this;
		return associativeMap(items);
	}

	random (list=[], n=1) {
		const self = this;
		let result;
		let isStr = false;
		let keys = Object.keys(list);
		if (typeof list === "string") {
			isStr = true;
		}
		n = parseInt(n);
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
			if (obj[slot].has(prop)) {
				return obj[slot][prop] = val;
			}
		}
		return obj[prop] = val;
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
				if (rest[0] instanceof Array) {
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
		return new Node(name, attributes, children);
	}
}

return Scope;