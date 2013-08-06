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
            parent = parent.$parent;
        }
        throw "Undefined variable/property: " + name;
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
                equals(a.$values[a.$types[i]](), b.$values[a.$types[i]]())) {
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
var $runtimeError = function $runtimeError(line, msg, what) {
    throw new Error(
        "\033[31m\033[1m Runtime Error:\033[0m\033[1m " +
        msg.replace(/%what%/g, what).replace(/%red%/g, '\033[31m').replace(/%default%/g, '\033[0m\033[1m').replace(/%green%/g, '\033[32m') +
        "\033[1m on line: \033[31m" + line + '\033[0m');
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
var Console = (function Console() {
    var rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.pause();

    function callback(fn) {
        return function cb(data) {
            rl.pause();
            fn(data.replace(/\n/g, ""));
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
                        result[key].push(printValues(val[i]));
                    }
                }
                continue;
            }
            result[key] = val;
        }
        return result;
    }

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
            value: function() {
                return function read(fn) {
                    rl.resume();
                    rl.on('line', callback(fn));
                }
            }
        }
    };
}());
var $Math = {
    add: function add(a, b) {
        return $primitive("Number", function(val) {
            return function() {
                return val;
            }
        }(a.$values["Number"]() + b.$values["Number"]()));
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
var $$$0 = $primitive('Scope', function() {
    return /* Starting Scope:1 */ function() {
        var $returnMulti = [],
            $temp;
        $$$0 = $primitive('Text', function() {
            return 'Five'
        }.bind(this));
        $$$1 = $primitive('Number', function() {
            return 5
        }.bind(this));
        /* Begin ControlCode: 1 */
        $temp = {
            $types: ["Text"],
            $values: {}
        };
        for ($i = 0; $i < $temp.$types.length; $i += 1) {
            $temp.$values[$temp.$types[$i]] = $$$0.$values[$temp.$types[$i]];
        }
        $returnMulti.push($temp);;
        $temp = {
            $types: ["Number"],
            $values: {}
        };
        for ($i = 0; $i < $temp.$types.length; $i += 1) {
            $temp.$values[$temp.$types[$i]] = $$$1.$values[$temp.$types[$i]];
        }
        $returnMulti.push($temp);;
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
    }.bind($newParent($root))
}.bind($root));
var $$$1 = $primitive('Text', function() {
    return '5'
}.bind($root));
var $$$2 = $primitive('Number', function() {
    return 5
}.bind($root));
var $$$3 = $primitive('Text', function() {
    return "A.) Good"
}.bind($root));
var $$$4 = function() {
    return (Console.write.$values["Scope"]()($$$3))
}.bind($root);
var $$$5 = $primitive('Text', function() {
    return "A.) Bad"
}.bind($root));
var $$$6 = function() {
    return (Console.write.$values["Scope"]()($$$5))
}.bind($root);
var $$$7 = function() {
    return (function() {
        if ($primitive("Boolean", function(val) {
            return function() {
                return val;
            }
        }(!$compare($$$1, $$$2).$values["Boolean"]())).$values["Boolean"]()) {
            return (function() {
                return $$$4();
            }.bind(this)());
        } else {
            return (function() {
                return $$$6();
            }.bind(this)());
        }
    }.bind(this)())
}.bind($root);
var $$$8 = $primitive('Scope', function() {
    return /* Starting Scope:1 */ function() {
        var $returnMulti = [],
            $temp;
        $$$0 = $primitive('Text', function() {
            return "Five"
        }.bind(this));
        $$$1 = $primitive('Number', function() {
            return 5
        }.bind(this));
        /* Begin ControlCode: 1 */
        $temp = {
            $types: ["Text"],
            $values: {}
        };
        for ($i = 0; $i < $temp.$types.length; $i += 1) {
            $temp.$values[$temp.$types[$i]] = $$$0.$values[$temp.$types[$i]];
        }
        $returnMulti.push($temp);;
        $returnMulti.push($$$1);
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
    }.bind($newParent($root))
}.bind($root));
var $$$9 = $primitive('Scope', function() {
    return /* Starting Scope:1 */ function() {
        var $returnMulti = [],
            $temp;
        $$$0 = $primitive('Text', function() {
            return "Four"
        }.bind(this));
        $$$1 = $primitive('Number', function() {
            return 4
        }.bind(this));
        /* Begin ControlCode: 1 */
        $temp = {
            $types: ["Text"],
            $values: {}
        };
        for ($i = 0; $i < $temp.$types.length; $i += 1) {
            $temp.$values[$temp.$types[$i]] = $$$0.$values[$temp.$types[$i]];
        }
        $returnMulti.push($temp);;
        $returnMulti.push($$$1);
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
    }.bind($newParent($root))
}.bind($root));
var $$$10 = function() {
    return (this.$self("Four").$values["Scope"]()())
}.bind($root);
var $$$11 = function() {
    return (this.$self("Five").$values["Scope"]()())
}.bind($root);
var $$$12 = $primitive('Text', function() {
    return "B.) Bad"
}.bind($root));
var $$$13 = function() {
    return (Console.write.$values["Scope"]()($$$12))
}.bind($root);
var $$$14 = $primitive('Text', function() {
    return "B.) Good"
}.bind($root));
var $$$15 = function() {
    return (Console.write.$values["Scope"]()($$$14))
}.bind($root);
var $$$16 = function() {
    return (function() {
        if ($compare($$$10(), $$$11()).$values["Boolean"]()) {
            return (function() {
                return $$$13();
            }.bind(this)());
        } else {
            return (function() {
                return $$$15();
            }.bind(this)());
        }
    }.bind(this)())
}.bind($root);
var $$$17 = $primitive('Number', function() {
    return 4
}.bind($root));
var $$$18 = function() {
    return (this.$self("Four").$values["Scope"]()())
}.bind($root);
var $$$19 = $primitive('Text', function() {
    return "C.) Good"
}.bind($root));
var $$$20 = function() {
    return (Console.write.$values["Scope"]()($$$19))
}.bind($root);
var $$$21 = $primitive('Text', function() {
    return "C.) Bad"
}.bind($root));
var $$$22 = function() {
    return (Console.write.$values["Scope"]()($$$21))
}.bind($root);
var $$$23 = function() {
    return (function() {
        if ($compare($$$17, $$$18()).$values["Boolean"]()) {
            return (function() {
                return $$$20();
            }.bind(this)());
        } else {
            return (function() {
                return $$$22();
            }.bind(this)());
        }
    }.bind(this)())
}.bind($root);
var $$$24 = function() {
    return (this.$self("Four").$values["Scope"]()())
}.bind($root);
var $$$25 = function() {
    return (Type.$values["Scope"]()($$$24()))
}.bind($root);
var $$$26 = $primitive('Text', function() {
    return "Number"
}.bind($root));
var $$$27 = $primitive('Text', function() {
    return "D.) Good"
}.bind($root));
var $$$28 = function() {
    return (Console.write.$values["Scope"]()($$$27))
}.bind($root);
var $$$29 = $primitive('Text', function() {
    return "D.) Bad"
}.bind($root));
var $$$30 = function() {
    return (Console.write.$values["Scope"]()($$$29))
}.bind($root);
var $$$31 = function() {
    return (function() {
        if ($$$25().$values["Array"]().has($$$26).$values["Boolean"]()) {
            return (function() {
                return $$$28();
            }.bind(this)());
        } else {
            return (function() {
                return $$$30();
            }.bind(this)());
        }
    }.bind(this)())
}.bind($root);
var $$$32 = $primitive('Number', function() {
    return 3
}.bind($root));
var $$$33 = function() {
    return (this.$self("Four").$values["Scope"]()())
}.bind($root);
var $$$34 = $primitive('Number', function() {
    return 7
}.bind($root));
var $$$35 = $primitive('Text', function() {
    return "E.) Good"
}.bind($root));
var $$$36 = function() {
    return (Console.write.$values["Scope"]()($$$35))
}.bind($root);
var $$$37 = $primitive('Text', function() {
    return "E.) Bad"
}.bind($root));
var $$$38 = function() {
    return (Console.write.$values["Scope"]()($$$37))
}.bind($root);
var $$$39 = function() {
    return (function() {
        if ($compare($Math.add($$$32, $$$33()), $$$34).$values["Boolean"]()) {
            return (function() {
                return $$$36();
            }.bind(this)());
        } else {
            return (function() {
                return $$$38();
            }.bind(this)());
        }
    }.bind(this)())
}.bind($root);
var $$$40 = function() {
    return (this.$self("Four").$values["Scope"]()())
}.bind($root);
var $$$41 = function() {
    return (Type.$values["Scope"]()($$$40()))
}.bind($root);
var $$$42 = function() {
    return (this.$self("Five").$values["Scope"]()())
}.bind($root);
var $$$43 = function() {
    return (Type.$values["Scope"]()($$$42()))
}.bind($root);
var $$$44 = $primitive('Text', function() {
    return "F.) Good"
}.bind($root));
var $$$45 = function() {
    return (Console.write.$values["Scope"]()($$$44))
}.bind($root);
var $$$46 = $primitive('Text', function() {
    return "F.) Bad"
}.bind($root));
var $$$47 = function() {
    return (Console.write.$values["Scope"]()($$$46))
}.bind($root);
var $$$48 = function() {
    return (function() {
        if ($compare($$$41(), $$$43()).$values["Boolean"]()) {
            return (function() {
                return $$$45();
            }.bind(this)());
        } else {
            return (function() {
                return $$$47();
            }.bind(this)());
        }
    }.bind(this)())
}.bind($root);
var $$$49 = function() {
    return (this.$self("Five").$values["Scope"]()())
}.bind($root);
var $$$50 = $primitive('Number', function() {
    return 123
}.bind($root));
var $$$51 = function() {
    return (Compatible.$values["Scope"]()($$$49(), $$$50))
}.bind($root);
var $$$52 = $primitive('Text', function() {
    return "G.) Good"
}.bind($root));
var $$$53 = function() {
    return (Console.write.$values["Scope"]()($$$52))
}.bind($root);
var $$$54 = $primitive('Text', function() {
    return "G.) Bad"
}.bind($root));
var $$$55 = function() {
    return (Console.write.$values["Scope"]()($$$54))
}.bind($root);
var $$$56 = function() {
    return (function() {
        if ($$$51().$values["Boolean"]()) {
            return (function() {
                return $$$53();
            }.bind(this)());
        } else {
            return (function() {
                return $$$55();
            }.bind(this)());
        }
    }.bind(this)())
}.bind($root);
var $$$57 = $primitive('Number', function() {
    return 123
}.bind($root));
var $$$58 = function() {
    return (this.$self("Four").$values["Scope"]()())
}.bind($root);
var $$$59 = function() {
    return (Compatible.$values["Scope"]()($$$57, $$$58()))
}.bind($root);
var $$$60 = $primitive('Text', function() {
    return "H.) Bad"
}.bind($root));
var $$$61 = function() {
    return (Console.write.$values["Scope"]()($$$60))
}.bind($root);
var $$$62 = $primitive('Text', function() {
    return "H.) Good"
}.bind($root));
var $$$63 = function() {
    return (Console.write.$values["Scope"]()($$$62))
}.bind($root);
var $$$64 = function() {
    return (function() {
        if ($$$59().$values["Boolean"]()) {
            return (function() {
                return $$$61();
            }.bind(this)());
        } else {
            return (function() {
                return $$$63();
            }.bind(this)());
        }
    }.bind(this)())
}.bind($root);; /* Begin ControlCode: 0 */
$root.$self("var", "Five", $$$0);
$$$7();
$root.$self("var", "Five", $$$8);
$root.$self("var", "Four", $$$9);
$$$16();
$$$23();
$$$31();
$$$39();
$$$48();
$$$56();
$$$64();