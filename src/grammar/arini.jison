%{
	//const fs = require('fs');
	const path = require('path');
	//const arini_dir = path.dirname(path.dirname(process.argv[1]));
%}

%left BECOMES XML_ATTR_BECOMES PLUS_BECOMES MINUS_BECOMES
%left AND OR
%left EQ INEQ SIZECMP
%left IN HAS FROM
%left TO
%left BY
%left MINUS PLUS
%left TIMES DIVIDE MODULUS
%left POWER
%right '.' PROPERTY JSPROPERTY
%right NAME

%right UMINUS INCREMENT DECREMENT RANDOM SPREAD ASYNC AWAIT NOT INCLUDE
%right BT_EXPR_OPEN BT_EXPR_CLOSE '{' '}' '){' '(){'
%right '[' ']'
%right '(' ')' 
%right ','
%right ';'


%start program

%%
arrayStart
	: '['
		{yy.array.begin();}
	;

array
	: arrayStart arrayItems ']'
		{
			$$ = (function () {
				let result = yy.array.active.toScope();
				yy.array.end();
				return `scope.array(${result})`;
			}());
		}
	| arrayStart ']'
		{
			yy.array.end();
			$$ = `scope.array()`;
		}
	;

arrayItem
	: NAME BECOMES expr
		{
			yy.array.active.push(`"${$NAME}"`, $expr);
		}
	| string BECOMES expr
		{
			yy.array.active.push($string, $expr);
		}
	| "(" expr[a] ")" BECOMES expr[b]
		{
			yy.array.active.push($a, $b);
		}
	| scopeDecl
		{
			yy.array.active.push(`"${$scopeDecl.name}"`, $scopeDecl.expr);
		}
	| expr
		{
			yy.array.active.push($expr);
		}
	| SPREAD expr
		{
			yy.array.active.pushSpread($expr);
		}
	;

arrayItems
	: arrayItem
	| arrayItems ',' arrayItem
	;

attribute
	: property BECOMES expr
		{
			$$ = [$property, $expr];
		}
	| property
		{
			$$ = [$property, undefined];
		}
	;

attributeList
	: /* empty */
		{$$ = "";}
	| attributeList attribute
		{
			if ($attributeList !== "") {
				$attributeList += ",";
			}
			$$ = (function () {
				if ($attribute[1] === undefined) {
					return `${$attributeList}${$attribute[0]}`;
				}
				return `${$attributeList}"${$attribute[0]}":${$attribute[1]}`;
			}());
		}
	| attributeList SPREAD expr
		{
			if ($attributeList !== "") {
				$attributeList += ",";
			}
			$$ = `${$attributeList}...scope.asObj(${$expr})`;
		}
	;

binarySizeCmp
	: expr[a] SIZECMP expr[b]
		{$$ = `scope.sizeCmp(${$a}, ${$b}, "${$SIZECMP}")`;}
	;

