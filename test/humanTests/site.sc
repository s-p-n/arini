let server = import "serve"(/*[
	key: "lib/server.key",
	cert: "lib/server.cert"
]*/);
let template = import "inc/template.sc";
let loadPages = import "inc/loadPages.sc";

let loader = loadPages("inc/pages");

template.manifest = [
	short_name: "Scope Test",
	name: "Scope Programming Language Test Site",
	start_url: "/",
	background_color: "#FFFFFF",
	display: "standalone",
	scope: "/",
	theme_color: "#0090D2"
];

template.styleLink = "/styles/main.css";

template.nav = [
	Home: "/home",
	Documentation: "/docs",
	About: "/about",
	Contact: "/contact"
];

let notFound = [
	title: "404: Not Found",
	url: "404",
	body: 
	<article>
		<h2>
			"We have a problem..";
		</h2>;
		<div>
			<strong>"404 Not Found:";</strong>;
			" The requested page was not found.";
		</div>;
	</article>
];

server.manifest(template.manifest);

server.get("/", (client: []) {
	client.response.redirect(301, "/home");
});

server.get("/404", (client: []) {
	client.response.status(404);
	client.response.render(template.generate(notFound));
});

server.get(template.styleLink, (client: []) {
	client.response.sendStyle(template.stylesheet);
});
promise.all(loader.promises).then((pages: []) {
	server.get("/:page", (client: []) {
		let renderred = false;
		each(pages, (sc: {}, name: "") {
			if (name is client.request.params.page, {
				use sc;
				client.response.render(page(template.generate), false);
				renderred = true;
			});
		});
		if (!renderred, {
			client.response.status(404);
			client.response.render(template.generate(notFound));
		});
	});
});

server.listen([port: 8080, clientScope: true], {
	print("Server running on 8080");
});