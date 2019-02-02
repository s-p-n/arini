class TextNode {
	constructor (text = "") {
		this.value = text;
		this.parent = null;
	}

	toString () {
		return this.value;
	}
}

return TextNode;