import { ControlSection, ControlSectionEntry } from "../ControlSection";

export interface Exporter {
	name: string;
	storageTag: string;
	configSchema?: ControlSectionEntry[];
	getStream(seqName: string, sampleRate: number, seconds: number, config: ControlSection): ReadableStream;
}
