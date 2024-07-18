export {};

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", (e: ExtendableEvent) => {
	self.skipWaiting();
});

async function activate() {
	// Clear old caches (prior versions supported offline use)
	const keys = await caches.keys();
	await Promise.all(keys.map((key) => caches.delete(key)));
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
	if (e.request.method !== "GET") return;

	// Stream downloads
	const lastPartOfUrl = e.request.url.split("/").pop();
	if (lastPartOfUrl && streams.has(lastPartOfUrl)) {
		const stream = streams.get(lastPartOfUrl)!;
		streams.delete(lastPartOfUrl);
		e.respondWith(
			new Response(stream.stream, {
				headers: new Headers(stream.headers)
			})
		);
		return;
	}
});

let handlers: Map<
	string,
	(data: any, call: (type: string, data: any) => Promise<any>) => void
> = new Map();
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
	let stream = new ReadableStream({
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

	if (data.compress) {
		stream = stream.pipeThrough(new CompressionStream("gzip"));
	}

	function randomString(n: number) {
		let str = "";
		const chars =
			"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		for (let i = 0; i < n; i++) {
			str += chars[Math.floor(Math.random() * chars.length)];
		}
		return str;
	}

	const streamId = randomString(16);
	streams.set(`stream-${streamId}`, {
		stream,
		headers: data.headers
	});

	call("streamReady", {
		url: `${self.location.href.replace(/\/[^/]*$/, "/")}stream-${streamId}`,
		filename: data.filename
	});
});
