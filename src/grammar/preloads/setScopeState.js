module.exports = function setScopeState(parser) {
	let priv = new WeakMap();
	class Scope {
		constructor (parent=null) {
			this.expressions = [];
			this.parent = parent;
			priv.set(this, Object.create(null));
		}

		get argsDecl () {
			let self = parser.yy.scope;
			let args = priv.get(self).args || [];
			return `scope.declare("let", ${args.join(',')});`;
		}

		get argsLength () {
			let self = parser.yy.scope;
			let args = priv.get(self).args || [];
			return args.length;
		}

		get hasReturn () {
			let self = parser.yy.scope;
			return priv.get(self).hasReturn || false;
		}

		set hasReturn (newVal) {
			let self = parser.yy.scope;
			return priv.get(self).hasReturn = !!newVal;
		}

		begin () {
			let self = parser.yy.scope;
			parser.yy.scope = new Scope(self);
		}

		beginParen () {
			let self = parser.yy.scope;
			let parent = self.argState || null;
			self.argState = Object.create(null);
			self.argState.parent = parent;
			priv.set(self.argState, []);
		}

		endParen (isScopeArg) {
			let self = parser.yy.scope;
			let args = [];

			if (isScopeArg) {
				priv.get(self).args = priv.get(self.argState);
			}
			if (self.argState && self.argState.parent !== null) {
				self.argState = self.argState.parent;
			}
		}

		end () {
			let self = parser.yy.scope;
			parser.yy.scope = self.parent;
		}

		pushArg (name, defaultValue) {
			let self = parser.yy.scope;
			let args = priv.get(self.argState);
			let i;
			i = args.length;
			args.push(`[${name},((args[${i}]!==undefined)?(args[${i}]):(${defaultValue}))]`);
			return self.args;
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