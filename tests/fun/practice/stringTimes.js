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
            //console.log("$array:", arr);
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
                    res = primitive.$values[primitive.$types[0]]().toString();
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
                            return function extend(extended, extendee, parent) {
                                var result;
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
var len = $primitive("Scope", function() {
    return function len(thing) {
        var result;
        if (typeof thing.$values["Array"] !== "undefined") {
            result = thing.$values["Array"]().length;
        } else if (typeof thing.$values["Text"] !== "undefined") {
            result = thing.$values["Text"]().length;
        } else {
            result = 0;
        }
        return $primitive("Number", function() {
            return result;
        });
    }
});
var $Math = {
    add: function add(a, b) {
        return $primitive("Number", function(val) {
            return function() {
                return val;
            }
        }(a.$values["Number"]() + b.$values["Number"]()));
    },
    subtract: function subtract(a, b) {
        return $primitive("Number", function(val) {
            return function() {
                return val;
            }
        }(a.$values["Number"]() - b.$values["Number"]()));
    },
    multiply: function multiply(a, b) {
        return $primitive("Number", function(val) {
            return function() {
                return val;
            }
        }(a.$values["Number"]() * b.$values["Number"]()));
    },
    divide: function divide(a, b) {
        return $primitive("Number", function(val) {
            return function() {
                return val;
            }
        }(a.$values["Number"]() / b.$values["Number"]()));
    },
    modulus: function divide(a, b) {
        return $primitive("Number", function(val) {
            return function() {
                return val;
            }
        }(a.$values["Number"]() % b.$values["Number"]()));
    }
};
var Compatible = {
    $types: ["Scope"],
    $values: {
        "Scope": function() {
            return function(a, b) {
                var i, result = true;
                for (i = 0; i < b.$types.length; i += 1) {
                    if (a.$types.indexOf(b.$types[i]) === -1) {
                        result = false;
                        break;
                    }
                }
                return $primitive("Boolean", function() {
                    return result;
                });
            }
        }
    }
}
var $compare = function() {
    var equals = function(a, b) {
        var p;
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
                            (p != 'equals' && a[p].toString() != b[p].toString())) {
                            return false;
                        }
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
        for (i = 0; i < a.$types.length; i += 1) {
            if (b.$types.indexOf(a.$types[i]) > -1 &&
                equals(a.$values[a.$types[i]](), b.$values[a.$types[i]]())
            ) {
                continue;
            }
            result = false;
            break;
        }
        return $primitive("Boolean", function(val) {
            return function() {
                return val;
            }
        }(result))
    }
}();
var $concat = function $concat(a, b, line) {
    var type = Type.$values["Scope"](),
        compatible = Compatible.$values["Scope"](),
        concatTestBoth = $primitive(["Text", "Array"], {
            "Text": function() {
                return "";
            },
            "Array": function() {
                return [];
            }
        }),
        compatTestText = $primitive("Text", function() {
            return "";
        }),
        compatTestArray = $primitive("Array", function() {
            return [];
        }),
        concatFunc = function(value) {
            return function() {
                return value;
            }
        },
        txtConcat = function(a, b) {
            return a.$values["Text"]() + b.$values["Text"]();
        },
        arrConcat = function(a, b) {
            var result,
                subResult,
                shortest,
                i,
                type,
                len,
                f = function(val) {
                    return function() {
                        return val;
                    }
                };
            //console.log("a:");
            //Console.write.$values["Scope"]()(a);
            //console.log("b:");
            //Console.write.$values["Scope"]()(b);
            a = a.$values["Array"]();
            b = b.$values["Array"]();
            if (a.length > b.length) {
                result = a;
                shortest = b;
            } else {
                result = b;
                shortest = a;
            }
            if (a instanceof Array) {
                for (i = 0; i < b.length; i += 1) {
                    len = a.push({
                        $types: Object.create(b[i].$types),
                        $values: {}
                    }) - 1;
                    for (type in b[i].$values) {
                        a[len].$values[type] = f(b[i].$values[type]());
                    }
                }
                result = a;
            } else {
                for (i in shortest) {
                    if (i !== "length" && shortest.hasOwnProperty(i)) {
                        result[i] = shortest[i];
                        result.length += 1;
                    }
                }
            }
            return result;
        };

    if (compatible(a, b).$values["Boolean"]() ||
        compatible(b, a).$values["Boolean"]()
    ) {
        if (compatible(a, concatTestBoth).$values["Boolean"]()) {
            return $primitive(["Text", "Array"], {
                "Text": concatFunc(txtConcat(a, b)),
                "Array": concatFunc(arrConcat(a, b))
            });
        }
        if (compatible(compatTestText, a).$values["Boolean"]()) {
            return $primitive("Text",
                concatFunc(txtConcat(a, b))
            );
        } else if (compatible(compatTestArray, a).$values["Boolean"]()) {
            return $primitive("Array",
                concatFunc(arrConcat(a, b))
            );
        }
    }
    $runtimeError(line,
        "Type Error:  Compatible Text, Array or Both expected, got: %what%",
        a.$types + " and " + b.types
    );
};
var print = {
    $types: ["Scope"],
    $values: {
        "Scope": function() {
            return function print(val) {
                console.log(Text.$values["Scope"]()(val).$values["Text"]());
            }
        }
    }
};
var $$$0 = $primitive('Text', function() {
    return "hi"
}.bind($root));
var $$$1 = $primitive('Number', function() {
    return 2
}.bind($root));
var $$$2 = function() {
    return (this.$self("stringTimes", 14).$values["Scope"]()($$$0, $$$1))
}.bind($root);
var $$$3 = function() {
    return (print.$values["Scope"]()($$$2()))
}.bind($root);
var $$$4 = $primitive('Text', function() {
    return "hi"
}.bind($root));
var $$$5 = $primitive('Number', function() {
    return 3
}.bind($root));
var $$$6 = function() {
    return (this.$self("stringTimes", 15).$values["Scope"]()($$$4, $$$5))
}.bind($root);
var $$$7 = function() {
    return (print.$values["Scope"]()($$$6()))
}.bind($root);
var $$$8 = $primitive('Text', function() {
    return "hi"
}.bind($root));
var $$$9 = $primitive('Number', function() {
    return 1
}.bind($root));
var $$$10 = function() {
    return (this.$self("stringTimes", 16).$values["Scope"]()($$$8, $$$9))
}.bind($root);
var $$$11 = function() {
    return (print.$values["Scope"]()($$$10()))
}.bind($root);; /* Begin ControlCode: 0 */
$root.$self("var", "stringTimes", /* Starting Scope:1 */ $primitive("Scope", function() {
    return function() {
        var $returnMulti = [],
            $temp, $val;
        var $$$0 = $primitive('Text', function() {
            return ""
        }.bind(this));
        var $$$1 = function() {
            return (len.$values["Scope"]()(this.$self("str", 8)))
        }.bind(this);
        var $$$2 = function() {
            return (len.$values["Scope"]()(this.$self("result", 8)))
        }.bind(this);
        var $$$3 = $primitive('Text', function() {
            return ""
        }.bind(this));
        var $$$4 = $primitive('Number', function() {
            return 0
        }.bind(this));
        this.$arg("str", "$$$3", arguments[0]);
        this.$arg("n", "$$$4", arguments[1]);
        /* Begin ControlCode: 1 */
        this.$self("var", "result", $$$0);
        (function() {
            while ($primitive("Boolean", function(val) {
                return function() {
                    return val;
                }
            }($Math.multiply($$$1(), this.$self("n", 8)).$values["Number"]() > $$$2().$values["Number"]())).$values["Boolean"]()) {
                (function() {
                    return (function(val) {
                        this.$self("result", 9).$types = Object.create(val.$types);
                        this.$self("result", 9).$values = Object.create(val.$values);
                        return this.$self("result", 9);
                    }.call(this, $concat(this.$self("result", 9), this.$self("str", 9), 9)));;

                }.bind(this)());
            }
        }.bind(this)());
        if (typeof $returnMulti === "undefined") {
            var $returnMulti = [];
        }
        $returnMulti.push(this.$self("result", 11));
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
        return $return;;
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
}.bind($newParent($root))));
$$$3();
$$$7();
$$$11();