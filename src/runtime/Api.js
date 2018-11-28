class Api {
	createDocument () {
		const self = this;
		let document = self.xml("html", [
			self.xml("head"),
			self.xml("body")
		]);
		return document;
	}


}

return Api;