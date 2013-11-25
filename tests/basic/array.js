#!/usr/bin/env node
/// < Shims
Function.prototype.bind = (function(origBind) {
    return function bind() {
        var fn = origBind.apply(this.unbind(), arguments);
        fn.__origFn__ = this.__origFn__ || this;
        return fn;
    }
}(Function.prototype.bind));
Function.prototype.unbind = function unbind() {
    return this.__origFn__ || this;
};
if (typeof Object.create === 'undefined') {
    Object.create = function(o) {
        function F() {};
        F.prototype = o;
        return new F();
    }
};
Array.prototype.has = function(term) {
    var key, result = false;
    for (key in this) {
        if (!this.hasOwnProperty(key)) {
            continue;
        }
        if ($compare(this[key], term).$values["Boolean"]()) {
            result = true;
            break;
        }
    }
    return $primitive("Boolean", function() {
        return result;
    });
}
/// > Shims

function $self(access, name, value) {
    var line;
    if (typeof name === "number") {
        line = name;
        name = void 0;
    }
    if (name === void 0) {
        name = access;
        if (typeof this[name] !== "undefined") {
            return this[name];
        } else if (typeof this.$property[name] !== "undefined") {
            return this.$property[name];
        }
        var parent = this;
        while (parent !== null) {
            if (typeof parent[name] !== "undefined") {
                return parent[name];
            }
            parent = parent.$parent.$values["Instance"]();
        }
        throw "Undefined variable/property: " + name + " on line: " + line;
    }
    if (value === void 0) {
        value = name;
        name = access;
        if (typeof this[name] !== "undefined") {
            return this[name] = value;
        } else if (typeof this.$property[name] !== "undefined") {
            return this.$property[name] = value;
        }
    }
    if (access === "var") {
        return this[name] = value;
    }
    this.$access[name] = access;
    return this.$property[name] = value;
};

function $arg(name, $default, value) {
    if (value === void 0) {
        value = $default;
    }
    return this.$self("protected", name, value);
};

function $primitive(types, val) {
    var obj = {
        $values: {}
    };
    var i;
    if (typeof val === "object" && val.$types !== void 0) {
        return val;
    }
    if (types instanceof Array) {
        obj.$types = types;
    } else {
        obj.$types = [types];
    }

    if (typeof val === "object") {
        obj.$values = val;
    } else {
        obj.$values[obj.$types[0]] = val;
    }
    return obj;
}

function $newParent(parent) {
    var newParent = $primitive("Instance", function() {
        return parent;
    });
    var result = {
        $access: {},
        $property: {
            $public: {},
            $protected: {},
            $private: {}
        },
        $parent: newParent
    };
    result.$self = $self.bind(result);
    result.$arg = $arg.bind(result);
    return result;
};

function $enforceType(type, term, line) {
    if (Type(term).indexOf(type) !== -1) {
        return term;
    }
    $runtimeError(line, "Expected " + type + " and got %what%.");
};
var $root = $newParent(null);
var $i;
for ($i in $root) {
    this[$i] = $root[$i];
}

