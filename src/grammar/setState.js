
// Gather preload functions.
// They take the parser as the sole argument.
// They might add state functions or something
// for different language structures.
// When all is said and done, `preloads`
// looks like:
//     Map { ...'preloadFile' => [Function: preloadFile] }
const fs = require("fs");
const path = require("path");
const Module = require('module');
const preloads = (function () {
	let preloadsDir = path.join(__dirname, "preloads");
	let preloadFileArray = fs.readdirSync(preloadsDir);
	let preloads = new Map();
	let jsExtension = /\.js$/i;
	for (let i = 0; i < preloadFileArray.length; i += 1) {
		preloads.set(
			preloadFileArray[i].replace(jsExtension, ""), 
			require(path.join(preloadsDir, preloadFileArray[i]))
		);
	}
	return preloads;
}());

let macros = {
	cwd: process.cwd(),
	include ({file}) {
		let p;
		if (!/^\/|[A-Z]\:\\/.test(file)) {
			p = path.join(this.cwd, file);
		} else {
			p = file;
		}
		let oldCwd = this.cwd;
		this.cwd = path.dirname(p);
		let contents = fs.readFileSync(p, "utf8");
		contents = parseMacros(contents);
		this.cwd = oldCwd;
		return `(function () {
${contents}
}())`;
	}
}

function parseMacros(code) {
	const tagSearch = /\<([a-z]+)\s*((?:[a-z]+\s*\=\s*\"(?:\\.|[^"])*\"\s*)*)\/\>/igm;
	const attrSearch = /([a-z]+)\s*\=\s*(\"(?:\\.|[^"])*\")/igm;
	function getAttributesObj (attributes) {
		let obj = Object.create(null);
		attributes.replace(attrSearch, function (fullMatch, name, value) {
			//console.log(value);
			obj[name] = value.substr(1,value.length - 2);
			return "";
		});
		return obj;
	}
	let match;
	while ((match = tagSearch.exec(code)) !== null) {
		code = code.replace(tagSearch, function (fullMatch, name, attributes) {
			if (attributes === "") {
				return macros[name]();
			}
			return macros[name](getAttributesObj(attributes));
		});
	}
	return code;
}

function requireFromString(src, filename) {
	const parent = module.parent;
	const m = new Module(filename, parent);
	m.filename = filename;
	m.paths = Module._nodeModulePaths(path.dirname(filename));
	//console.log(src);
	m._compile(src, filename);
	return m.exports;
}

module.exports = function setState (parser, runtime={}) {

	// Run all preloads (from the preloads directory).
	for (let [,prep] of preloads) prep(parser);

	parser.yy.script_dir = (process.argv[2] !== undefined) ? path.dirname(path.join(process.cwd(), process.argv[2])) : process.cwd();

	parser.eval = function (name="shell", 
			prefix="module.exports = (async function(){this._scoping=scope._scoping;", 
			suffix="}());"
		) {
		let code = `[${Object.keys(runtime).join(',')}]=[${Object.values(runtime).join(',')}];`;
		let processedArini = parser.yy.scope.toJS();
		code += prefix + processedArini + suffix;
		code = parseMacros(code);
		//console.log(code);
		return requireFromString(code, name);
	}
	parser.include = function (f) {
		let g = require('./grammar.js');
		let r = require('../runtime/runtime.js');
		let p = new g(r);
		let code = fs.readFileSync(f, "utf8");
		p.yy.script_dir = path.dirname(f);
		console.log("child script_dir:", p.yy.script_dir);
		p.parse(`{${code}}();`);
		return p.yy.scope.toJS();
	}
	parser.require = function (f) {
		let g = require('./grammar.js');
		let r = require('../runtime/runtime.js');
		let p = new g(r);
		let code = fs.readFileSync(f, "utf8");
		//console.log(code);
		p.parse(code);
		return p.eval(f, "module.exports=scope.createScope(function(){this._scoping=scope._scoping;", "})()");
	}

	parser.yy.parseError = function (str="", hash={
		text: "",
		line: 0,
		token: "",
		loc: [],
		expected: [],
		recoverable: false
	}) {
		let solution = "unknown";
		if (hash.solution) {
			solution = hash.solution;
		}
		console.log(`
${str}
Line: ${hash.line + 1}
Text: ${hash.text}
Token: ${hash.token}`);
		if (solution !== "unknown") {
			console.log(`Suggested Fix: ${solution}`);
		}

		if (hash.recoverable) {
			console.log("Error is recoverable.");
		} else {
			console.log(this.pushState);
			process.exit();
		}
	}
}