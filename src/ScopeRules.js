
let api = {
	print: "ScopeApi.print"
};

let allowedUndefinedIdExpressions = [
	"xmlExpression",
	"xmlAttributes"
];

let buildArgPartFromAssocPart = (assoc, addTo = false) => {
	let result = "";
	if (addTo) {
		result = ",";
	}
	if (assoc.type === "id") {
		result += `{key: "${assoc.name}", value: ${assoc.expression}}`;
	} else if (assoc.type === "string") {
		result += `{key: ${assoc.name}, value: ${assoc.expression}}`;
	}
	return result;
}

class ScopeRules {
	constructor (state = {context: {}}) {
		const self = this;
		self.parentNode = "program";
		self.state = state;
		state.loc = {
			start: {
				line: 0,
				column: 0
			},
			end: {
				line: 0,
				column: 0
			}
		}
		state.errorTail = () => `[${self.state.loc.start.line}:${self.state.loc.start.column}-${self.state.loc.end.line}:${self.state.loc.end.column}]`;
		state.root = state.context;
	    state.context = state.context;
	    state.context.args = [];
	    state.newChildContext = () => {
	    	let parent = state.context;
	    	let newContext = {
	    		scoping: {
			      let: new Map(),
			      private: new Map(),
			      protected: new Map(),
			      public: new Map(),
			      parent: parent
			    },
			    definedLocally: state.context.definedLocally,
			    idAvailable: state.context.idAvailable
	    	}
	    	newContext.args = [];
	    	state.context = newContext;
	    };

	    state.setParentContext = () => {
	    	state.context = state.context.scoping.parent;
	    };
	    state.context.definedLocally = (id = "", me = state.context) => {
	    	if (me.scoping.let.has(id)) {
	    		return me.scoping.let.get(id);
	    	}
	    	if (me.scoping.private.has(id)) {
	    		return me.scoping.private.get(id);
	    	}
	    	if (me.scoping.protected.has(id)) {
	    		return me.scoping.protected.get(id);
	    	}
	    	if (id in me.scoping.public) {
	    		return me.scoping.public[id];
	    	}
	    	return false;
	    }

	    state.context.idAvailable = (id="", me = state.context) => {
	    	if (!me) {
	    		return false;
	    	}

	    	if (me.definedLocally !== undefined && me.definedLocally(id, me)) {
	    		return true;
	    	}

	    	if (me.scoping && me.scoping.parent && me.scoping.parent.scoping) {
	    		return me.idAvailable(id, me.scoping.parent);
	    	}

	    	return false;
	    }

	    state.newChildContext();
	}

	assignmentExpression (name, expression) {
		return `scope.assignmentExpression("${name}", ${expression})`;
	}

	associativeDeclaration (name, type, expression) {
		const state = this.state;
		return {
			name: name,
			type: type,
			expression: expression
		};
	}

	associativeList (associativeList, associativeDeclaration) {
		const state = this.state;
		let result = '';
		let name = '';
		if (associativeDeclaration === undefined) {
			associativeDeclaration = associativeList;
			result =  buildArgPartFromAssocPart(associativeDeclaration);
		} else {
			result = associativeList + buildArgPartFromAssocPart(associativeDeclaration, true);
		}
		if (associativeDeclaration.type === 'id') {
			name = associativeDeclaration.name;
		} else {
			name = associativeDeclaration.name.substr(1,associativeDeclaration.name.length - 2);
		}
		state.context.scoping.let.set(name, true);
		state.context.args.push({name: name, default: associativeDeclaration.expression});
		return result;
	}

	binaryExpression (a, op, b) {
		return `${a} ${op} ${b}`;
	}

	booleanLiteral (bool) {
		return bool;
	}

	controlCode (controlCode="", expression) {
		if (expression === undefined) {
			return "";
		}
		return `${controlCode}${expression};\n`
	}

	declarationExpression (type, name, value) {
		const state = this.state;
		if (name in api) {
			throw `Syntax Error: '${name}' is a reserved word ${this.state.errorTail()}`;
		}
		if (state.context.definedLocally(name)) {
			throw `Syntax Error: '${name}' has already been defined in this context. ${this.state.errorTail()}`;
		}
		if (type === "let") {
			state.context.scoping.let.set(name, true);
			return `scope.declarationExpression({
				type: "${type}",
				name: "${name}",
				value: ${value}
			})`;
		}
		throw "TODO: Implement more declarations.";
	}

	expressionList (expression, expressionList) {
		if (expressionList === undefined) {
			return `${expression}`;
		}
		return `${expression}, ${expressionList}`;
	}
	
	identifier (name, children) {
		const state = this.state;

		if (this.parentNode === "assignmentExpression") {
			if (state.context.idAvailable(name)) {
				return name
			} else {
				throw `Identifier '${name}' is not defined ${this.state.errorTail()}`;
			}
		}

		if (children === undefined) {
			if (name in api) {
				return `${api[name]}`;
			}
			if (state.context.idAvailable(name)) {
				return `scope.identifier("${name}")`;
			}
			if (allowedUndefinedIdExpressions.indexOf(this.parentNode) !== -1) {
				return name;
			}
			throw `Identifier '${name}' is not defined ${this.state.errorTail()}`;
		}


		throw `TODO: Implement identifier children in parser ${this.state.errorTail()}`;

	}

	invokeExpression (name, invokeArguments) {
		return `scope.invokeExpression(${name}, [${invokeArguments}])`;
	}

	invokeArguments (expression="") {
		return `${expression}`;
	}
	
	numericLiteral (n) {
		return n;
	}

	returnExpression (expression) {
		return `return ${expression}`;
	}

	scopeStart () {
		this.state.newChildContext();
		return true;
	}

	scopeExpression (scopeStart, scopeArguments, controlCode) {
		const state = this.state;
		let argDeclarations = "";
		if (scopeStart !== true) {
			controlCode = scopeArguments;
			scopeArguments = scopeStart;
		}
		if (controlCode === undefined) {
			controlCode = scopeArguments;
			scopeArguments = "[]";
		}

		if (scopeArguments === undefined) {
			scopeArguments = "[]";
		}

		state.context.args.forEach((arg, index) => {
			argDeclarations += `scope.declarationExpression({
				type: "let",
				name: "${arg.name}",
				value: args[${index}] === undefined ? ${arg.default} : args[${index}]
			});`;
		});

		state.setParentContext();

		return `scope.createScope((args = ${scopeArguments}) => {
			${argDeclarations}
			${controlCode}
		})`;
	}

	scopeArguments (associativeList) {
		const state = this.state;

		return `[${associativeList}]`;
	}

	stringLiteral (str) {
		return JSON.stringify(str);
	}

	xmlControlCode (xmlControlCode="", expression) {
		if (expression === undefined) {
			return "";
		}
		if (xmlControlCode !== "") {
			xmlControlCode += ", \n";
		}
		return `${xmlControlCode}${expression}`;
	}

	xmlAttributes (xmlAttributes="", name, value) {
		if (name === undefined) {
			return "";
		}
		if (xmlAttributes !== "") {
			xmlAttributes += ", ";
		}
		return `${xmlAttributes} ${name}: ${value}`;
	}

	xmlExpression (name, xmlAttributes, xmlControlCode) {
		if (xmlControlCode === undefined) {
			return `scope.xmlExpression("${name}", {${xmlAttributes}})`;
		}
		return `scope.xmlExpression("${name}", {${xmlAttributes}}, ${xmlControlCode})`;
	}
}

export default ScopeRules;