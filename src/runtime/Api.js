const Arini = require("arini");
const fs = require("fs");
const path = require("path");
const util = require("util");
const child_process = require("child_process");
const runFile = path.join(path.dirname(require.resolve('arini')), 'src/bin/runFile.js');
console.log(runFile);
const debug = (...args) => {
	return console.log(...args);
};
async function getTranslation (file) {
	const filename = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
	const n = child_process.fork(runFile, [filename, '--fork']);

	n.on[util.promisify.custom] = function () {
		let cwd = process.cwd();
		console.log("cwd:", cwd);
		return new Promise((resolve, reject) => {
			let t = setTimeout(() => {
				reject('timeout');
			}, 10000);
			debug(`Awaiting code for file: ${filename}`);
			n.on('message', async (m) => {
				clearTimeout(t);
				process.chdir(path.dirname(filename));
				try {
					let result;
					let prefix = '';
					if (m.code.indexOf("await ") !== -1) {
						debug(" await found.");
						prefix = "async ";
					}
					result = eval(`scope.createScope(${prefix}function (...args) {this._scoping=scope._scoping;${m.code}})()`);
					debug(`got result for ${filename}`);
					//debug(result);
					resolve(result);
				} catch (err) {
					reject(err);
				}
				process.chdir(cwd);
			});
			n.on('error', reject);
		});
	};
	return await n.on[util.promisify.custom]();
}

class Api {
	createDocument () {
		const self = this;
		let document = self.xml("html", [
			self.xml("head"),
			self.xml("body")
		]);
		return document;
	}

	shallowClone (a, b) {
		let ad = Object.getOwnPropertyDescriptors(a);
		let bd = Object.getOwnPropertyDescriptors(b);
		let props = {};
		//let items = [...b];
		for (let prop in bd) {
			if (!bd[prop].enumerable) {
				continue;
			}
			if (ad[prop]) {
				if (!ad[prop].configurable) {
					continue;
				}
			}
			if (/^[0-9]+$/.test(prop)) {
				continue;
			}
			props[prop] = bd[prop];
		}
		Object.defineProperties(a, props);
		//for (let i = 0; i < items.length; i += 1) {
		//	a.push(items[i]);
		//}
	}

	async compile (file) {
		debug(file);
		debug(process.cwd());
		if (!fs.existsSync(file)) {
			throw new Error(`compile error: File not found: '${file}'`);
		}
		let stats = fs.lstatSync(file);
		if (stats.isDirectory()) {
			debug("is a dir");
			let dir = fs.readdirSync(file);
			debug(dir);
			let result = await Promise.all(dir.map((f)=>{
				return this.compile(path.join(file, f));
			}));
			
			return result;
		}
		if (!stats.isFile()) {
			throw new Error("Not a file..");
		}
		debug('found file');
		
		
		return await getTranslation(file);
	}
}

return Api;