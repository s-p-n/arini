function ID() {
	return Math.random().toString(16);
}

module.exports = function setArrayState(parser) {
	let state = {
		id: null,
		active: null,
		arrays: {},
		begin,
		end
	};

	class SArray {
		constructor (parent = null) {
			this.id = ID();
			this.items = [];
			this.pairs = [];
			this.spreads = [];
			this.parent = parent;
		}

		push (name, value) {
			if (value === undefined) {
				this.items.push(name);
			} else {
				this.pairs.push([name, value]);
			}
		}

		pushSpread (expr) {
			this.items.push('...' + expr);
			this.pairs.push([,expr]);
		}

		toScope () {
			let result;
			if (this.pairs.length === 0) {
				return `[${this.items.join(',')}]`;
			}
			result = '(function(){let arr=[';
			for (let i = 0; i < this.items.length; i += 1) {
				if (i !== 0) {
					result += ',';
				}
				result += this.items[i];
			}
			result += "];"
			for (let [key, val] of this.pairs) {
				if (typeof key === "string") {
					result += `arr[${key}]=${val};`;
				} else {
					result += `scope.shallowClone(arr, ${val});`
				}

			}
			//for (let i = 0; i < this.spreads.length; i += 1) {
			//	result += `scope.shallowClone(arr, ${this.spreads[i]});`;
			//}
			result += "return arr;"
			return result + '}())';
		}
	}

	function begin () {
		let arr = new SArray(state.id);
		let id = arr.id;
		state.id = id;
		state.arrays[id] = arr;
		state.active = state.arrays[id];
	}

	function end () {
		state.id = state.active.parent;
		state.active = state.arrays[state.id]
	}

	parser.yy.array = state;
}