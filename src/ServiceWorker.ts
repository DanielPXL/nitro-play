import { version, manifest } from "@parcel/service-worker";

declare const self: ServiceWorkerGlobalScope;

async function install() {
	// Remove duplicates from manifest because for some reason Parcel adds them
	const manifestNoDupes = Array.from(new Set(manifest));

	const cache = await caches.open(version);
	await cache.addAll(manifestNoDupes);
	await cache.add(self.location.href.replace(/\/[^/]*$/, "/"));
}

self.addEventListener("install", (e: ExtendableEvent) => {
	e.waitUntil(install());
	self.skipWaiting();
});

async function activate() {
	const keys = await caches.keys();
	await Promise.all(
		keys.map(key => key !== version && caches.delete(key))
	);
}

self.addEventListener("activate", (e: ExtendableEvent) => {
	e.waitUntil(activate());
	e.waitUntil(self.clients.claim());
});

let streams: Map<string, ReadableStream> = new Map();

self.addEventListener("fetch", (e: FetchEvent) => {
	if (e.request.method !== "GET") return;

	// Stream downloads
	const lastPartOfUrl = e.request.url.split("/").pop();
	if (lastPartOfUrl && streams.has(lastPartOfUrl)) {
		const stream = streams.get(lastPartOfUrl)!;
		streams.delete(lastPartOfUrl);
		e.respondWith(new Response(stream));
		return;
	}

	// Don't cache requests for localhost
	if (e.request.url.includes("localhost")) return;
	if (e.request.url.includes("127.0.0.1")) return;
	
	async function getResponse() {
		const cache = await caches.open(version);
		
		// Parcel adds stupid timestamps to the end of the URLs (at least for debug builds)
		// and I can't figure out how to disable them,
		// so I'm just going to strip them off here
		const realUrl = e.request.url.replace(/\?.*$/, "");
		const cachedResponse = await cache.match(realUrl);
		if (cachedResponse) {
			return cachedResponse;
		}

		return fetch(e.request);
	}

	e.respondWith(getResponse());
});

let handlers: Map<string, (data: any, respond: (data: any) => void) => void> = new Map();

addEventListener("message", (e: ExtendableMessageEvent) => {
	function respond(data: any) {
		e.source.postMessage(data);
	}

	const data = e.data;
	if (handlers.has(data.type)) {
		handlers.get(data.type)!(data.data, respond);
	}
});

handlers.set("setStream", (data, respond) => {
	streams.set("stream", data);
});
