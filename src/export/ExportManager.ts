import { StreamSourceController } from "./Exporter";
import * as ServiceWorkerComms from "../ServiceWorkerComms";
import { waveExporter } from "./wave/WaveExporter";
import { wavePerChannelExporter } from "./wavePerChannel/WavePerChannelExporter";

export const exporters = [waveExporter, wavePerChannelExporter];

// TODO: This whole ServiceWorker stuff could be replaced with the
// File System Access API (which is only available in Chromium).
// Maybe check if it's available and use it instead.
// https://web.dev/file-system-access/

export async function prepareStreamExport(
	exporterIndex: number,
	sampleRate: number,
	seconds: number,
	compress: boolean,
	seqName: string,
	onReady: (url: string, filename: string) => void,
	onProgress: (amount: number) => void,
	onClose: () => void
) {
	const stream = exporters[exporterIndex].getStream(
		sampleRate,
		seconds,
		onProgress
	);
	await ServiceWorkerComms.ready;

	ServiceWorkerComms.on("streamStart", async (callData) => {
		const queue: Uint8Array[] = [];
		let shouldClose = false;

		const controller: StreamSourceController = {
			enqueue(buf) {
				queue.push(buf);
			},
			close() {
				onClose();
				shouldClose = true;
			}
		};

		await Promise.resolve(stream.start(controller));

		ServiceWorkerComms.send("callResponse", {
			id: callData.id,
			data: {
				queue,
				shouldClose
			}
		});
	});

	ServiceWorkerComms.on("streamPull", async (callData) => {
		const queue: Uint8Array[] = [];
		let shouldClose = false;

		const controller: StreamSourceController = {
			enqueue(buf) {
				queue.push(buf);
			},
			close() {
				onClose();
				shouldClose = true;
			}
		};

		await Promise.resolve(stream.pull(controller));

		ServiceWorkerComms.send("callResponse", {
			id: callData.id,
			data: {
				queue,
				shouldClose
			}
		});
	});

	ServiceWorkerComms.on("streamCancel", async (callData) => {
		await Promise.resolve(stream.cancel());

		ServiceWorkerComms.off("streamStart");
		ServiceWorkerComms.off("streamPull");
		ServiceWorkerComms.off("streamCancel");

		onClose();

		ServiceWorkerComms.send("callResponse", {
			id: callData.id,
			data: null
		});
	});

	let filename = `${seqName}.${exporters[exporterIndex].fileExtension}`;
	if (compress) {
		filename += ".gz";
	}

	ServiceWorkerComms.on("streamReady", (data) => {
		ServiceWorkerComms.off("streamReady");

		onReady(data.data.url, data.data.filename);

		ServiceWorkerComms.send("callResponse", {
			id: data.id,
			data: null
		});
	});

	ServiceWorkerComms.send("setStream", {
		filename,
		compress,
		headers: {
			"Content-Type": compress
				? "application/gzip"
				: exporters[exporterIndex].mimeType,
			"Content-Disposition": `attachment; filename="${filename}"`
		}
	});
}
