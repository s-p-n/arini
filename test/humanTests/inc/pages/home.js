#!/usr/bin/env node
				"use strict";
				global.__scopedir = __dirname;
				require('source-map-support').install();
				const scope = require("/home/spence/Projects/scope/lib/scopeRuntime.js");
				const ScopeApi = require("/home/spence/Projects/scope/lib/scopeRuntimeApi.js")(scope);module.exports=scope.invokeExpression(scope.createScope((args)=>{return scope.createScope((args)=>{scope.declarationExpression({
				type: "public",
				name: "page",
				value: scope.createScope((args)=>{scope.declarationExpression({
				type: "let",
				name: "template",
				value: args[0] === undefined ? scope.createScope((args)=>{}) : args[0]
			});
return scope.invokeExpression(scope.identifier("template"),[scope.mapExpression(["title","Home"],["url","/home"],["description","Example site built using the Scope Programming Language."],["body",scope.xmlExpression("article",{},scope.xmlExpression("h1",{},"Da Homepage"),scope.xmlExpression("div",{},"This is an article.. kinda."))])]);})
			});});}),[]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3NwZW5jZS9Qcm9qZWN0cy9zY29wZS90ZXN0L2h1bWFuVGVzdHMvaW5jL3BhZ2VzL2hvbWUuc2MiXSwibmFtZXMiOlsiPGFub255bW91c2U+IiwiPHNjb3BlPiJdLCJtYXBwaW5ncyI6IkFBWWtDQTtBQUFBQTtBQUFBQTtBQUFBQTtBQUFBQTtBQUFBQSx5R0FBQUMsdUJBQUFEO0FBQUFBO0FBQUFBO0FBQUFBO0FBQUFBO0FBQUFBO0FBQUFBO0FBQUFBO0FBQUFBO0FBQUFBLFdBQUFDLElBQUFEIiwic291cmNlc0NvbnRlbnQiOlsicmV0dXJuIHtcblx0cHVibGljIHBhZ2UgPSAodGVtcGxhdGU6IHt9KSB7XG5cdFx0cmV0dXJuIHRlbXBsYXRlKFtcblx0XHRcdHRpdGxlOiBcIkhvbWVcIixcblx0XHRcdHVybDogXCIvaG9tZVwiLFxuXHRcdFx0ZGVzY3JpcHRpb246IFwiRXhhbXBsZSBzaXRlIGJ1aWx0IHVzaW5nIHRoZSBTY29wZSBQcm9ncmFtbWluZyBMYW5ndWFnZS5cIixcblx0XHRcdGJvZHk6IFxuXHRcdFx0PGFydGljbGU+XG5cdFx0XHRcdDxoMT5cblx0XHRcdFx0XHRcIkRhIEhvbWVwYWdlXCI7XG5cdFx0XHRcdDwvaDE+O1xuXHRcdFx0XHQ8ZGl2PlxuXHRcdFx0XHRcdFwiVGhpcyBpcyBhbiBhcnRpY2xlLi4ga2luZGEuXCI7XG5cdFx0XHRcdDwvZGl2Pjtcblx0XHRcdDwvYXJ0aWNsZT5cblx0XHRdKTtcblx0fTtcbn07Il19