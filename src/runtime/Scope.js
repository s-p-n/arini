// set global for browser/node env:
if (typeof window !== "undefined") {
  if (typeof global === "undefined") {
    window["global"] = window;
  }
}
const Api = <include file="./Api.js"/>;
const Node = <include file="./Node.js"/>;
const TextNode = <include file="./TextNode.js"/>;
const associativeMap = <include file="./associativeMap.js"/>;
const priv = new WeakMap();
class Scope extends Api {
	constructor () {
		super();
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
				if (prop in ctx[slot]) {
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
		if (expr instanceof Array) {
			return "array";
		}
		if (expr instanceof Map) {
			return "map";
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
			throw new Error(`Call to undefined scope`);
		}
		self._scoping = {
			let: self.map(),
			private: self.map(),
			protected: self.map(),
			public: self.map(),
			parent: config.function._parent
		};
		
		result = config.function.apply(config.context, config.arguments);
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

	random (n=1) {
		const self = this;
		n = parseInt(n);
		return self.createUnpacker(function () {
			let list = this;
			let result;
			let isStr = false;
			let keys = Object.keys(list);
			if (typeof list === "string") {
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
		});
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
			if (prop in obj[slot]) {
				return obj[slot][prop] = val;
			}
		}
		return obj[prop] = val;
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
			console.log(`${name} could be an ID.`);
			console.log(`Looking up ${name}...`);
			let id = self.id[name];
			if (self.getType(id) === "function") {
				console.log(`${name} is a function. Using that instead of a Node.`);
				//name = id;
				let props = {...attributes};
				props.children = children;
				return id(props);
			} else {
				console.log(`${name} is not a function, using the Node <${name}...>.`);
			}
		}
		return new Node(name, attributes, children);
	}
}

return Scope;