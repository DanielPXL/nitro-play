import { Audio } from "nitro-fs";

let pianoCanvas: HTMLCanvasElement;
let pianoCtx: CanvasRenderingContext2D;
let overlayCanvas: HTMLCanvasElement;
let overlayCtx: CanvasRenderingContext2D;

let rangeFrom: Audio.Note;
let rangeTo: Audio.Note;
const notePositions: Map<Audio.Note, { x: number; y: number }> = new Map();
const noteSize = 0.7;

let drawOutOfRange: Boolean = true;
const OutOfRangeNoteSize = 10;

let whiteKeyWidth: number;
let blackKeyWidth: number;

export function init() {
	pianoCanvas = document.getElementById("pianoCanvas") as HTMLCanvasElement;
	pianoCtx = pianoCanvas.getContext("2d", { alpha: false })!;
	overlayCanvas = document.getElementById(
		"pianoOverlayCanvas"
	) as HTMLCanvasElement;
	overlayCtx = overlayCanvas.getContext("2d")!;
}

export function drawKeys(from: Audio.Note, to: Audio.Note) {
	notePositions.clear();
	rangeFrom = from;
	rangeTo = to;
	pianoCtx.clearRect(0, 0, pianoCanvas.width, pianoCanvas.height);

	let numWhiteKeys = 0;
	for (let note = from; note <= to; note++) {
		if (isWhiteKey(note)) {
			numWhiteKeys++;
		}
	}

	whiteKeyWidth = pianoCanvas.width / numWhiteKeys;
	blackKeyWidth = whiteKeyWidth / 2;
	let whiteKeyIndex = 0;
	for (let note = from; note <= to; note++) {
		if (isWhiteKey(note)) {
			pianoCtx.fillStyle = "white";
			pianoCtx.fillRect(
				whiteKeyIndex * whiteKeyWidth,
				0,
				whiteKeyWidth,
				pianoCanvas.height
			);
			pianoCtx.strokeStyle = "black";
			pianoCtx.lineWidth = 2;
			pianoCtx.strokeRect(
				whiteKeyIndex * whiteKeyWidth,
				0,
				whiteKeyWidth,
				pianoCanvas.height
			);

			const x = whiteKeyIndex * whiteKeyWidth + whiteKeyWidth / 2;
			const y = pianoCanvas.height * 0.8;
			notePositions.set(note, { x, y });

			whiteKeyIndex++;
		}
	}

	whiteKeyIndex = 0;
	for (let note = from; note <= to; note++) {
		if (isWhiteKey(note)) {
			whiteKeyIndex++;
		} else {
			pianoCtx.fillStyle = "black";
			pianoCtx.fillRect(
				whiteKeyIndex * whiteKeyWidth - blackKeyWidth / 2,
				0,
				blackKeyWidth,
				pianoCanvas.height * 0.6
			);

			const x = whiteKeyIndex * whiteKeyWidth;
			const y = pianoCanvas.height * 0.5;
			notePositions.set(note, { x, y });
		}
	}
}

export function drawNote(note: Audio.Note, volume: number, color: string) {
	const middlePos = notePositions.get(note);
	if (!middlePos) {
		if(!drawOutOfRange)
			return;
		overlayCtx.fillStyle = color;
		if(note < rangeFrom){
			//Path for a Triangle ◀
			overlayCtx.beginPath();
			overlayCtx.moveTo(OutOfRangeNoteSize, overlayCanvas.height - 2);
			overlayCtx.lineTo(OutOfRangeNoteSize, overlayCanvas.height - 2 - OutOfRangeNoteSize);
			overlayCtx.lineTo(0, overlayCanvas.height - 2 - (OutOfRangeNoteSize / 2));
			overlayCtx.lineTo(OutOfRangeNoteSize, overlayCanvas.height - 2);
		}else if(note > rangeTo){
			//Path for a Triangle ▶
			overlayCtx.beginPath();
			overlayCtx.moveTo(overlayCanvas.width - OutOfRangeNoteSize, overlayCanvas.height - 2);
			overlayCtx.lineTo(overlayCanvas.width - OutOfRangeNoteSize, overlayCanvas.height - 2 - OutOfRangeNoteSize);
			overlayCtx.lineTo(overlayCanvas.width, overlayCanvas.height - 2 - (OutOfRangeNoteSize / 2));
			overlayCtx.lineTo(overlayCanvas.width - OutOfRangeNoteSize, overlayCanvas.height - 2);
		}
		overlayCtx.fill();
		overlayCtx.closePath()
		return;
	}

	const sidelength = isWhiteKey(note)
		? whiteKeyWidth * noteSize * volume
		: blackKeyWidth * noteSize * volume;
	const x = middlePos.x - sidelength / 2;
	const y = middlePos.y - sidelength / 2;

	overlayCtx.fillStyle = color;
	overlayCtx.fillRect(x, y, sidelength, sidelength);
}

export function clearNotes() {
	overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

export function isWhiteKey(note: Audio.Note) {
	// Make sure it's positive
	note += 12 * 100;

	const noteIndex = note % 12;
	return (
		noteIndex === 0 ||
		noteIndex === 2 ||
		noteIndex === 4 ||
		noteIndex === 5 ||
		noteIndex === 7 ||
		noteIndex === 9 ||
		noteIndex === 11
	);
}

export function interpolateNoteX(note: Audio.Note) {
	// TODO: Think of a better way to do this
	const lowerNote = Math.floor(note);
	const noteMod1 = note - lowerNote;

	const lowerPos = notePositions.get(lowerNote);
	const upperPos = notePositions.get(lowerNote + 1);
	if (!lowerPos || !upperPos) {
		return Infinity;
	}

	return lerp(lowerPos.x, upperPos.x, noteMod1);
}

function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

export function resize(yPos: number, width: number, height: number) {
	pianoCanvas.width = width;
	pianoCanvas.height = height;
	pianoCanvas.style.top = `${yPos}px`;
	overlayCanvas.width = width;
	overlayCanvas.height = height;
	overlayCanvas.style.top = `${yPos}px`;
}

export function setDrawOutOfRange(value: boolean){
	drawOutOfRange = value;
}
