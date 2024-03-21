import { ControlSection, ControlSectionEntry } from "../ControlSection";

// The better way to do this would be to just send a ReadableStream to the service worker,
// which it then downloads. But since Safari doesn't support transfering ReadableStreams,
// we have to do it like this, unfortunately.

export interface StreamSourceController {
	enqueue(buf: Uint8Array): void;
	close(): void;
}

export interface StreamSource {
	start(controller: StreamSourceController): void | Promise<void>;
	pull(controller: StreamSourceController): void | Promise<void>;
	cancel(): void;
}

export interface Exporter {
	name: string;
	storageTag: string;
	mimeType: string;
	fileExtension: string;
	configSchema?: ControlSectionEntry[];
	getStream(
		sampleRate: number,
		seconds: number,
		onProgress: (amount: number) => void,
		config: ControlSection | null
	): StreamSource;
}
