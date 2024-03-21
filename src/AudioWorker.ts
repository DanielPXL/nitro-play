import { NitroFS, BufferReader, Audio } from "nitro-fs";
import { SynthState, createSynthState } from "./SynthState";

const handlers: Map<string, (data: any) => void> = new Map();
const callables: Map<string, (data: any) => void> = new Map();

onmessage = (e) => {
	if (handlers.has(e.data.type)) {
		handlers.get(e.data.type)!(e.data.data);
	}
};

handlers.set("call", (data) => {
	if (callables.has(data.type)) {
		try {
			const result = callables.get(data.type)!(data.data);
			postMessage({
				type: "call",
				data: { id: data.id, data: { data: result } }
			});
		} catch (err) {
			postMessage({
				type: "call",
				data: { id: data.id, data: { err: err } }
			});
		}
	}
});

let sdat: Audio.SDAT;

callables.set("parseNds", (data) => {
	const fs = NitroFS.fromRom(data);

	// Recursively search for .sdat files
	let sdats: string[] = [];
	function look(path: string) {
		const { files, directories } = fs.readDir(path);
		for (const file of files) {
			if (file.endsWith(".sdat")) {
				if (path === "") {
					sdats.push(file);
				} else {
					sdats.push(path + "/" + file);
				}
			}
		}

		for (const dir of directories) {
			if (path === "") {
				look(dir);
			} else {
				look(path + "/" + dir);
			}
		}
	}

	look("");

	return sdats;
});

callables.set("checkSdat", (data) => {
	const fs = NitroFS.fromRom(data.rom);
	const sdatBuffer = BufferReader.new(fs.readFile(data.path));

	const sdat = new Audio.SDAT(sdatBuffer);
	return sdat.fs.sequences.length;
});

callables.set("useSdat", (data) => {
	const fs = NitroFS.fromRom(data.rom);
	const sdatBuffer = BufferReader.new(fs.readFile(data.path));

	sdat = new Audio.SDAT(sdatBuffer);
});

callables.set("getSeqSymbols", (data) => {
	return sdat.fs.sequences.map((seq) => (seq.name ? seq.name : `#${seq.id}`));
});

let curSeqSymbol: string;
let renderer: Audio.SequenceRenderer;

callables.set("loadSeq", (data) => {
	curSeqSymbol = data.name;
	renderer = new Audio.SequenceRenderer({
		file: Audio.SequenceRenderer.makeInfoSSEQ(
			sdat,
			data.name.startsWith("#") ? parseInt(data.name.slice(1)) : data.name
		),
		sampleRate: 48000,
		sink(buffer) {
			postMessage({ type: "pcm", data: buffer });
		},
		bufferLength: 1024 * 16
	});
});

callables.set("getCurrentSeqSymbol", (data) => {
	return curSeqSymbol;
});

callables.set("tickSeconds", (data) => {
	const states: SynthState[] = Array(
		Math.ceil((48000 * data.seconds) / renderer.samplesPerTick)
	);
	let o = 0;
	for (let i = 0; i < 48000 * data.seconds; i += renderer.samplesPerTick) {
		renderer.tick();
		states[o] = createSynthState(renderer);
		o++;
	}

	return states;
});

let exportRenderer: Audio.SequenceRenderer;
let exportBuffer: Float32Array[] | null = null;

callables.set("startExport", (data) => {
	exportRenderer = new Audio.SequenceRenderer({
		file: Audio.SequenceRenderer.makeInfoSSEQ(
			sdat,
			(curSeqSymbol.startsWith("#")
				? parseInt(curSeqSymbol.slice(1))
				: curSeqSymbol) as any
		),
		sampleRate: data.sampleRate,
		sink(buffer) {
			// Copy the buffers so they don't get overwritten
			exportBuffer = [];
			for (let i = 0; i < buffer.length; i++) {
				exportBuffer.push(buffer[i].slice());
			}
		},
		bufferLength: 1024 * 16,
		activeTracks: data.activeTracks ? data.activeTracks : 0xffff
	});
});

callables.set("exportTickUntilBuffer", (data) => {
	while (exportBuffer === null) {
		exportRenderer.tick();
	}

	const buffer = exportBuffer;
	exportBuffer = null;
	return buffer;
});

callables.set("exportFindAllocatedTracks", (data) => {
	let tracks = 0xffff;
	const cmd = exportRenderer.commands[0];
	if (cmd instanceof Audio.Commands.AllocateTracks) {
		tracks = cmd.tracks;
	}

	return tracks;
});
