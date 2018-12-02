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
}

return Api;