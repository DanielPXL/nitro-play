let handlers: Map<string, (data: any) => void> = new Map();

let isReady = false;
let readyResolve: () => void;
export let ready = new Promise<void>((resolve) => {
	if (isReady) {
		resolve();
		return;
	}

	readyResolve = resolve;
});


export async function init() {
	if (!("serviceWorker" in navigator)) {
		console.error("Service workers are not supported in this browser.");
	}

	try {
		await navigator.serviceWorker.register(
			new URL("ServiceWorker.ts", import.meta.url),
			{
				scope: document.location.href.replace(/\/[^/]*$/, "/"),
				type: "module"
			}
		);
	} catch (e) {
		console.error("Service worker registration failed:", e);
	}

	navigator.serviceWorker.addEventListener("message", (e) => {
		const data = e.data;
		if (handlers.has(data.type)) {
			handlers.get(data.type)!(data.data);
		}
	});

	isReady = true;
	readyResolve();
}

export function send(type: string, data: any, transfer?: Transferable[]) {
	if (!navigator.serviceWorker.controller) {
		throw new Error("Service worker is not ready");
	}

	// Thanks TypeScript
	navigator.serviceWorker.controller.postMessage({ type, data }, transfer as any);
}

export function on(type: string, handler: (data: any) => void) {
	handlers.set(type, handler);
}

export function off(type: string) {
	handlers.delete(type);
}
