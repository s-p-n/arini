#!/usr/bin/env node

const inputFile = process.argv[2];
const option = process.argv[3];
const debug = (msg) => {
	return console.log(`${debug.id}\t[${Date.now()-start}ms]:\t${msg}`);
};
debug.id = "";
const start = Date.now();
//process.exit();
if (typeof inputFile === "undefined") {
	require('./interactive.js');
} else {
	const path = require('path');
	const fs = require('fs');
	const cwd = process.cwd();
	const file = path.isAbsolute(inputFile) ? inputFile : path.join(cwd, inputFile);
	const runtime = require('../runtime/runtime.js');
	const Grammar = require('../grammar/grammar.js');

	debug.id = path.dirname(file) + '->' + path.basename(file);

	async function setupParser() {
		debug("setting up parser.");
		let p = await new Grammar(runtime);
		debug("parser setup.");
		return p;
	}

	async function getFile() {
		//debug(`Looking up ${file}..`);
		if (!(await fs.existsSync(file))) {
			debug(`Error: Cannot find file: ${file}`);
			process.exit(1);
		}
		debug(`Found ${file}`);
		let contents = await fs.readFileSync(file, "utf8");
		debug("Got file contents.");
		return contents; 
	}

	debug("Reading file and setting up parser..");
	Promise.all([setupParser(), getFile()]).
	then(setup => {
		let [parser, code] = setup;
		debug("Setup complete.");
		debug("Executing file.");
		parser.parse(code);
		
		switch(option) {
		case "--fork":
			debug("forking...");
			process.send({code: parser.yy.scope.toJS()});
			break;
		case "--toJS":
			console.log(parser.yy.scope.toJS());
			break;
		default:
			parser.eval();
		}
		debug(`finished.`);
	}).catch(console.error);
}