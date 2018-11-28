module.exports = function setXmlState (parser) {
	class Tag {
		constructor (tagName, attributes) {
			this.tagName = tagName;
			this.attributes = attributes;
		}
		toJS () {
			let children = parser.yy.scope.expressions;
			let result = `scope.xml("${this.tagName}",{${this.attributes}}`;
			if (children.length === 0) {
				return result + ")";
			}
			result += ",[";
			for (let i = 0; i < children.length; i += 1) {
				let child = children[i];
				if (i !== 0) {
					result += ",";
				}
				if (child instanceof Tag) {
					result += child.toJS();
				} else {
					result += child;
				}
			}
			result += '])';
			return result;
		}
	}

	parser.yy.xml = {
		Tag: Tag
	};
};