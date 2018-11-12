#!/usr/bin/env node
"use strict";global.__scopedir=__dirname;require("source-map-support").install();if(typeof global.scope==="undefined"){Object.defineProperty(global,"scope",{value:require("/home/spence/Projects/scope/lib/scopeRuntime.js")});Object.defineProperty(global,"ScopeApi",{value:require("/home/spence/Projects/scope/lib/scopeRuntimeApi.js")(scope)});Object.defineProperty(global,"XRegExp",{value:require("xregexp")});}module.exports=scope.createScope(function(args){scope.declarationExpression({type:"let",name:"repeatedWords",value:XRegExp(`\\b(?<word>[a-z]+)\\s+\\k<word>\\b`,"gi")});scope.declarationExpression({type:"let",name:"result",value:scope.arrayExpression(scope.identifier("repeatedWords")["test"]("The the test data"))});scope.assignmentExpression(["result"],["+=",scope.identifier("XRegExp")["replace"]('The the test data',scope.identifier("repeatedWords"),'${word}')]);scope.declarationExpression({type:"let",name:"url",value:XRegExp(`^
            (?<scheme> [^:/?]+ ) :// # aka protocol
            (?<host>   [^/?]+  )       # domain name or IP
            (?<path>   [^?]*    ) \\??   # optional path
            (?<query>  .*       )       # optional query`,"x")});scope.assignmentExpression(["result"],["+=",scope.identifier("XRegExp")["exec"]('http://google.com/path/to/file?q=1',scope.identifier("url"))]);scope.declarationExpression({type:"let",name:"d",value:XRegExp(`^(?#month)\\d{1,2}/(?#day)\\d{1,2}/(?#year)(\\d{2}){1,2}`,"n")});scope.assignmentExpression(["result"],["+=",scope.identifier("d")["test"]('04/20/2008')]);scope.declarationExpression({type:"let",name:"d2",value:XRegExp(`^
            \\d{1,2}       (?#month)
         / \\d{1,2}       (?#day)
         / (\\d{2}){1,2}  (?#year)`,"nx")});scope.assignmentExpression(["result"],["+=",scope.identifier("d2")["test"]('04/20/2008')]);scope.identifier("XRegExp")["addToken"](XRegExp(`\\\\a`,""),scope.createScope(function(args){return '\\x07';}),scope.mapExpression(["scope",'all']));scope.assignmentExpression(["result"],["+=",scope.identifier("XRegExp")(XRegExp(`\\a[\\a-\\n]+`,""))["test"]('\x07\n\x07')]);scope.identifier("XRegExp")["addToken"](XRegExp(`\\\\Q([\\s\\S]*?)(?:\\\\E|$)`,""),scope.createScope(function(args){scope.declarationExpression({type:"let",name:"match",value:args[0]===undefined?scope.arrayExpression():args[0]});return scope.identifier("XRegExp")["escape"](scope.identifier("match")[1]);}),scope.mapExpression(["scope",'all']));scope.assignmentExpression(["result"],["+=",scope.identifier("XRegExp")(XRegExp(`^\\Q(?*+)`,""))["test"]('(?*+)')]);scope.identifier("XRegExp")["addToken"](XRegExp(`([?*+]|{\\d+(?:,\\d*)?})(\\??)`,""),scope.createScope(function(args){scope.declarationExpression({type:"let",name:"match",value:args[0]===undefined?scope.arrayExpression():args[0]});return scope.binaryExpression("+",scope.identifier("match")[1],ScopeApi['if'](scope.identifier("match")[2],scope.createScope(function(args){return '';}),scope.createScope(function(args){return '?';})));}),scope.mapExpression(["flag",'U']));scope.assignmentExpression(["result"],["+=",scope.identifier("XRegExp")(XRegExp(`a+`,"U"))["exec"]('aaa')[0]]);scope.assignmentExpression(["result"],["+=",scope.identifier("XRegExp")(XRegExp(`a+?`,"U"))["exec"]('aaa')[0]]);scope.identifier("XRegExp")["addToken"](XRegExp(`\\\\R`,""),scope.createScope(function(args){return '(?:\\r\\n|[\\n-\\r\\x85\\u2028\\u2029])';}));scope.identifier("console")["log"](scope.identifier("XRegExp")["build"]);scope.declarationExpression({type:"let",name:"time",value:scope.identifier("XRegExp")["build"]('(?x)^ {{hours}} ({{minutes}}) $',scope.mapExpression(["hours",scope.identifier("XRegExp")["build"]('{{h12}} : | {{h24}}',scope.mapExpression(["h12",XRegExp(`1[0-2]|0?[1-9]`,"")],["h24",XRegExp(`2[0-3]|[01][0-9]`,"")]),'x')],["minutes",XRegExp(`^[0-5][0-9]$`,"")]))});scope.assignmentExpression(["result"],["+=",scope.identifier("time")["test"]('10:59')]);scope.assignmentExpression(["result"],["+=",scope.identifier("XRegExp")["exec"]('10:59',scope.identifier("time"))["minutes"]]);ScopeApi.print(scope.identifier("result"));return scope.identifier("result");})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3NwZW5jZS9Qcm9qZWN0cy9zY29wZS90ZXN0L3Njb3BlU3JjL3hyZWdleC5zYyJdLCJuYW1lcyI6WyJyb290LT5yb290Iiwicm9vdC0+cm9vdC0+cm9vdCIsInJvb3QtPmRlY2xhcmF0aW9uRXhwcmVzc2lvbiIsInJvb3QtPnJlcGVhdGVkV29yZHMiLCJyb290LT5yZWdleExpdGVyYWwiLCJyb290LT5yZXN1bHQiLCJyb290LT5hcnJheVN0YXJ0LT5hcnJheVN0YXJ0Iiwicm9vdC0+YXJyYXlTdGFydC0+aWRlbnRpZmllciIsInJvb3QtPmFycmF5U3RhcnQtPmludm9rZUV4cHJlc3Npb24iLCJyb290LT5hcnJheVN0YXJ0LT5zdHJpbmdMaXRlcmFsIiwicm9vdC0+YXJyYXlFeHByZXNzaW9uIiwicm9vdC0+YXNzaWdubWVudEV4cHJlc3Npb24iLCJyb290LT5pZGVudGlmaWVyIiwicm9vdC0+YXNzaWdubWVudFZhbHVlIiwicm9vdC0+aW52b2tlRXhwcmVzc2lvbiIsInJvb3QtPnN0cmluZ0xpdGVyYWwiLCJyb290LT5leHByZXNzaW9uTGlzdCIsInJvb3QtPnVybCIsInJvb3QtPmQiLCJyb290LT5kMiIsInJvb3QtPnNjb3BlU3RhcnQtPnNjb3BlU3RhcnQiLCJyb290LT5zY29wZVN0YXJ0LT5yZXR1cm5FeHByZXNzaW9uIiwicm9vdC0+c2NvcGVTdGFydC0+c3RyaW5nTGl0ZXJhbCIsInJvb3QtPnNjb3BlRXhwcmVzc2lvbiIsInJvb3QtPm1hcEV4cHJlc3Npb24iLCJyb290LT5hcnJheVN0YXJ0LT5hc3NvY2lhdGl2ZURlY2xhcmF0aW9uIiwicm9vdC0+aW52b2tlSWQiLCJyb290LT5zY29wZVN0YXJ0LT5pZGVudGlmaWVyIiwicm9vdC0+c2NvcGVTdGFydC0+aW52b2tlRXhwcmVzc2lvbiIsInJvb3QtPnNjb3BlU3RhcnQtPmJyYWNrZXRFeHByZXNzaW9uIiwicm9vdC0+c2NvcGVTdGFydC0+bnVtZXJpY0xpdGVyYWwiLCJyb290LT5zY29wZVN0YXJ0LT5iaW5hcnlFeHByZXNzaW9uIiwicm9vdC0+c2NvcGVTdGFydC0+ZXhwcmVzc2lvbkxpc3QiLCJyb290LT5zY29wZVN0YXJ0LT5zY29wZVN0YXJ0LT5zY29wZVN0YXJ0Iiwicm9vdC0+c2NvcGVTdGFydC0+c2NvcGVTdGFydC0+cmV0dXJuRXhwcmVzc2lvbiIsInJvb3QtPnNjb3BlU3RhcnQtPnNjb3BlU3RhcnQtPnN0cmluZ0xpdGVyYWwiLCJyb290LT5zY29wZVN0YXJ0LT5zY29wZUV4cHJlc3Npb24iLCJyb290LT5icmFja2V0RXhwcmVzc2lvbiIsInJvb3QtPm51bWVyaWNMaXRlcmFsIiwicm9vdC0+dGltZSIsInJvb3QtPmFycmF5U3RhcnQtPmV4cHJlc3Npb25MaXN0Iiwicm9vdC0+YXJyYXlTdGFydC0+bWFwRXhwcmVzc2lvbiIsInJvb3QtPmFycmF5U3RhcnQtPmFycmF5U3RhcnQtPmFzc29jaWF0aXZlRGVjbGFyYXRpb24iLCJyb290LT5hcnJheVN0YXJ0LT5hcnJheVN0YXJ0LT5yZWdleExpdGVyYWwiLCJyb290LT5hcnJheVN0YXJ0LT5hcnJheVN0YXJ0LT5hc3NvY2lhdGl2ZUxpc3QiLCJyb290LT5hcnJheVN0YXJ0LT5hc3NvY2lhdGl2ZUxpc3QiLCJyb290LT5hcnJheVN0YXJ0LT5yZWdleExpdGVyYWwiLCJyb290LT5yZXR1cm5FeHByZXNzaW9uIl0sIm1hcHBpbmdzIjoiQUFpRmFBO0FBQUFBLHlhQUFBQyxpQ0EvRXlDQyw2Q0FBbERDLGVBQWtERCxPQUFBRSxrREFBQUYsRUFBQUYsQ0FDRkUsNkNBQWhERyxRQUFnREgsT0FBdENJLHNCQUFhQyx5Q0FBeUJDLENBQUFDLG1CQUFBRCxDQUFBRSxDQUFBUixFQUFBRixDQUVtQlcsNEJBQWhFQyxRQUFnRUQsRUFBQUUsTUFBdERELHNDQUFzREUsQ0FBMUJDLG1CQUEwQkMsQ0FBWEosaUNBQVdJLENBQUFELFNBQUFELENBQUFELENBQUFGLENBQUFYLENBTWJFLDZDQUp0RGUsS0FJc0RmLE9BQUFFO0FBQUFBO0FBQUFBO0FB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QUF0Q0MsUUFBc0NELEVBQUFFLE1BQTVCRCxtQ0FBbUJFLENBQU5DLE9BQU1DLENBQUFKLHdCQUFBRSxDQUFTWSxFQUFBZCxPQUFBYyxFQUFBYixDQUFBRixDQUFBWCxDQUV4Q1ksY0FBT0UsQ0FBQUYsMEJBQUFFLENBQUFkLENBQ0MrQyxPQUFBbkMsMEJBQUFaIiwic291cmNlc0NvbnRlbnQiOlsiLy8gU2VlIFJlZmVyZW5jZSBmb3IgWFJlZ0V4cDogaHR0cDovL3hyZWdleHAuY29tL3N5bnRheC9cblxubGV0IHJlcGVhdGVkV29yZHMgPSAvXFxiKD88d29yZD5bYS16XSspXFxzK1xcazx3b3JkPlxcYi9naTtcbmxldCByZXN1bHQgPSBbcmVwZWF0ZWRXb3Jkcy50ZXN0KFwiVGhlIHRoZSB0ZXN0IGRhdGFcIildO1xuXG5yZXN1bHQgKz0gWFJlZ0V4cC5yZXBsYWNlKCdUaGUgdGhlIHRlc3QgZGF0YScsIHJlcGVhdGVkV29yZHMsICcke3dvcmR9Jyk7XG5cbmxldCB1cmwgPSAvXlxuICAgICAgICAgICAgKD88c2NoZW1lPiBbXjpcXC8/XSsgKSA6XFwvXFwvICMgYWthIHByb3RvY29sXG4gICAgICAgICAgICAoPzxob3N0PiAgIFteXFwvP10rICApICAgICAgICMgZG9tYWluIG5hbWUgb3IgSVBcbiAgICAgICAgICAgICg/PHBhdGg+ICAgW14/XSogICAgKSBcXD8/ICAgIyBvcHRpb25hbCBwYXRoXG4gICAgICAgICAgICAoPzxxdWVyeT4gIC4qICAgICAgICkgICAgICAgIyBvcHRpb25hbCBxdWVyeS94O1xucmVzdWx0ICs9IFhSZWdFeHAuZXhlYygnaHR0cDovL2dvb2dsZS5jb20vcGF0aC90by9maWxlP3E9MScsIHVybCk7XG5cbmxldCBkID0gL14oPyNtb250aClcXGR7MSwyfVxcLyg/I2RheSlcXGR7MSwyfVxcLyg/I3llYXIpKFxcZHsyfSl7MSwyfS9uO1xucmVzdWx0ICs9IGQudGVzdCgnMDQvMjAvMjAwOCcpO1xuXG5sZXQgZDIgPSAvXlxuICAgICAgICAgICAgXFxkezEsMn0gICAgICAgKD8jbW9udGgpXG4gICAgICAgICBcXC8gXFxkezEsMn0gICAgICAgKD8jZGF5KVxuICAgICAgICAgXFwvIChcXGR7Mn0pezEsMn0gICg/I3llYXIpL254O1xucmVzdWx0ICs9IGQyLnRlc3QoJzA0LzIwLzIwMDgnKTtcblxuXG5cdC8qIEpTIENvZGUgRXF1aXY6XG5cdC8vIEJhc2ljIHVzYWdlOiBBZGQgXFxhIGZvciB0aGUgQUxFUlQgY29udHJvbCBjb2RlXG5cdFhSZWdFeHAuYWRkVG9rZW4oXG5cdCAgL1xcXFxhLyxcblx0ICBmdW5jdGlvbigpIHtyZXR1cm4gJ1xcXFx4MDcnO30sXG5cdCAge3Njb3BlOiAnYWxsJ31cblx0KTtcblx0WFJlZ0V4cCgnXFxcXGFbXFxcXGEtXFxcXG5dKycpLnRlc3QoJ1xceDA3XFxuXFx4MDcnKTsgLy8gLT4gdHJ1ZVxuXHQqL1xuXHRYUmVnRXhwLmFkZFRva2VuKFxuXHRcdC9cXFxcYS8sXG5cdFx0e3JldHVybiAnXFxcXHgwNyc7fSxcblx0XHRbc2NvcGU6ICdhbGwnXVxuXHQpO1xuXHRyZXN1bHQgKz0gWFJlZ0V4cCgvXFxhW1xcYS1cXG5dKy8pLnRlc3QoJ1xceDA3XFxuXFx4MDcnKTtcblxuLy8gQWRkIGVzY2FwZSBzZXF1ZW5jZXM6IFxcUS4uXFxFIGFuZCBcXFEuLlxuWFJlZ0V4cC5hZGRUb2tlbihcbiAgL1xcXFxRKFtcXHNcXFNdKj8pKD86XFxcXEV8JCkvLFxuICAobWF0Y2g6IFtdKSB7XG4gICAgcmV0dXJuIFhSZWdFeHAuZXNjYXBlKG1hdGNoWzFdKTtcbiAgfSxcbiAgW3Njb3BlOiAnYWxsJ11cbik7XG5yZXN1bHQgKz0gWFJlZ0V4cCgvXlxcUSg/KispLykudGVzdCgnKD8qKyknKTsgLy8gLT4gdHJ1ZVxuXG4vLyBBZGQgdGhlIFUgKHVuZ3JlZWR5KSBmbGFnIGZyb20gUENSRSBhbmQgUkUyLCB3aGljaCByZXZlcnNlcyBncmVlZHkgYW5kIGxhenkgcXVhbnRpZmllcnMuXG4vLyBTaW5jZSBgc2NvcGVgIGlzIG5vdCBzcGVjaWZpZWQsIGl0IHVzZXMgJ2RlZmF1bHQnIChpLmUuLCB0cmFuc2Zvcm1hdGlvbnMgYXBwbHkgb3V0c2lkZSBvZlxuLy8gY2hhcmFjdGVyIGNsYXNzZXMgb25seSlcblhSZWdFeHAuYWRkVG9rZW4oXG4gIC8oWz8qK118e1xcZCsoPzosXFxkKik/fSkoXFw/PykvLFxuICAobWF0Y2g6IFtdKSB7XG4gICAgcmV0dXJuIG1hdGNoWzFdICsgaWYobWF0Y2hbMl0se3JldHVybiAnJzt9LHtyZXR1cm4gJz8nO30pO1xuICB9LFxuICBbZmxhZzogJ1UnXVxuKTtcbnJlc3VsdCArPSBYUmVnRXhwKC9hKy9VKS5leGVjKCdhYWEnKVswXTsgLy8gLT4gJ2EnXG5yZXN1bHQgKz0gWFJlZ0V4cCgvYSs/L1UpLmV4ZWMoJ2FhYScpWzBdOyAvLyAtPiAnYWFhJ1xuXG4vLyBBZGQgXFxSIGZvciBtYXRjaGluZyBhbnkgbGluZSBzZXBhcmF0b3IgKENSTEYsIENSLCBMRiwgZXRjLilcblhSZWdFeHAuYWRkVG9rZW4oXG4gIC9cXFxcUi8sXG4gIHtyZXR1cm4gJyg/OlxcXFxyXFxcXG58W1xcXFxuLVxcXFxyXFxcXHg4NVxcXFx1MjAyOFxcXFx1MjAyOV0pJzt9XG4pO1xuY29uc29sZS5sb2coWFJlZ0V4cC5idWlsZCk7XG5sZXQgdGltZSA9IFhSZWdFeHAuYnVpbGQoJyg/eCleIHt7aG91cnN9fSAoe3ttaW51dGVzfX0pICQnLCBbXG4gIGhvdXJzOiBYUmVnRXhwLmJ1aWxkKCd7e2gxMn19IDogfCB7e2gyNH19JywgW1xuICAgIGgxMjogLzFbMC0yXXwwP1sxLTldLyxcbiAgICBoMjQ6IC8yWzAtM118WzAxXVswLTldL1xuICBdLCAneCcpLFxuICBtaW51dGVzOiAvXlswLTVdWzAtOV0kL1xuXSk7XG5cbnJlc3VsdCArPSB0aW1lLnRlc3QoJzEwOjU5Jyk7IC8vIC0+IHRydWVcbnJlc3VsdCArPSBYUmVnRXhwLmV4ZWMoJzEwOjU5JywgdGltZSkubWludXRlczsgLy8gLT4gJzU5J1xuXG5wcmludChyZXN1bHQpO1xucmV0dXJuIHJlc3VsdDsiXX0=