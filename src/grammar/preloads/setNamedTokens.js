let namedTokens = [
	["true|false", "BOOL"],
	["let|var|public|protected|private", function (txt) {
		this.pushState("declLeft");
		if (/^(?:let|var)$/i.test(txt)) {
			return "LET";
		}
		return txt.toUpperCase();
	}],
	["is", "EQ"],
	["isnt", "INEQ"],
	["func(tion)?", "FUNCTION"
	/*function (txt) {
		// privous implementation: "f(un(ction)?)?" or "f|fun|function"
		// `Is '${txt}' a function or ID? hmm....`
		// "Let's see.. Here's what comes next:"
		// this._input

		// If next token is '{'
		if (/^\s*\{/.test(this._input)) {
			return "FUNCTION";
		}

		// If next token is '(', it could be an invokation- but could also be a function declaration.
		// It's not trivial to figure out which- and figuring that out is an expensive operation.
		// A human could very likely be confused when seeing `f(...` as well. Seeing as, f(foo){} is a
		// function literal, might `f(foo)...` appear as a function literal too (as opposed to an invokation)?
		// 
		if (/^\s*)

		return "JSPROPERTY";
	}*/],
	["BECOME(S)?", "BECOMES"],
	"AND",
	"BY",
	"DECREMENT",
	"ELSE",
	"FOR",
	"FROM",
	"HAS",
	"IF",
	"IMPORT",
	"IN",
	"INCREMENT",
	"MINUS",
	"NEW",
	"OF",
	"ONLY",
	"OR",
	"PLUS",
	"RANDOM",
	"RETURN",
	"SPREAD",
	"TIMES",
	"TO",
	"UNDEFINED",
	"USE",
	"WHILE"
];

let builtTokens = new Map();
function setToken(search, result) {
	if (typeof search !== "string") {
		throw new Error(`Bad Named Token in Parser. (search expected to be string)
got: ${search}
`);
	}
	builtTokens.set(new RegExp("^(?:" + search + ")$", "i"), result);
}

for (let token of namedTokens) {
	if (!(token instanceof Array)) {
		setToken(token, token);
		continue;
	}
	if (token.length === 0) {
		continue;
	}
	if (token.length === 1) {
		setToken(token[0], token[0]);
		continue;
	}
	if (token.length === 2) {
		setToken(token[0], token[1]);
		continue;
	}
	throw new Error(`Bad Named Token in Parser. (incorrect token layout).

got: ${token}
`);
}

module.exports = function setNamedTokens(parser) {
	parser.yy.namedTokens = builtTokens;
}