var $compare = function() {
    var equals = function(a, b) {
        var p;
        if (typeof a.$types !== "undefined") {
            //console.log("equals is a scope primitive:", a, b);
            return $compare(a, b).$values["Boolean"]();
        }
        //console.log("equals is a JS primitive:", a, b);
        if (typeof a !== "object") {
            return a === b;
        }
        for (p in a) {
            if (typeof(b[p]) == 'undefined') {
                return false;
            }
            if (a[p]) {
                switch (typeof(a[p])) {
                    case 'object':
                        if (!equals(a[p], b[p])) {
                            return false;
                        }
                        break;
                    case 'function':
                        if (typeof(b[p]) == 'undefined' ||
                            (p != 'equals' && (a[p].toString() != b[p].toString() ||
                                a[p].unbind().toString() != b[p].unbind().toString()
                            ))) {
                            return false;
                        }
                        //console.log("func:", a[p].unbind().toString() != b[p].unbind().toString())
                        break;
                    default:
                        if (a[p] !== b[p]) {
                            return false;
                        }
                }
            } else if (b[p]) {
                return false;
            }
        }
        for (p in b) {
            if (typeof(a[p]) == 'undefined') {
                return false;
            }
        }
        return true;
    };
    return function $compare(a, b) {
        var i, j, c, result = true;
        if (a.$types.length > b.$types.length) {
            c = a;
            a = b;
            b = a;
        }
        //console.log("$compare:")
        //Console.$values["Instance"]().write.$values["Scope"]()(a);
        //Console.$values["Instance"]().write.$values["Scope"]()(b);
        for (i = 0; i < a.$types.length; i += 1) {
            if (b.$types.indexOf(a.$types[i]) > -1 &&
                equals(a.$values[a.$types[i]](), b.$values[a.$types[i]]())
            ) {
                //console.log("Got true");
                continue;
            }
            //console.log("Got false");
            result = false;
            break;
        }
        //console.log("Returning", result);


        return $primitive("Boolean", function(val) {
            return function() {
                return val;
            }
        }(result))
    }
}();
var $array = (function() {
    var assocArray = function() {
        var obj = {};
        Object.defineProperty(obj, 'length', {
            enumerable: false,
            value: 0,
            configurable: false,
            writable: true
        });
        return obj;
    };
    return function $array(arr) {
        var n, i;
        if (arr instanceof Array) {
            return $primitive("Array", function() {
                return arr;
            });
        }
        n = assocArray();
        for (i in arr) {
            n[i] = arr[i];
            n.length += 1;
        }
        return $primitive("Array", function() {
            return n;
        });
    }
}());
var $runtimeError = function $runtimeError(line, msg, what) {
    throw new Error(
        "\033[31m\033[1m Runtime Error:\033[0m\033[1m " +
        msg.replace(/%what%/g, what).replace(/%red%/g, '\033[31m').replace(/%default%/g, '\033[0m\033[1m').replace(/%green%/g, '\033[32m') +
        "\033[1m on line: \033[31m" + line + '\033[0m'
    );
}
var Type = {
    $types: ["Scope"],
    $values: {
        "Scope": function() {
            return function Type(primitive) {
                var types = [];
                var i;
                for (i = 0; i < primitive.$types.length; i += 1) {
                    types.push($primitive("Text", function(val) {
                        return function() {
                            return val;
                        }
                    }(primitive.$types[i])));
                }
                return $primitive("Array", function() {
                    return types;
                })
            }
        }
    }
};
var Text = {
    $types: ["Scope", "Instance"],
    $values: {
        "Scope": function() {
            return function Text(primitive, fromType) {
                var result = null,
                    res = "";
                if (fromType !== void 0) {
                    fromType = fromType.$values["Text"]();
                    if (primitive.$values.hasOwnProperty(fromType)) {
                        res = primitive.$values[fromType]().toString();
                        result = function() {
                            return res;
                        };
                    }
                } else if (primitive.$values.hasOwnProperty("Text")) {
                    result = primitive.$values["Text"];
                } else if (primitive.$types.length === 1) {
                    res = Console.$values['Instance']().printValues.$values["Scope"]()(primitive);
                    if (res.Number !== void 0) {
                        res = "" + res.Number;
                    }
                    result = function() {
                        return res;
                    };
                }
                if (result === null) {
                    throw "Error! Multi-Type Primitive (without a text-type and no specified type for" +
                        "Text(Any:Primitive [, Text:fromType])), cannot be converted to Text.";
                }
                return $primitive("Text", result);
            }
        },
        "Instance": function() {
            return {
                "split": {
                    $types: ["Scope"],
                    $values: {
                        "Scope": function() {
                            var findNext = function(unit, sep) {
                                var match = unit.match(sep);
                                return match !== null ? match.index : -1;
                            }
                            var f = function(val) {
                                return function() {
                                    return val;
                                }
                            }
                            return function split(txt, sep, maxSplit) {
                                var hasMax = false;
                                var result = [];
                                var i;
                                txt = txt.$values["Text"]();
                                return $primitive("Text", f(txt.split(sep, maxSplit)));
                                /*
                                if (typeof sep === "undefined") {
                                    sep = /\s+/;
                                } else {
                                    sep = sep.$values["Text"]();
                                }

                                if (typeof maxSplit === "undefined") {
                                    hasMax = true
                                }
                                for (i = findNext(txt, sep); i !== -1; i = findNext(txt, sep)) {
                                    result.push($primitive("Text", f(txt.substr(0, i))));
                                    txt = txt.substr(i + 1);
                                }
                                result.push($primitive("Text", f(txt)));
                                return {
                                    $types: ["Array"],
                                    $values: {
                                        "Array": function() {
                                            return result;
                                        }
                                    }
                                };
                                */

                            }
                        }
                    }
                },
                "rsplit": {
                    $types: ["Scope"],
                    $values: {
                        "Scope": function() {
                            var findNext = function(unit, sep) {
                                var match = unit.match(sep);
                                return match !== null ? match.index : -1;
                            }
                            var f = function(val) {
                                return function() {
                                    return val;
                                }
                            }
                            String.prototype.rsplit = function(sep, maxsplit) {
                                var split = this.split(sep);
                                return maxsplit ? [split.slice(0, -maxsplit).join(sep)].concat(split.slice(-maxsplit)) : split;
                            };
                            return function rsplit(txt, sep, maxSplit) {
                                var maxSplit = maxSplit || 0;
                                var result = [];
                                var i;
                                var txt = txt.$values["Text"]().rsplit(sep.$values["Text"](), maxSplit.$values["Number"]());
                                for (i = 0; i < txt.length; i += 1) {
                                    txt[i] = $primitive("Text", f(txt[i]));
                                }
                                return $array(txt);
                            }
                        }
                    }
                }
            }
        }
    }
};
var Scope = {
    $types: ["Instance"],
    $values: {
        "Instance": function() {
            return {
                extend: {
                    $types: ["Scope"],
                    $values: {
                        "Scope": function() {
                            return function extend(extended, extendee) {
                                var result;
                                parent = null;
                                extendee = extendee.$values["Scope"]().unbind();
                                extended = extended.$values["Scope"]().bind($newParent(parent));
                                //console.log("Extend:", extendee, extended);
                                result = function() {
                                    var i, access;
                                    var extension = extended.apply(this, arguments);
                                    //console.log("extension:", extension);
                                    this.$self("protected", "extended", extension);
                                    for (i in extension.$access) {
                                        access = extension.$access[i]
                                        if (access === "private") {
                                            continue;
                                        }
                                        this.$self(access, i, extension.$property[i]);
                                    }
                                    //console.log(this);
                                    return extendee.apply(this, arguments);
                                }.bind($newParent(parent));
                                result.name = extendee.name;
                                //console.log("Result:", result);
                                return $primitive("Scope", function() {
                                    return result
                                });
                            }
                        }
                    }

                }
            }
        }
    }
};
var Console = (function Console() {
    var rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.pause();

    function callback(fn) {
        return function cb(data) {
            rl.pause();
            data = data.replace(/\n/g, "");
            fn.$values["Scope"]()($primitive("Text", function() {
                return data;
            }));
        }
    }

    function printValues(Arr) {
        var result = {}, key, val, i;
        for (key in Arr.$values) {
            val = Arr.$values[key]();
            if (key === "Array" || key === "Instance") {
                result[key] = [];
                for (i in val) {
                    if (val.hasOwnProperty(i)) {
                        result[key][i] = printValues(val[i]);
                    }
                }
                continue;
            }
            result[key] = val;
        }
        return result;
    }

    return {
        $types: ["Instance"],
        $values: {
            "Instance": function() {
                return {
                    write: {
                        $types: ["Scope"],
                        $values: {
                            "Scope": function() {
                                return function write() {
                                    var i = 0,
                                        result = [],
                                        subResult, key, val;
                                    while (arguments[i] !== void 0) {
                                        //console.log("Arg:", arguments[i]);
                                        result.push(printValues(arguments[i]));
                                        i += 1;
                                    }
                                    console.log.apply(console, result);
                                }
                            }
                        }
                    },
                    read: {
                        $types: ["Scope"],
                        $values: {
                            "Scope": function() {
                                return function read(fn) {
                                    rl.resume();
                                    rl.on('line', callback(fn));
                                }
                            }
                        }
                    },
                    printValues: {
                        $types: ["Scope"],
                        $values: {
                            "Scope": function() {
                                return printValues;
                            }
                        }
                    }
                }
            }
        }
    };
}());
var print = {
    $types: ["Scope"],
    $values: {
        "Scope": function() {
            return function print() {
                var result = "";
                var i = 0;
                do {
                    result += Text.$values["Scope"]()(arguments[i]).$values["Text"]();
                } while (((i += 1) in arguments) && (result += " "));
                console.log(result);
            }
        }
    }
};
/*
Array.prototype.substr = function substr (start, end) {
    var i, result = [];
    if (end === void 0) {
        end = this.length;
    }
    if (start === void 0) {
        start = 0;
    }
    if (end > start) {
        for (i = start; this[i] && i < end; i += 1) {
            result.push(this[i]);
        }
    } else if (end < start) {
        for (i = start; this[i] && i > end; i -= 1) {
            result.push(this[i]);
        }
    } else {
        result.push(this[start]);
    }
    return result;
}
*/
(function() {
    var $substrFunc = function(start, end, returnIndex) {
        var i,
            newEnd,
            len = this.length,
            result = "";

        if (this instanceof Array) {
            result = [];
        }

        if (end === "complete") {
            end = len;
        }
        newEnd = end;
        if (end < 0 && len > 0) {
            newEnd = end + len;
        }
        //console.log("substr:", start, end, newEnd, returnIndex);
        if (returnIndex) {
            //console.log("arraySubstr returnIndex is true:", newEnd, this[newEnd]);
            return this[newEnd];
        }
        for (i = start; newEnd > start && i < newEnd && i < len; i += 1) {
            if (typeof result === "string") {
                result += this[i];
            } else {
                result.push(this[i]);
            }

        }
        return result;
    };
    Object.defineProperty(Array.prototype, "$substr_arr", {
        enumerable: false,
        configurable: false,
        writable: false,
        value: $substrFunc
    });
    Object.defineProperty(String.prototype, "$substr_txt", {
        enumerable: false,
        configurable: false,
        writable: false,
        value: $substrFunc
    });
    Object.defineProperty(Object.prototype, "$substr_arr", {
        enumerable: false,
        configurable: false,
        writable: false,
        value: $substrFunc
    });
}());


