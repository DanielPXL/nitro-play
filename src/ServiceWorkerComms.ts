export async function init() {
	if (!("serviceWorker" in navigator)) {
		console.error("Service workers are not supported in this browser.");
	}

	try {
		await navigator.serviceWorker.register(
			new URL("ServiceWorker.ts", import.meta.url),
			{
				scope: "/",
				type: "module"
			}
		);
	} catch (e) {
		console.error("Service worker registration failed:", e);
	}
}