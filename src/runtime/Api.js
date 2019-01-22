const Arini = require("arini");
const fs = require("fs");
const path = require("path");
const util = require("util");
const child_process = require("child_process");

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

	require (file) {
		if (!fs.existsSync(file)) {
			return false;
		}
		let stats = fs.lstatSync(file);
		if (stats.isDirectory()) {
			console.log("is a dir");
			let dir = fs.readdirSync(file);
			console.log(dir);
			return Promise.all(dir.map(f=>this.require(path.join(file, f))));
		}
		if (!stats.isFile()) {
			console.log("Not a file..");
			return false;
		}
		console.log('found file');
		async function getTranslation () {
			const n = child_process.fork("../src/bin/runFile.js", [file, '--fork']);
			n.on[util.promisify.custom] = function () {
				return new Promise((resolve, reject) => {
					let t = setTimeout(() => {
						reject('timeout');
					}, 10000);

					n.on('message', m => {
						clearTimeout(t);
						resolve(eval(`scope.createScope(function (...args) {${m.code}})`));
					});
				});
			}
			return await n.on[util.promisify.custom]();
		}
		return getTranslation();
	}
}

return Api;