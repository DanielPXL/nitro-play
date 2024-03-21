import { Exporter, StreamSource } from "../Exporter";
import * as AudioWorkerComms from "../../AudioWorkerComms";
import * as WaveFile from "../wave/WaveFile";
import { TarFile } from "./TarFile";

function trackBitmaskToArray(mask: number) {
	const arr: number[] = [];
	for (let i = 0; i < 16; i++) {
		if (mask & (1 << i)) {
			arr.push(i);
		}
	}
	return arr;
}

export const wavePerChannelExporter: Exporter = {
	name: "Wave (per channel)",
	storageTag: "wavePerChannel",
	mimeType: "application/x-tar",
	fileExtension: "tar",
	getStream(sampleRate, seconds, onProgress, config) {
		const numSamples = Math.floor(sampleRate * seconds);
		let i = 0;
		let tracksToExport: number[];
		let trackIndex = -1; // because we start with master.wav
		const tar = new TarFile();

		const stream: StreamSource = {
			async start(controller) {
				await AudioWorkerComms.call("startExport", { sampleRate });
				const allocatedTracks = await AudioWorkerComms.call(
					"exportFindAllocatedTracks"
				);
				tracksToExport = trackBitmaskToArray(allocatedTracks);

				const tarHeader = tar.fileHeader(
					"master.wav",
					WaveFile.getFileSize(numSamples, 2),
					new Date()
				);
				controller.enqueue(tarHeader);

				const waveHeader = WaveFile.header(numSamples, 2, sampleRate);
				controller.enqueue(tar.fileData(waveHeader));
			},
			async pull(controller) {
				const pcmBuf: Float32Array[] = await AudioWorkerComms.call(
					"exportTickUntilBuffer"
				);
				const interleavedBuf = WaveFile.interleave(pcmBuf);

				i += pcmBuf[0].length;
				if (i > numSamples) {
					// Done with the current file, strip the data that's above the size of the file
					const samplesToRemove = i - numSamples;
					const newBuf = interleavedBuf.slice(
						0,
						interleavedBuf.length - samplesToRemove * 2
					);
					const byteBuf = new Uint8Array(newBuf.buffer);

					controller.enqueue(tar.fileData(byteBuf));
					controller.enqueue(tar.fileEnd());

					if (trackIndex < tracksToExport.length - 1) {
						// Start the next track
						trackIndex++;
						await AudioWorkerComms.call("startExport", {
							sampleRate,
							activeTracks: 1 << tracksToExport[trackIndex]
						});
						i = 0;

						// Add the header for the next track
						const trackName = `track${tracksToExport[trackIndex]}.wav`;
						const tarHeader = tar.fileHeader(
							trackName,
							WaveFile.getFileSize(numSamples, 2),
							new Date()
						);
						controller.enqueue(tarHeader);

						const waveHeader = WaveFile.header(
							numSamples,
							2,
							sampleRate
						);
						controller.enqueue(tar.fileData(waveHeader));
					} else {
						// All tracks are done
						controller.enqueue(tar.tarEnd());
						controller.close();
					}
				} else {
					// Not done, add the whole buffer
					const byteBuf = new Uint8Array(interleavedBuf.buffer);

					// Assumes that the buffer is a multiple of 512 bytes (which it is, see AudioWorker)
					controller.enqueue(tar.fileData(byteBuf));
					onProgress(
						(i / numSamples + trackIndex + 1) /
							(tracksToExport.length + 1)
					);
				}
			},
			cancel() {}
		};

		return stream;
	}
};