binaryExpr
	: binarySizeCmp
		{$$ = $binarySizeCmp;}
	| expr[a] EQ expr[b]
		{$$ = `Object.is(${$a},${$b})`;}
	| expr[a] INEQ expr[b]
		{$$ = `!Object.is(${$a},${$b})`;}
	| expr[a] PLUS expr[b]
		{$$ = `(${$a}+${$b})`;}
	| expr[a] MINUS expr[b]
		{$$ = `(${$a}-${$b})`;}
	| expr[a] TIMES expr[b]
		{$$ = `(${$a}*${$b})`;}
	| expr[a] DIVIDE expr[b]
		{$$ = `(${$a}/${$b})`;}
	| expr[a] MODULUS expr[b]
		{$$ = `(${$a}%${$b})`;}
	| expr[a] POWER expr[b]
		{$$ = `(${$a}^${$b})`;}
	| expr[a] AND expr[b]
		{$$ = `(${$a}&&${$b})`;}
	| expr[a] OR expr[b]
		{$$ = `(${$a}||${$b})`;}
	| expr[a] IN expr[b]
		{$$ = `scope.in(${$a}, ${$b})`;}
	| expr[a] HAS expr[b]
		{$$ = `scope.has(${$a}, ${$b})`;}

	| property BECOMES expr
		{$$ = `scope.set(this._scoping,"${$property}",${$expr})`;}
	| id BECOMES expr
		{$$ = `scope.set(${$id.parent},${$id.prop},${$expr})`;}
	| property PLUS_BECOMES expr
		{$$ = `scope.set(this._scoping,"${$property}",(scope.id["${$property}"]+${$expr}))`;}
	| id PLUS_BECOMES expr
		{$$ = `scope.set(${$id.parent},${$id.prop},${$id.parent}[${$id.prop}]+${$expr})`;}
	| property MINUS_BECOMES expr
		{$$ = `scope.set(this._scoping,"${$property}",(scope.id["${$property}"]-${$expr}))`;}
	| id MINUS_BECOMES expr
		{$$ = `scope.set(${$id.parent},${$id.prop},${$id.parent}[${$id.prop}]-${$expr})`;}

	| expr[a] '[' ']' BECOMES expr[b]
		{$$ = `${$a}.push(${$b})`;}
	| expr[a] TO expr[b] BY expr[c]
		{$$ = `scope.range(${$a},${$b},${$c})`;}
	| expr[a] TO expr[b]
		{$$ = `scope.range(${$a},${$b})`;}
	| unpackExpr FROM expr
		{$$ = `scope.unpack(${$expr}).using(${$unpackExpr})`;}
	| expr[a] FROM expr[b]
		{$$ = `scope.unpack(${$b}).using(${$a})`;}
	;

cast
	: property ':'
		%{
			$$ = (function () {
				let t = $property;
				let types = [
					["number", "Number"] ,
					["bool(ean)?", "Boolean"],
					["string", "String"],
					["regex", "XRegExp"],
					["array", "Array"]
				];

				for (let [search, replace] of types) {
					let r = new RegExp("^(?:" + search + ")$", "i");
					if (r.test(t)) {
						t = replace;
						break;
					}
				}
				return `scope.id.${t}`;
			}());
		%}
	;

codeBlock
	: decStatements controlCode
	;

controlCode
	: /* empty */
		{$$ = "";}
	| controlCode expr ';'
		{yy.scope.pushStmt($expr);}
	| controlCode stmt
		{yy.scope.pushStmt($stmt);}
	;

decStatements
	: /* empty */
	| decStatements declaration ';'
		{yy.scope.pushStmt($declaration);}
	;

declaration
	: LET decProperty
		{$$ = `scope.declare("let", ${$decProperty})`;}
	| PRIVATE decProperty
		{$$ = `scope.declare("private", ${$decProperty})`;}
	| PROTECTED decProperty
		{$$ = `scope.declare("protected", ${$decProperty})`;}
	| PUBLIC decProperty
		{$$ = `scope.declare("public", ${$decProperty})`;}
	| USE property
		{$$ = `scope.use(scope.id["${$property}"])`;}
	;

decProperty
	: property BECOMES expr
		{$$ = `["${$property}",${$expr}]`;}
	| '[' decPropertyList ']' BECOMES expr
		{$$ = `[[${$decPropertyList}],${$expr}]`;}
	| property
		{$$ = `["${$property}",]`;}
	| scopeDecl
		{$$ = `["${$scopeDecl.name}", ${$scopeDecl.expr}]`;}
	| cast property BECOMES expr
		{$$ = `["${$property}",${$expr},${$cast}]`;}
	| decProperty ',' decProperty
		{$$ = `${$1},${$3}`;}
	;

decPropertyList
	: decPropertyListAtom
		{$$ = $decPropertyListAtom;}
	| decPropertyList ',' decPropertyListAtom
		{$$ = `${$decPropertyList},${$decPropertyListAtom}`;}
	;

decPropertyListAtom
	: property
		{$$ = `"${$property}"`;}
	| "[" decPropertyList "]"
		{$$ = `[${$decPropertyList}]`;}
	;