Object.defineProperty(Object.prototype, "$substr", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function $substr(start, end) {
        var result = {
            $types: [],
            $values: {}
        };
        var returnIndex = false;
        var what = this;
        var f = function(val) {
            return function() {
                return val;
            }
        };
        if (what.$types.indexOf("Array") !== -1 && !(what.$values["Array"]() instanceof Array)) {
            return what.$values["Array"]()[start];
        }

        start = parseInt(start);
        if (end === void 0) {
            end = start;
            returnIndex = true;
        } else if (end !== "complete") {
            end = parseInt(end);
        }

        //console.log("what:", what);
        //console.log("what values:", what.$values);
        //console.log("returnIndex:", returnIndex);
        if (what.$values.hasOwnProperty("Array")) {
            //console.log("has Array", what.$values["Array"]());
            result = what.$values["Array"]().$substr_arr(start, end, returnIndex);
            //console.log("result:", result);
            if (result instanceof Array) {
                result = $array(result);
            }
        } else if (what.$values.hasOwnProperty("Text")) {
            //console.log("has Text", what.$values["Text"]());
            result.$types.push("Text");
            result.$values["Text"] = f(what.$values["Text"]().$substr_txt(start, end, returnIndex));
        }
        //console.log("$substr result:", result);
        return result;
    }
});
var $compare = function() {
    var equals = function(a, b) {
        var p;
        if (typeof a.$types !== "undefined") {
            //console.log("equals is a scope primitive:", a, b);
            return $compare(a, b).$values["Boolean"]();
        }
        //console.log("equals is a JS primitive:", a, b);
        if (typeof a !== "object") {
            return a === b;
        }
        for (p in a) {
            if (typeof(b[p]) == 'undefined') {
                return false;
            }
            if (a[p]) {
                switch (typeof(a[p])) {
                    case 'object':
                        if (!equals(a[p], b[p])) {
                            return false;
                        }
                        break;
                    case 'function':
                        if (typeof(b[p]) == 'undefined' ||
                            (p != 'equals' && (a[p].toString() != b[p].toString() ||
                                a[p].unbind().toString() != b[p].unbind().toString()
                            ))) {
                            return false;
                        }
                        //console.log("func:", a[p].unbind().toString() != b[p].unbind().toString())
                        break;
                    default:
                        if (a[p] !== b[p]) {
                            return false;
                        }
                }
            } else if (b[p]) {
                return false;
            }
        }
        for (p in b) {
            if (typeof(a[p]) == 'undefined') {
                return false;
            }
        }
        return true;
    };
    return function $compare(a, b) {
        var i, j, c, result = true;
        if (a.$types.length > b.$types.length) {
            c = a;
            a = b;
            b = a;
        }
        //console.log("$compare:")
        //Console.$values["Instance"]().write.$values["Scope"]()(a);
        //Console.$values["Instance"]().write.$values["Scope"]()(b);
        for (i = 0; i < a.$types.length; i += 1) {
            if (b.$types.indexOf(a.$types[i]) > -1 &&
                equals(a.$values[a.$types[i]](), b.$values[a.$types[i]]())
            ) {
                //console.log("Got true");
                continue;
            }
            //console.log("Got false");
            result = false;
            break;
        }
        //console.log("Returning", result);


        return $primitive("Boolean", function(val) {
            return function() {
                return val;
            }
        }(result))
    }
}();
var $$$0 = $primitive('Number', function() {
    return 1
}.bind($root));
var $$$1 = $primitive('Number', function() {
    return 2
}.bind($root));
var $$$2 = $primitive('Number', function() {
    return 3
}.bind($root));
var $$$3 = $primitive('Text', function() {
    return "is"
}.bind($root));
var $$$4 = function() {
    return (print.$values["Scope"]()(this.$self("name", 3), $$$3, this.$self("val", 3)))
}.bind($root);
var $$$5 = function() {
    return (function() {
        this.$self("var", "name", "");
        this.$self("var", "val", null);
        var name, $$$list = this.$self("array", 2).$values["Array"]();
        for (name in $$$list) {
            this.$self("name", $primitive((typeof name === "String" ? "Text" : "Number"), function() {
                return name;
            }));
            if ($$$list.hasOwnProperty(name)) {
                this.$self("val", $$$list[name]);
                (function() {
                    return $$$4();;

                }.bind(this)());
            }
        }
    }.bind(this)())
}.bind($root);
var $$$6 = $primitive('Text', function() {
    return 'b'
}.bind($root));
var $$$7 = function() {
    return (print.$values["Scope"]()(this.$self("array", 6).$substr(($$$6.$values["Number"] || $$$6.$values["Text"])())))
}.bind($root);
var $$$8 = $primitive('Text', function() {
    return "Say something and press enter.."
}.bind($root));
var $$$9 = function() {
    return (print.$values["Scope"]()($$$8))
}.bind($root);
var $$$10 = function() {
    return (Console.$values["Instance"]().read.$values["Scope"]()( /* Starting Scope:1 */ $primitive("Scope", function() {
        return function() {
            var $returnMulti = [],
                $temp, $val;
            var $$$0 = $primitive('Text', function() {
                return ""
            }.bind(this));
            var $$$1 = $primitive('Text', function() {
                return "You didn't say nothin :("
            }.bind(this));
            var $$$2 = function() {
                return (print.$values["Scope"]()($$$1))
            }.bind(this);
            var $$$3 = $primitive('Text', function() {
                return "data:"
            }.bind(this));
            var $$$4 = function() {
                return (print.$values["Scope"]()($$$3, this.$self("data", 17)))
            }.bind(this);
            var $$$5 = $primitive('Text', function() {
                return ''
            }.bind(this));
            this.$arg("data", $$$5, arguments[0]);
            /* Begin ControlCode: 1 */
            (function() {
                if (($compare(this.$self("data", 14), $$$0)).$values["Boolean"]()) {
                    return (function() {
                        return $$$2();;
                    }.bind(this)());
                } else {
                    return (function() {
                        return $$$4();;
                    }.bind(this)());
                }
            }.bind(this)());
            $returnMulti.push($primitive("Instance", function(value) {
                return function() {
                    return value;
                }
            }(this)));
            var $i = 0,
                $j = 0,
                $returnMultiType, $returnTypes, $returnValues;
            var $return = {
                $types: [],
                value: null,
                $values: {}
            };
            $returnTypes = $return.$types;
            for ($i = 0; $i < $returnMulti.length; $i += 1) {
                for ($j = 0; $j < $returnMulti[$i].$types.length; $j += 1) {
                    $returnMultiType = $returnMulti[$i].$types[$j];
                    if ($returnTypes.indexOf($returnMultiType) === -1) {
                        $returnTypes.push($returnMultiType);
                    }
                    $return.$values[$returnMultiType] = $returnMulti[$i].$values[$returnMultiType];
                }
            }
            return $return;
        }.bind(this);
    }.bind($newParent($root)))))
}.bind($root);; /* Begin ControlCode: 0 */
$root.$self("var", "array", $array({
    "a": $$$0,
    "b": $$$1,
    "c": $$$2
}));
$$$5();
$$$7();
$$$9();
$root.$self("var", "data", $$$10());