module.exports = function identifier (id, name, isArr) {
    if (name !== void 0) {
        if (name === "__proto__" ||
            name === "prototype") {
                name  = '$' + name;
        }
        if (isArr !== void 0) {
            //console.log("isArr:", id, name);
            if (name.substr(0, 8) === 'replace:') {
                return name.substr(8);
            }
            return id + name;
        }
        this.ext['$$$runtimeError']();
        this.ext['Type']();
        return  '('+
            "(Type(" + id + ") !== 'instance')" +
            "?" +
            this.error(
                this.line,
                'runtime',
                'no properties',
                id
            ) +
             ':' + id + ').' + name;
    }
    var ret;
    if (id in this.ext) {
        ret = this.ext[id]();
    } else {
        ret ='((typeof '+id+' === "undefined" || root.'+id+' === '+id+') ? self("'+id+'", '+this.line+') : '+id+')';
    }

    return ret;
}
