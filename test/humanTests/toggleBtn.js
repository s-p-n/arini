#!/usr/bin/env node
"use strict";global.__scopedir=__dirname;require("source-map-support").install();const scope=require("/home/spence/Projects/scope/lib/scopeRuntime.js");const ScopeApi=require("/home/spence/Projects/scope/lib/scopeRuntimeApi.js")(scope);module.exports=scope.createScope(function(args){scope.declarationExpression({type:"let",name:"server",value:scope.import("/home/spence/Projects/scope/packages/serve/main.js")()});scope.declarationExpression({type:"let",name:"Toggle",value:scope.createScope(function(args){scope.declarationExpression({type:"let",name:"attr",value:args[0]===undefined?scope.mapExpression():args[0]});scope.declarationExpression({type:"let",name:"children",value:args[1]===undefined?scope.mapExpression():args[1]});scope.declarationExpression({type:"public",name:"state",value:scope.mapExpression(["isToggleOn",true])});scope.declarationExpression({type:"public",name:"handleClick",value:scope.createScope(function(args){scope.assignmentExpression([scope.identifier("state"),"isToggleOn"],["=", !scope.identifier("state")["isToggleOn"]]);})});scope.declarationExpression({type:"public",name:"render",value:scope.createScope(function(args){return scope.xmlExpression("button",{"onClick":scope.identifier("handleClick")},ScopeApi['if'](scope.identifier("state")["isToggleOn"],scope.createScope(function(args){return "ON";}),scope.createScope(function(args){return "OFF";})));})});})});scope.declarationExpression({type:"let",name:"doc",value:scope.xmlExpression("html",{},scope.xmlExpression("head",{},scope.xmlExpression("title",{},"Toggle test..")),scope.xmlExpression("body",{},scope.xmlExpression("Toggle",{})))});scope.identifier("server")["get"]("/",scope.createScope(function(args){scope.declarationExpression({type:"let",name:"client",value:args[0]===undefined?scope.mapExpression():args[0]});ScopeApi.print("got /");scope.identifier("client")["response"]["render"](scope.identifier("doc"));}));scope.identifier("server")["listen"](scope.mapExpression(["port",8080],["clientScope",true]));})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3NwZW5jZS9Qcm9qZWN0cy9zY29wZS90ZXN0L2h1bWFuVGVzdHMvdG9nZ2xlQnRuLnNjIl0sIm5hbWVzIjpbIjxhbm9ueW1vdXNlPiIsInNlcnZlciIsInNjb3BlLmlkZW50aWZpZXIoXCJzZXJ2ZXJcIikuZ2V0IiwiaW52b2tlRXhwcmVzc2lvbiIsInByaW50IiwiY2xpZW50Iiwic2NvcGUuaWRlbnRpZmllcihcImNsaWVudFwiKS5yZXNwb25zZSIsInNjb3BlLmlkZW50aWZpZXIoXCJjbGllbnRcIilbXCJyZXNwb25zZVwiXS5yZW5kZXIiLCJkb2MiLCJzY29wZS5pZGVudGlmaWVyKFwic2VydmVyXCIpLmxpc3RlbiJdLCJtYXBwaW5ncyI6IkFBZ0U0Q0E7QUFBQUEsNFJBbENoQkEsbUlBY1pBLHk5QkFXTkEseU9BSUpDLDBCQUFBQyxPQUVxQkMsQ0FGYkgsR0FFYUEsa0pBRHJCSSxjQUFRRCxDQUFBSCxPQUFBRyxDQUFBSCxDQUNQSywwQkFBQUMsWUFBQUMsVUFBb0JKLENBQUFLLHVCQUFBTCxDQUFBSCxHQUFBRyxDQUFBSCxDQUdyQkMsMEJBQUFRLFVBQXNDTixDQUFBSCx1REFBQUcsQ0FBQUgsR0FBQUcsRUFBQUgiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBSZWFjdCBFcXVpdmFsZW50OiBcbmNsYXNzIFRvZ2dsZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuc3RhdGUgPSB7aXNUb2dnbGVPbjogdHJ1ZX07XG5cbiAgICAvLyBUaGlzIGJpbmRpbmcgaXMgbmVjZXNzYXJ5IHRvIG1ha2UgYHRoaXNgIHdvcmsgaW4gdGhlIGNhbGxiYWNrXG4gICAgdGhpcy5oYW5kbGVDbGljayA9IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKTtcbiAgfVxuXG4gIGhhbmRsZUNsaWNrKCkge1xuICAgIHRoaXMuc2V0U3RhdGUocHJldlN0YXRlID0+ICh7XG4gICAgICBpc1RvZ2dsZU9uOiAhcHJldlN0YXRlLmlzVG9nZ2xlT25cbiAgICB9KSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxidXR0b24gb25DbGljaz17dGhpcy5oYW5kbGVDbGlja30+XG4gICAgICAgIHt0aGlzLnN0YXRlLmlzVG9nZ2xlT24gPyAnT04nIDogJ09GRid9XG4gICAgICA8L2J1dHRvbj5cbiAgICApO1xuICB9XG59XG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPFRvZ2dsZSAvPixcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKVxuKTtcbiovXG5sZXQgc2VydmVyID0gaW1wb3J0IFwic2VydmVcIigpO1xuXG5sZXQgVG9nZ2xlID0gKGF0dHI6IFtdLCBjaGlsZHJlbjogW10pIHtcblx0cHVibGljIHN0YXRlID0gW2lzVG9nZ2xlT246IHRydWVdO1xuXG5cdHB1YmxpYyBoYW5kbGVDbGljayA9IHtcblx0XHRzdGF0ZS5pc1RvZ2dsZU9uID0gIXN0YXRlLmlzVG9nZ2xlT247XG5cdH07XG5cblx0cHVibGljIHJlbmRlciA9IHtcblx0XHRyZXR1cm4gPGJ1dHRvbiBvbkNsaWNrPWhhbmRsZUNsaWNrPlxuXHRcdFx0aWYgKHN0YXRlLmlzVG9nZ2xlT24sIHtcblx0XHRcdFx0cmV0dXJuIFwiT05cIjtcblx0XHRcdH0sIHtcblx0XHRcdFx0cmV0dXJuIFwiT0ZGXCI7XG5cdFx0XHR9KTtcblx0XHQ8L2J1dHRvbj47XG5cdH07XG59O1xubGV0IGRvYyA9IFxuPGh0bWw+XG5cdDxoZWFkPlxuXHRcdDx0aXRsZT5cIlRvZ2dsZSB0ZXN0Li5cIjs8L3RpdGxlPjtcblx0PC9oZWFkPjtcblx0PGJvZHk+XG5cdFx0PFRvZ2dsZSAvPjtcblx0PC9ib2R5PjtcbjwvaHRtbD47XG5cbnNlcnZlci5nZXQoXCIvXCIsIChjbGllbnQ6IFtdKSB7XG5cdHByaW50KFwiZ290IC9cIik7XG5cdGNsaWVudC5yZXNwb25zZS5yZW5kZXIoZG9jKTtcbn0pO1xuXG5zZXJ2ZXIubGlzdGVuKFtwb3J0OiA4MDgwLCBjbGllbnRTY29wZTogdHJ1ZV0pOyJdfQ==