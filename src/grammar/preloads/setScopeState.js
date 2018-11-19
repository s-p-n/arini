module.exports = function setScopeState(parser) {
	let priv = new WeakMap();
	class Scope {
		constructor (parent=null) {
			this.expressions = [];
			this.parent = parent;
			priv.set(this, Object.create(null));
			priv.get(this).queueArgEnd = false;
		}

		get args () {
			let self = parser.yy.scope;
			let args = priv.get(self).args || [];
			return `scope.declare("let", ${args.join(',')});`;
		}

		begin () {
			let self = parser.yy.scope;
			console.log("creating new scope");
			console.log("parent:", self);
			parser.yy.scope = new Scope(self);
			console.log("in new scope:");
			console.log(parser.yy.scope);
		}

		beginParen () {
			let self = parser.yy.scope;
			let parent = self.argState || null;
			console.log("beginParen");
			self.argState = Object.create(null);
			self.argState.parent = parent;
			priv.set(self.argState, []);
			console.log(priv.get(self.argState));
		}

		endParen (isScopeArg) {
			let self = parser.yy.scope;
			let args = [];
			console.log("endParen", isScopeArg);
			if (isScopeArg) {
				console.log(priv.get(self.argState));
				priv.get(self).args = priv.get(self.argState);
				priv.get(self).queueArgEnd = true;
			}
			self.argState = self.argState.parent;
		}

		end () {
			let self = parser.yy.scope;
			parser.yy.scope = self.parent;
		}

		pushArg (name, defaultValue) {
			let self = parser.yy.scope;
			let args = priv.get(self.argState);
			let i;
			if (priv.get(self).queueArgEnd) {
				console.log(name,"is the last arg.")
				args = priv.get(self).args;
			}
			console.log("pushing arg:", name);
			i = args.length;
			args.push(`[${name},((args[${i}]!==undefined)?(args[${i}]):(${defaultValue}))]`);
			console.log(args);
			if (priv.get(self).queueArgEnd) {
				let result = self.args;
				priv.get(self).queueArgEnd = false;
				priv.get(self).args = [];
				return result;
			}
		}

		pushStmt (stmt) {
			let self = parser.yy.scope;
			self.expressions.push(stmt);
		}

		toJS () {
			let self = parser.yy.scope;
			let result = '(function (...args) {';

			return self.expressions.join(';');
		}
	}

	parser.yy.scope = new Scope();
}