#!/usr/bin/env node
"use strict";global.__scopedir=__dirname;require("source-map-support").install();const scope=require("/home/spence/Projects/scope/lib/scopeRuntime.js");const ScopeApi=require("/home/spence/Projects/scope/lib/scopeRuntimeApi.js")(scope);module.exports=scope.createScope((args)=>{return scope.createScope((args)=>{scope.declarationExpression({type:"public",name:"page",value:scope.createScope((args)=>{scope.declarationExpression({type:"let",name:"template",value:args[0]===undefined?scope.createScope((args)=>{}):args[0]});return scope.identifier("template")(scope.mapExpression(["title","About"],["url","/about"],["description","Information about who we are. (Hint: we make the Scope Programming Language!)"],["body",scope.xmlExpression("article",{},scope.xmlExpression("h1",{},"About Us"),scope.xmlExpression("div",{},"This is an article about us.. kinda."))]));})});});})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3NwZW5jZS9Qcm9qZWN0cy9zY29wZS90ZXN0L2h1bWFuVGVzdHMvaW5jL3BhZ2VzL2Fib3V0LnNjIl0sIm5hbWVzIjpbIjxhbm9ueW1vdXNlPiIsImludm9rZUV4cHJlc3Npb24iXSwibWFwcGluZ3MiOiJBQVkyQ0E7QUFBQUEseTJCQUFBQyxFQUFBRCIsInNvdXJjZXNDb250ZW50IjpbInJldHVybiB7XG5cdHB1YmxpYyBwYWdlID0gKHRlbXBsYXRlOiB7fSkge1xuXHRcdHJldHVybiB0ZW1wbGF0ZShbXG5cdFx0XHR0aXRsZTogXCJBYm91dFwiLFxuXHRcdFx0dXJsOiBcIi9hYm91dFwiLFxuXHRcdFx0ZGVzY3JpcHRpb246IFwiSW5mb3JtYXRpb24gYWJvdXQgd2hvIHdlIGFyZS4gKEhpbnQ6IHdlIG1ha2UgdGhlIFNjb3BlIFByb2dyYW1taW5nIExhbmd1YWdlISlcIixcblx0XHRcdGJvZHk6IFxuXHRcdFx0PGFydGljbGU+XG5cdFx0XHRcdDxoMT5cblx0XHRcdFx0XHRcIkFib3V0IFVzXCI7XG5cdFx0XHRcdDwvaDE+O1xuXHRcdFx0XHQ8ZGl2PlxuXHRcdFx0XHRcdFwiVGhpcyBpcyBhbiBhcnRpY2xlIGFib3V0IHVzLi4ga2luZGEuXCI7XG5cdFx0XHRcdDwvZGl2Pjtcblx0XHRcdDwvYXJ0aWNsZT5cblx0XHRdKTtcblx0fTtcbn07Il19