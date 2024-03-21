import { Queue } from "./Queue";

const sampleRate = 48000;

export let ctx: AudioContext;
let gain: GainNode;
let supposedGain = 1;

export let startedBuffers: Queue<AudioBufferSourceNode> = new Queue();
export let queuedBuffers: Queue<AudioBufferSourceNode> = new Queue();

let bufferTime = 0;
let startTime = 0;

let running = false;

export function init() {
	ctx = new AudioContext();
	gain = ctx.createGain();
	gain.connect(ctx.destination);
	gain.gain.value = supposedGain;
}

export function addPCM(data: Float32Array[]) {
	const audioBuffer = ctx.createBuffer(
		data.length,
		data[0].length,
		sampleRate
	);
	for (let i = 0; i < data.length; i++) {
		audioBuffer.copyToChannel(data[i], i);
	}

	const source = ctx.createBufferSource();
	source.buffer = audioBuffer;
	source.connect(gain);

	if (running) {
		startBuffer(source);
	} else {
		queuedBuffers.enqueue(source);
	}
}

function startBuffer(source: AudioBufferSourceNode) {
	let time: number;
	if (startedBuffers.isEmpty()) {
		time = ctx.currentTime;
		bufferTime = time;
	} else {
		time = bufferTime;
	}

	source.start(time);
	bufferTime += source.buffer!.duration;

	startedBuffers.enqueue(source);
	source.addEventListener("ended", () => {
		startedBuffers.remove((s) => s === source);
	});
}

export function start() {
	if (running) {
		return;
	}
	running = true;
	startTime = ctx.currentTime;

	while (!queuedBuffers.isEmpty()) {
		startBuffer(queuedBuffers.dequeue()!);
	}
}

export function stop() {
	running = false;

	while (!startedBuffers.isEmpty()) {
		startedBuffers.dequeue()!.stop();
	}

	while (!queuedBuffers.isEmpty()) {
		queuedBuffers.dequeue();
	}
}

export function isRunning() {
	return running;
}

export function getBufferHealth() {
	if (running) {
		return bufferTime - ctx.currentTime;
	} else {
		let time = 0;
		const it = queuedBuffers.array();
		for (let i = 0; i < it.length; i++) {
			time += it[i].buffer!.duration;
		}
		return time;
	}
}

export function getTime() {
	return running ? ctx.currentTime - startTime : 0;
}

export function setVolume(volume: number) {
	if (ctx === undefined) {
		supposedGain = volume;
		return;
	}

	gain.gain.value = volume;
}
