let handler = Object.freeze({
	get (target, prop, receiver) {
		const self = this;
		if (target.has(prop)) {
			return target.get(prop);
		}
		//console.log("get non-map prop:", prop);
		if (prop in target) {
			//console.log(prop, "is in target.");
			if (typeof target[prop] === "function") {
				return target[prop].bind(target);
			}
			return target[prop];
		}
		//console.log(prop, "is not defined.");
		return undefined;
	},

	has (target, prop) {
		//console.log("has:", prop, target[prop]);
		return target.has(prop) || target.hasOwnProperty(prop);
	},

	set (target, prop, val) {
		//console.log("set:", prop, val);
		if (prop in target) {
			return target[prop] = val;
		}
		return target.set(prop, val);
	},

	deleteProperty (target, prop) {
		return target.delete(prop);
	},

	ownKeys (target) {
		let keys = [...target.keys()];
		for (let key in target) {
			keys.push(key);
		}
		//console.log("ownKeys:", keys);
		return keys;
	},

	getOwnPropertyDescriptor (target, prop) {
		if (target.has(prop)) {
			return {
				value: target.get(prop),
				writable: true,
				enumerable: true, 
				configurable: true
			};
		}
		return Object.getOwnPropertyDescriptor(target, prop);
	}
});

class AssociativeMap extends Map {
	constructor (items) {
		super(items);
	}
}

return function (items) {
	return new Proxy(
		new AssociativeMap(items), 
		handler
	);
};