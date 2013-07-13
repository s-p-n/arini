module.exports = function scopeStart() {
    this.lastParent.push(this.curParent);
    if (this.curParent === -1) {
        this.curParent = 0;
    } else {
        this.curParent = this.parentId;
    }
    return this.loadTemplate('scopeStart', {
    	id: this.curParent
    });
}
