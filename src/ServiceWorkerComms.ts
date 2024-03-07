export async function init() {
	if (!("serviceWorker" in navigator)) {
		console.error("Service workers are not supported in this browser.");
	}

	navigator.serviceWorker.addEventListener("message", (e) => {

	});

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
}