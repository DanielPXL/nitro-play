import { version, manifest } from "@parcel/service-worker";

declare const self: ServiceWorkerGlobalScope;

async function install() {
	// Remove duplicates from manifest because for some reason Parcel adds them
	const manifestNoDupes = Array.from(new Set(manifest));

	const cache = await caches.open(version);
	await cache.addAll(manifestNoDupes);
	await cache.add("");
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

self.addEventListener("fetch", (e: FetchEvent) => {
	if (e.request.method !== "GET") return;
	
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