expr
	: literal
		{$$ = $literal;}
	| id
		{$$ = $id.value;}
	| property
		{$$ = `scope.id["${$property}"]`;}
	| invokeExpr
		{$$ = $invokeExpr;}
	| binaryExpr
		{$$ = $binaryExpr;}
	| '(' expr ')'
		{$$ = '(' + $expr + ')';}
	| unaryExpr
		{$$ = $unaryExpr;}
	;

id
	: expr '.' PROPERTY
		{$$ = {parent: $expr, prop: `"${$PROPERTY}"`, value:`${$expr}["${$PROPERTY}"]`};}
	| expr '.' JSPROPERTY
		{$$ = {parent: $expr, prop: `"${$JSPROPERTY}"`, value:`${$expr}.${$JSPROPERTY}`};}
	| expr '.' RANDOM
		{$$ = {parent: $expr, prop: `"${$RANDOM}"`, value:`${$expr}.${$RANDOM}`};}
	| expr '[' expr ']'
		{$$ = {parent: $expr1, prop: $expr2, value:`${$expr1}[${$expr2}]`};}
	;

ifStmt
	: ifStmtLineStart expr ifStmtElseIfChain ifStmtEnd
		%{
			$$ = (function () {
				let result = $ifStmtLineStart;
				result += `{
					let expr = ${$expr};
					if (typeof expr === "function") {
						let result = expr();
						if (expr._hasReturn) {
							return result;
						}
					}
				}`;
				return result + $ifStmtElseIfChain + $ifStmtEnd;
			}());
		%}
	;

ifStmtElse
	: ELSE expr
		%{
			$$ = (function () {
				let result = `else`;
				result += `{
					let expr = ${$expr};
					if (typeof expr === "function") {
						let result = expr();
						if (expr._hasReturn) {
							return result;
						}
					}
				}`;
				return result;
			}());
		%}
	;

ifStmtElseIf
	: ELSE ifStmtLineStart expr
		%{
			$$ = (function () {
				let result = `else ${$ifStmtLineStart}`;
				result += `{
					let expr = ${$expr};
					if (typeof expr === "function") {
						let result = expr();
						if (expr._hasReturn) {
							return result;
						}
					}
				}`;
				return result;
			}());
		%}
	;

ifStmtElseIfChain
	: /* empty */
		{$$ = '';}
	| ifStmtElseIfChain ifStmtElseIf
		{$$ = $ifStmtElseIfChain + $ifStmtElseIf;}
	;

ifStmtEnd
	: ';'
		{$$ = '';}
	| ifStmtElse ';'
		{$$ = $ifStmtElse;}
	;

ifStmtLineStart
	: 'IF(' expr ')'
		{$$ = `if(scope.toBoolean(${$expr}))`;}
	;

invokeArgs
	: expr
		{$$ = $expr;}
	| SPREAD expr
		{$$ = "..." + $expr;}
	| invokeArgs ',' expr
		{$$ = $invokeArgs + "," + $expr;}
	;

invokeExpr
	: expr '(' ')'
		{$$ = `(${$expr}())`;}
	| expr '(' invokeArgs ')'
		{$$ = `(${$expr}(${$invokeArgs}))`;}
	;

literal
	: array
		{$$ = $array;}
	| BOOL
		{$$ = $BOOL.toLowerCase();}
	| NUMBER
		{$$ = $NUMBER;}
	| regex
		{$$ = $regex;}
	| scope
		{$$ = $scope;}
	| string
		{$$ = $string;}
	| tag
		{$$ = $tag;}
	| UNDEFINED
		{$$ = undefined;}
	;

program
	: codeBlock EOF
		{return yy.scope.expressions;}
	;

property
	: PROPERTY
		{$$ = $PROPERTY;}
	| JSPROPERTY
		{$$ = $JSPROPERTY;}
	;

randExpr
	: RANDOM
		{$$ = 'scope.random()';}
	| RANDOM expr
		{$$ = `scope.random(${$expr})`;}
	;

