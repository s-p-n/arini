const express = require('express');
const socketIo = require('socket.io');
const spdy = require('spdy');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ScopeParser = require('../../index.js');//require('scope-lang');
const libUtils = new ScopeParser().libraryUtils();
const scope = libUtils.runtime;
const ScopeApi = libUtils.api(scope);
const h = require('hyperscript');

function mapToObj (m) {
	if (m instanceof Map) {
		let obj = Object.create(null);
		for (let [key, val] of m) {
			obj[key] = mapToObj(val);
		}
		return obj;
	}
	return m;
}

function get (id) {
	return this[id];
}

function Serve (options = {}) {
	let app = express();
	let self = {app: app};
	let spdyOpts = mapToObj(options);
	let server;
	let cache = {};
	if (spdyOpts.key && spdyOpts.cert) {
		if (spdyOpts.key[0] !== "/") {
			spdyOpts.key = path.resolve(__scopedir, spdyOpts.key);
		}
		if (spdyOpts.cert[0] !== "/") {
			spdyOpts.cert = path.resolve(__scopedir, spdyOpts.cert);
		}
		if (fs.existsSync(spdyOpts.key) && fs.existsSync(spdyOpts.cert)) {
			spdyOpts.key = fs.readFileSync(spdyOpts.key);
			spdyOpts.cert = fs.readFileSync(spdyOpts.cert);
			server = spdy.createServer(spdyOpts, app);
		} else {
			throw new Error("SSL Key or Certificate not found");
		}
	} else {
		server = http.createServer(app);
	}
	let io = socketIo(server);
	let clients = scope.mapExpression();
	let clientScope = true;
	let ioListeners = scope.mapExpression();
	
	self.listen = (props, callback) => {
		if (!props.has('port')) {
			// TODO: set to random available port
			props.set('port', 8000);
		}
		if (callback !== undefined) {
			server.listen(props.get('port'), callback);
		} else {
			server.listen(props.get('port'));
		}
		if (!props.has('clientScope')) {
			props.set('clientScope', true);
		}
		if (props.get('clientScope')) {
			app.get('/Serve/client.js', (req, res, next) => {
				res.sendFile(path.join(__dirname, "/client.js"));
			});
		} else {
			clientScope = false;
		}
	};
	
	self.on = (channel, data) => {
		ioListeners.set(channel, data);
	};
	
	io.on("connection", function (client) {
		let scClient = scope.mapExpression();
		scClient.set("emit", (args) => {
			let channel = args[0];
			let data = args[1];
			client.emit(channel, data);
		});
		scClient.set("broadcast", (args) => {
			let channel = args[0];
			let data = args[1];
			client.broadcast(channel, data);
		});
		for (let [channel, handle] of ioListeners) {
			client.on(channel, function (data) {
				scope.invokeExpression({
					function: handle, 
					arguments: [scClient, data]});
			});
		}
		scClient.get("emit")._isScope = true;
		scClient.get("broadcast")._isScope = true;
	});

	self.get = (url, handle) => {
		app.get(url, (req, res, next) => {
			let client = {};
			let request = req;
			let response = res;
			

			response.sendStyle = (stylesheet) => {
				let css = scope.xmlExpression('style', {}, stylesheet).childNodes[0].value;
				res.type('css').end(css);
			};
			response.render = (xmlType, useCache = true) => {
				console.time("render: "+request.url);
				let result = "";
				if (!useCache || !(request.url in cache)) {
					if (clientScope && xmlType.tagName === "html") {
						xmlType.childNodes.forEach((node) => {
							if (node.tagName === 'body') {
								node.appendChild(h('script', {src: 'https://code.jquery.com/jquery-3.3.1.min.js'}, ["JavaScript needed for full functionality"]));
								node.appendChild(h('script', {src: '/socket.io/socket.io.js'}, ["JavaScript needed for full functionality"]));
								node.appendChild(h('script', {'src': "Serve/client.js"}, ["JavaScript needed for full functionality"]));
							}
						});
					}
					if (useCache) {
						cache[request.url] = xmlType.toString();
						result = cache[request.url];
					} else {
						result = xmlType.toString();
					}
				} else {
					result = cache[request.url];
				}
				console.timeEnd("render: "+request.url);
				res.send(result);
			};
			client.request = request;
			client.response = response;
			client.next = next;
			scope.invokeExpression({
				function: handle, 
				arguments: [client]});
		});
	};

	self.manifest = (m) => {
		let o = mapToObj(m);
		app.get("/manifest.webmanifest", (req, res) => {
			res.send(JSON.stringify(o));
		});
	};
	return self;
}

module.exports = Serve;