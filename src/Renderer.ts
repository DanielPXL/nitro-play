import * as StateManager from "./StateManager";
import * as AudioPlayer from "./AudioPlayer";
import { Audio } from "nitro-fs"
import * as PianoRenderer from "./PianoRenderer";
import { TimelineRenderer } from "./TimelineRenderer";

let noteRange: [Audio.Note, Audio.Note] = [Audio.Note.CNegative1, Audio.Note.B8];
let pianoHeight = 0.1;
let pianoPosition = 0.7;

let colors = Array.from({ length: 16 }, (_, i) => `hsl(${i * 360 / 16}, 100%, 50%)`);

let topTimeline: TimelineRenderer; 
let bottomTimeline: TimelineRenderer;

let topTime = 1.5;
let bottomTime = -1;
let bottomSameSpeed = true;

export function init() {
	PianoRenderer.init();

	topTimeline = new TimelineRenderer(document.getElementById("topTimelineCanvas") as HTMLCanvasElement);
	bottomTimeline = new TimelineRenderer(document.getElementById("bottomTimelineCanvas") as HTMLCanvasElement);

	addEventListener("resize", resize);
	resize();

	requestAnimationFrame(render);
}

export function resize() {
	const pianoHeightPixels = pianoHeight * window.innerHeight;
	topTimeline.resize(0, window.innerWidth, window.innerHeight * pianoPosition);

	PianoRenderer.resize(pianoPosition * window.innerHeight, window.innerWidth, pianoHeightPixels);
	PianoRenderer.drawKeys(noteRange[0], noteRange[1]);
	
	const bottomHeight = window.innerHeight * (1 - pianoPosition) - pianoHeightPixels;
	bottomTimeline.resize(window.innerHeight * pianoPosition + pianoHeightPixels, window.innerWidth, bottomHeight);
	
	// Same speed
	if (bottomSameSpeed) {
		const topSpeed = topTime / (window.innerHeight * pianoPosition);
		bottomTime = -bottomHeight * topSpeed;
	}
}

function render(time: DOMHighResTimeStamp) {
	if (true) {
		topTimeline.draw(colors, AudioPlayer.getTime(), noteRange, [0, topTime]);
		bottomTimeline.draw(colors, AudioPlayer.getTime(), noteRange, [bottomTime, 0]);
		
		const state = StateManager.getState(AudioPlayer.getTime());
		if (state) {
			PianoRenderer.clearNotes();
			for (let i = 0; i < state.channels.length; i++) {
				const channel = state.channels[i];
				for (const note of channel.playing) {
					if (note.state === Audio.EnvelopeState.Release) {
						continue;
					}

					PianoRenderer.drawNote(Math.round(note.note), note.volume, colors[i]);
				}
			}
		}
	}

	requestAnimationFrame(render);
}

export function setPianoPosition(position: number) {
	pianoPosition = position;
	resize();
}

export function setPianoHeight(height: number) {
	pianoHeight = height;
	resize();
}

export function alignNotesToPiano(value: boolean) {
	TimelineRenderer.alignNotesToPiano(value);
}

export function setPianoRange(value: [number, number]) {
	noteRange = value;
	PianoRenderer.drawKeys(noteRange[0], noteRange[1]);
}