regex
	: REGEX_START regexBody REGEX_END
		%{
			$$ = (function () {
				let modifiers = yy.regex.modifiers;
				if (modifiers.length > 0) {
					return `XRegExp("${$regexBody}", "${modifiers}")`;
				}
				return `XRegExp("${$regexBody}")`;
			}());
		%}
	;

regexBody
	: /* empty */
		{$$ = "";}
	| regexBody REGEX_BODY
		%{
			$$ = $regexBody + $REGEX_BODY.replace(/\"/g, '\\"').replace(/\n/g,'\\n');
		%}
	;

returnStmt
	: RETURN expr ';'
		{
			yy.scope.hasReturn = true;
			$$ = `return ${$expr};`;
		}
	;

scopeArgumentSpread
	: SPREAD property
		{$$ = $property;}
	;

scope
	: scopeStart codeBlock '}'
		%{
			$$ = $scopeStart + 
				'this._hasReturn=true;' + 
				'this._scoping=scope._scoping;' +
				yy.scope.toJS() + 
				';this._hasReturn=false},' + 
				yy.scope.hasReturn + 
			')';
			yy.scope.end();
		%}
	| scopeAsyncFlag scopeStart codeBlock '}'
		%{
			$$ =$scopeStart + 
				'this._hasReturn=true;' + 
				'this._scoping=scope._scoping;' +
				yy.scope.toJS() + 
				';this._hasReturn=false},' + 
				yy.scope.hasReturn + 
			')';
			yy.scope.end();
		%}
	;

scopeAsyncFlag
	: ASYNC
		{yy.scope.setAsync();}
	;

scopeDecl
	: scopeDeclStart codeBlock '}'
		%{
			$$ = {
				name: $scopeDeclStart.name,
				expr: 
					$scopeDeclStart.expr + 
					'this._hasReturn=true;' + 
					'this._scoping=scope._scoping;' +
					yy.scope.toJS() + 
					';this._hasReturn=false},' + 
					yy.scope.hasReturn + 
				')'
			};
			yy.scope.end();
		%}
	| scopeAsyncFlag scopeDeclStart codeBlock '}'
		%{
			$$ = {
				name: $scopeDeclStart.name,
				expr: $scopeDeclStart.expr + 
					'this._hasReturn=true;' + 
					'this._scoping=scope._scoping;' +
					yy.scope.toJS() + 
					';this._hasReturn=false},' + 
					yy.scope.hasReturn + 
				')'
			};
			yy.scope.end();
		%}
	;

scopeDeclStart
	: PROPERTY '(' scopeArguments '){'
		%{
			yy.scope.endParen(true);
			$$ = (function () {
				let args = yy.scope.argsDecl;
				let async = yy.scope.asyncFlag;
				yy.scope.begin();
				return {
					name: $PROPERTY,
					expr: `scope.createScope(${async}function(...args){${args}`
				};
			}());
		%}
	| JSPROPERTY '(' scopeArguments '){'
		%{
			yy.scope.endParen(true);
			$$ = (function () {
				let args = yy.scope.argsDecl;
				let async = yy.scope.asyncFlag;
				yy.scope.begin();
				return {
					name: $JSPROPERTY,
					expr: `scope.createScope(${async}function ${$JSPROPERTY}(...args){${args}`
				};
			}());
		%}
	| PROPERTY '(' scopeArguments ',' scopeArgumentSpread '){'
		%{
			yy.scope.endParen(true);
			$$ = (function () {
				let args = yy.scope.argsDecl;
				let async = yy.scope.asyncFlag;
				let argsLength = yy.scope.argsLength;
				let spreadProp = $scopeArgumentSpread;
				let spread = `scope.declare("let", ["${spreadProp}",args.slice(${argsLength})]);`;
				yy.scope.begin();
				return {
					name: $PROPERTY,
					expr: `scope.createScope(${async}function(...args){${args}${spread}`
				};
			}());
		%}
	| JSPROPERTY '(' scopeArguments ',' scopeArgumentSpread '){'
		%{
			yy.scope.endParen(true);
			$$ = (function () {
				let args = yy.scope.argsDecl;
				let async = yy.scope.asyncFlag;
				let argsLength = yy.scope.argsLength;
				let spreadProp = $scopeArgumentSpread;
				let spread = `scope.declare("let", ["${spreadProp}",args.slice(${argsLength})]);`;
				yy.scope.begin();
				return {
					name: $JSPROPERTY,
					expr: `scope.createScope(${async}function ${$JSPROPERTY}(...args){${args}${spread}`
				};
			}());
		%}
	| PROPERTY '(' scopeArgumentSpread '){'
		%{
			yy.scope.endParen(true);
			$$ = (function () {
				let spreadProp = $scopeArgumentSpread;
				let spread = `scope.declare("let", ["${spreadProp}",args]);`;
				let async = yy.scope.asyncFlag;
				yy.scope.begin();
				return {
					name: $PROPERTY,
					expr: `scope.createScope(${async}function(...args){${spread}`
				};
			}());
		%}
	| JSPROPERTY '(' scopeArgumentSpread '){'
		%{
			yy.scope.endParen(true);
			$$ = (function () {
				let spreadProp = $scopeArgumentSpread;
				let spread = `scope.declare("let", ["${spreadProp}",args]);`;
				let async = yy.scope.asyncFlag;
				yy.scope.begin();
				return {
					name: $JSPROPERTY,
					expr: `scope.createScope(${async}function ${$JSPROPERTY}(...args){${spread}`
				};
			}());
		%}
	| property '(){'
		%{
			$$ = (function () {
				let async = yy.scope.asyncFlag;
				yy.scope.begin();
				let fnName = $property
				if (/\-/.test($property)) {
					fnName = "";
				}
				return {
					name: $property,
					expr: `scope.createScope(${async}function ${fnName}(){`
				};
			}());
			
		%}
	| property '{'
		%{
			$$ = (function () {
				let async = yy.scope.asyncFlag;
				yy.scope.begin();
				let fnName = $property
				if (/\-/.test($property)) {
					fnName = "";
				}
				return {
					name: $property,
					expr: `scope.createScope(${async}function ${fnName}(){`
				};
			}());
			
		%}
	;

scopeStart
	: FUNCTION '(' scopeArguments '){'
		%{
			yy.scope.endParen(true);
			$$ = (function () {
				let args = yy.scope.argsDecl;
				let async = yy.scope.asyncFlag;
				yy.scope.begin();
				return `scope.createScope(${async}function(...args){${args}`;
			}());
		%}
	| FUNCTION '(' scopeArguments ',' scopeArgumentSpread '){'
		%{
			yy.scope.endParen(true);
			$$ = (function () {
				let args = yy.scope.argsDecl;
				let async = yy.scope.asyncFlag;
				let argsLength = yy.scope.argsLength;
				let spreadProp = $scopeArgumentSpread;
				let spread = `scope.declare("let", ["${spreadProp}",args.slice(${argsLength})]);`;
				yy.scope.begin();
				return `scope.createScope(${async}function(...args){${args}${spread}`;
			}());
		%}
	| FUNCTION '(' scopeArgumentSpread '){'
		%{
			yy.scope.endParen(true);
			$$ = (function () {
				let spreadProp = $scopeArgumentSpread;
				let spread = `scope.declare("let", ["${spreadProp}",args]);`;
				let async = yy.scope.asyncFlag;
				yy.scope.begin();
				return `scope.createScope(${async}function(...args){${spread}`;
			}());
		%}
	| FUNCTION '(){'
		%{
			$$ = (function () {
				let async = yy.scope.asyncFlag;
				yy.scope.begin();
				return `scope.createScope(${async}function(){`;
			}());
		%}
	| FUNCTION '{'
		%{
			$$ = (function () {
				let async = yy.scope.asyncFlag;
				yy.scope.begin();
				return `scope.createScope(${async}function(){`;
			}());
		%}
	| '{'
		%{
			$$ = (function () {
				let async = yy.scope.asyncFlag;
				yy.scope.begin();
				return `scope.createScope(${async}function(){`;
			}());
		%}
	;

scopeArguments
	: property BECOMES expr
		{
			$$ = yy.scope.pushArg(`"${$property}"`, $expr);
		}
	| property
		{
			$$ = yy.scope.pushArg(`"${$property}"`);
		}
	| '[' scopeArgumentsList ']' BECOMES expr
		{
			$$ = yy.scope.pushArg(`[${$scopeArgumentsList}]`, $expr);
		}
	| '[' scopeArgumentsList ']'
		{
			$$ = yy.scope.pushArg(`[${$scopeArgumentsList}]`);
		}
	| scopeArguments[a] ',' scopeArguments[b]
		{$$ = yy.scope.args;}
	;

scopeArgumentsList
	: scopeArgumentsListAtom
		{$$ = $scopeArgumentsListAtom}
	| scopeArgumentsList ',' scopeArgumentsListAtom
		{$$ = $scopeArgumentsList + ',' + $scopeArgumentsListAtom}
	;

scopeArgumentsListAtom
	: property
		{$$ = `"${$property}"`;}
	| '[' scopeArgumentsList ']'
		{$$ = '[' + $scopeArgumentsList + ']';}
	;

stmt
	: returnStmt
		{$$ = $returnStmt;}
	| ifStmt
		{$$ = $ifStmt;}
	;

string
	: BT_OPEN stringBody BT_CLOSE
		{ $$ = '`' + $stringBody + '`'; }
	| QSTRING
		{$$ = $QSTRING.replace(/\n/g, '\\n');}
	| ASTRING
		{$$ = $ASTRING.replace(/\n/g, '\\n');}
	;

stringBody
	: /* empty */
		{$$ = "";}
	| stringBody BT_TEXT
		%{
			$$ = yy.setStr($stringBody, $BT_TEXT);
		%}
	| stringBody BT_EXPR_OPEN expr BT_EXPR_CLOSE
		%{
			$$ = yy.setStr($stringBody, '${' + $expr + '}');
		%}
	;

tag
	: tagShort
		{$$ = $tagShort;}
	| tagBlock
		{$$ = $tagBlock;}
	;

tagBlock
	: tagBlockStart controlCode tagBlockEnd
		{
			$$ = (function () {
				let tag = $tagBlockStart;

				if (tag.tagName !== $tagBlockEnd) {
					yy.parseError(`Tag mismatch: `, {
						text: `</${$tagBlockEnd}>`,
						token: yytext,
						line: yylineno,
						solution: `Change ${$tagBlockEnd} to ${tag.tagName}, or the other way around.`,
						recoverable: true
					});
				}

				return tag.toJS();
			}());
			yy.scope.end();
		}
	;

tagBlockEnd
	: "<" XML_BLOCK_END XML_CLOSE_ID XML_BLOCK_CLOSE
		{
			$$ = $XML_CLOSE_ID;
		}
	;

tagBlockStart
	: "<" XML_OPEN_ID attributeList XML_BLOCK_START
		{
			$$ = (function () {
				let parent = yy.scope;
				yy.scope.begin();
				return new yy.xml.Tag($XML_OPEN_ID, $attributeList);
			}());
		}
	;

tagShort
	: "<" XML_OPEN_ID attributeList XML_SHORT_CLOSE
		{$$ = (new yy.xml.Tag($XML_OPEN_ID, $attributeList, true)).toJS();}
	;

unaryExpr
	: MINUS expr %prec UMINUS
		{$$ = '-' + $expr}
	| INCREMENT expr
		{$$ = '++' + $expr;}
	| DECREMENT expr
		{$$ = '--' + $expr;}
	| AWAIT expr
		{$$ = `(await (async ()=>{let r = await ${$expr};scope._scoping = this._scoping;return r;})())`;}
	| INCLUDE string
		{
			yy.lexer._more = true;
			$$ = (function () {
				let f = path.join(yy.script_dir,$string.substr(1,$string.length-2));
				let r = yy.parser.include(f);
				return r;
			}());
		}
	| NOT expr
		{$$ = '!' + $expr;}
	;

unpackExpr
	: randExpr
		{$$ = $randExpr;}
	;
