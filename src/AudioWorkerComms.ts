let worker: Worker | null = null;
let handlers: Map<string, (data: any) => void> = new Map();
let callHandlers: Map<number, (data: any, err?: string) => void> = new Map();
let callId = 0;

export async function init() {
	worker = new Worker(new URL("AudioWorker.ts", import.meta.url), { type: "module" });
	worker.onmessage = (e) => {
		if (handlers.has(e.data.type)) {
			handlers.get(e.data.type)!(e.data.data);
		}
	}

	on("call", (data) => {
		if (callHandlers.has(data.id)) {
			callHandlers.get(data.id)!(data.data, data.err);
		}
	})
}

export function send(type: string, data: any, transfer?: Transferable[]) {
	// Thanks TypeScript
	worker!.postMessage({ type, data }, transfer as any);
}

export function on(type: string, handler: (data: any) => void) {
	handlers.set(type, handler);
}

export function off(type: string) {
	handlers.delete(type);
}

export function call(type: string, data?: any, transfer?: Transferable[]): Promise<any> {
	return new Promise((resolve, reject) => {
		const id = callId++;
		callHandlers.set(id, (data) => {
			callHandlers.delete(id);

			if (data.err) {
				reject(data.err);
				return;
			}

			resolve(data.data);
		});

		send("call", { id, type, data }, transfer);
	});
}