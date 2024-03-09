import { Exporter } from "./Exporter";
import { ControlSectionEntry } from "../ControlSection";

export const skibidiExporter: Exporter = {
	name: "Skibidi",
	storageTag: "skibidi",
	configSchema: [
		{
			type: "checkbox",
			text: "Skibidi",
			id: "skibidi",
			default: true
		}
	],
	getStream(seqName, sampleRate, seconds, config) {
		let i = 0;

		const stream = new ReadableStream({
			start(controller) {
				console.log("Start");

				controller.enqueue(new Uint8Array([0x00, 0x01, 0x02, 0x01]));
			},
			pull(controller) {
				console.log("Pull");

				const buf = new Uint8Array(1024);
				for (let o = 0; o < buf.length; o++) {
					buf[o] = Math.floor(Math.random() * 256);
					i++;

					if (i > 1024 * 1024 * 1024) {
						controller.close();
						return;
					}
				}
				controller.enqueue(buf);
			},
			cancel() {
				console.log("Cancelled");
			}
		});

		return stream;
	}
}