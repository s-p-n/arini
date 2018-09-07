#!/usr/bin/env node
				"use strict";
				global.__scopedir = __dirname;
				require('source-map-support').install();
				const scope = require("/home/spence/Projects/scope/lib/scopeRuntime.js");
				const ScopeApi = require("/home/spence/Projects/scope/lib/scopeRuntimeApi.js")(scope);module.exports=scope.invokeExpression({function:scope.createScope((args)=>{return scope.createScope((args)=>{scope.declarationExpression({
				type: "let",
				name: "directory",
				value: args[0] === undefined ? "" : args[0]
			});
scope.invokeExpression({function:ScopeApi.print,arguments:["Will load: ",scope.identifier("directory")],context:this});scope.declarationExpression({
				type: "public",
				name: "promises",
				value: scope.mapExpression(["home",scope.invokeExpression({function:ScopeApi.compile,arguments:["./pages/home.sc"],context:this})],["docs",scope.invokeExpression({function:ScopeApi.compile,arguments:["./pages/docs.sc"],context:this})],["about",scope.invokeExpression({function:ScopeApi.compile,arguments:["./pages/about.sc"],context:this})])
			});});}),arguments:[],context:this});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3NwZW5jZS9Qcm9qZWN0cy9zY29wZS90ZXN0L2h1bWFuVGVzdHMvaW5jL2xvYWRQYWdlcy5zYyJdLCJuYW1lcyI6WyI8YW5vbnltb3VzZT4iLCI8c2NvcGU+IiwicHJpbnQiLCJkaXJlY3RvcnkiXSwibWFwcGluZ3MiOiJBQUttQ0E7QUFBQUE7QUFBQUE7QUFBQUE7QUFBQUE7QUFBQUEseUdBQUFDLGlDQUFBRDtBQUFBQTtBQUFBQTtBQUFBQTtBQUFBQTtBQUpKQyxpQ0FBekJDLGNBQXlCRCxZQUFYRCxhQUFXQSxDQUFBRyw2QkFBQUYsZ0JBQUFELENBSUlBO0FBQUFBO0FBQUFBO0FBQUFBO0FBQUFBLFdBQUFDLDRCQUFBRCIsInNvdXJjZXNDb250ZW50IjpbInJldHVybiAoZGlyZWN0b3J5OiBcIlwiKSB7XG5cdHByaW50KFwiV2lsbCBsb2FkOiBcIiwgZGlyZWN0b3J5KTtcblx0cHVibGljIHByb21pc2VzID0gW1xuXHRcdGhvbWU6IGNvbXBpbGUoXCIuL3BhZ2VzL2hvbWUuc2NcIiksXG5cdFx0ZG9jczogY29tcGlsZShcIi4vcGFnZXMvZG9jcy5zY1wiKSxcblx0XHRhYm91dDogY29tcGlsZShcIi4vcGFnZXMvYWJvdXQuc2NcIilcblx0XTtcbn07Il19