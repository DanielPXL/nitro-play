import { StreamSourceController } from "./Exporter";
import * as ServiceWorkerComms from "../ServiceWorkerComms";
import * as ExportDialog from "./ExportDialog";
import * as ProgressStatus from "./ProgressStatus";
import { ControlSection } from "../ControlSection";
import { waveExporter } from "./wave/WaveExporter";
import { wavePerChannelExporter } from "./wavePerChannel/WavePerChannelExporter";

export const exporters = [
	waveExporter,
	wavePerChannelExporter
]

export function init() {
	ServiceWorkerComms.on("streamReady", (data) => {
		ExportDialog.enableStartButton(data.data.url, data.data.filename);

		ServiceWorkerComms.send("callResponse", {
			id: data.id,
			data: null
		});
	});
}

// TODO: This whole ServiceWorker stuff could be replaced with the
// File System Access API (which is only available in Chromium).
// Maybe check if it's available and use it instead.
// https://web.dev/file-system-access/

export async function prepareStreamExport(exporterIndex: number, sampleRate: number, seconds: number, seqName: string, configSection: ControlSection | null) {
	const stream = exporters[exporterIndex].getStream(sampleRate, seconds, ProgressStatus.update, configSection);
	await ServiceWorkerComms.ready;

	ServiceWorkerComms.on("streamStart", async (callData) => {
		const queue: Uint8Array[] = [];
		let shouldClose = false;

		const controller: StreamSourceController = {
			enqueue(buf) {
				queue.push(buf);
			},
			close() {
				ExportDialog.close();
				shouldClose = true;
			}
		}

		await Promise.resolve(stream.start(controller))

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
				ExportDialog.close();
				shouldClose = true;
			}
		}

		await Promise.resolve(stream.pull(controller))

		ServiceWorkerComms.send("callResponse", {
			id: callData.id,
			data: {
				queue,
				shouldClose
			}
		});
	});

	ServiceWorkerComms.on("streamCancel", async (callData) => {
		await Promise.resolve(stream.cancel())

		ServiceWorkerComms.off("streamStart");
		ServiceWorkerComms.off("streamPull");
		ServiceWorkerComms.off("streamCancel");

		ExportDialog.close();

		ServiceWorkerComms.send("callResponse", {
			id: callData.id,
			data: null
		});
	});
	
	ServiceWorkerComms.send("setStream", {
		filename: `${seqName}.${exporters[exporterIndex].fileExtension}`,
		headers: {
			"Content-Type": exporters[exporterIndex].mimeType,
			"Content-Disposition": `attachment; filename="${seqName}.${exporters[exporterIndex].fileExtension}"`
		}
	});
}
