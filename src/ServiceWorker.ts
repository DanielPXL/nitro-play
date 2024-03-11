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

interface Stream {
	stream: ReadableStream;
	headers: Record<string, string>;
}

let streams: Map<string, Stream> = new Map();

self.addEventListener("fetch", (e: FetchEvent) => {
	console.log("fetch", e.request.url);
	if (e.request.method !== "GET") return;

	// Stream downloads
	const lastPartOfUrl = e.request.url.split("/").pop();
	if (lastPartOfUrl && streams.has(lastPartOfUrl)) {
		const stream = streams.get(lastPartOfUrl)!;
		streams.delete(lastPartOfUrl);
		e.respondWith(new Response(stream.stream, { headers: new Headers(stream.headers) }));
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

let handlers: Map<string, (data: any, call: (type: string, data: any) => Promise<any>) => void> = new Map();
let callResponseHandlers: Map<number, (data: any) => void> = new Map();
let callId = 0;

addEventListener("message", (e: ExtendableMessageEvent) => {
	function respond(type: string, data: any) {
		const id = ++callId;
		return new Promise<any>((resolve) => {
			callResponseHandlers.set(id, (responseData) => {
				callResponseHandlers.delete(id);
				resolve(responseData);
			});

			e.source.postMessage({ type, data: { id, data } });
		});
	}

	const data = e.data;
	if (handlers.has(data.type)) {
		handlers.get(data.type)!(data.data, respond);
	}
});

handlers.set("callResponse", (data, call) => {
	const id = data.id;
	const handler = callResponseHandlers.get(id);
	if (handler) {
		handler(data.data);
	}
});

handlers.set("setStream", (data, call) => {
	const stream = new ReadableStream({
		async start(controller) {
			const { queue, shouldClose } = await call("streamStart", null);
			for (const buf of queue) {
				controller.enqueue(buf);
			}

			if (shouldClose) {
				controller.close();
			}
		},
		async pull(controller) {
			const { queue, shouldClose } = await call("streamPull", null);
			for (const buf of queue) {
				controller.enqueue(buf);
			}

			if (shouldClose) {
				controller.close();
			}
		},
		async cancel() {
			await call("streamCancel", null);
		}
	});

	streams.set("stream", {
		stream,
		headers: data.headers
	});

	call("streamReady", {
		url: self.location.href.replace(/\/[^/]*$/, "/") + "stream",
		filename: data.filename
	});
});
