import { ControlSectionEntry } from "../ControlSection";

abstract class Exporter {
	abstract configSchema: ControlSectionEntry[];
	abstract getStream(): ReadableStream;
}
