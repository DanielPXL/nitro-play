import { Exporter, StreamSource } from "../Exporter";
import * as AudioWorkerComms from "../../AudioWorkerComms";
import * as WaveFile from "./WaveFile";

export const waveExporter: Exporter = {
	name: "Wave",
	storageTag: "wave",
	mimeType: "audio/wav",
	fileExtension: "wav",
	getStream(sampleRate, seconds, onProgress, config) {
		const numSamples = Math.floor(sampleRate * seconds);
		let i = 0;

		const stream: StreamSource = {
			start(controller) {
				AudioWorkerComms.call("startExport", { sampleRate });
				const waveHeader = WaveFile.header(numSamples, 2, sampleRate);
				controller.enqueue(waveHeader);
			},
			async pull(controller) {
				const pcmBuf: Float32Array[] = await AudioWorkerComms.call(
					"exportTickUntilBuffer"
				);
				const interleavedBuf = WaveFile.interleave(pcmBuf);

				i += pcmBuf[0].length;
				if (i > numSamples) {
					// Done, strip the data that's above the size of the file
					const samplesToRemove = i - numSamples;
					const newBuf = interleavedBuf.slice(
						0,
						interleavedBuf.length - samplesToRemove * 2
					);
					const byteBuf = new Uint8Array(newBuf.buffer);

					controller.enqueue(byteBuf);
					controller.close();
				} else {
					// Not done, add the whole buffer
					const byteBuf = new Uint8Array(interleavedBuf.buffer);
					controller.enqueue(byteBuf);
					onProgress(i / numSamples);
				}
			},
			cancel() {}
		};

		return stream;
	}
};
