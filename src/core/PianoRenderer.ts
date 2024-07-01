import { Audio } from "nitro-fs";

let pianoCanvas: HTMLCanvasElement;
let pianoCtx: CanvasRenderingContext2D;
let overlayCanvas: HTMLCanvasElement;
let overlayCtx: CanvasRenderingContext2D;

const notePositions: Map<Audio.Note, { x: number; y: number }> = new Map();
const noteSize = 0.7;

let drawOutOfRange: boolean = true;
const outOfRangeNoteSize = 10;

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

	// For InterpolateNoteX
	rangeBase = from;
	rangeOffset =
		Math.floor((1 / 12) * from + 1) + Math.floor((1 / 12) * (from - 5));
	if (!isWhiteKey(from)) {
		rangeOffset += 1;
	}
}

export function drawNote(
	note: Audio.Note,
	range: [Audio.Note, Audio.Note],
	volume: number,
	color: string
) {
	const middlePos = notePositions.get(note);
	if (!middlePos) {
		if (!drawOutOfRange) return;
		overlayCtx.fillStyle = color;
		if (note < range[0]) {
			//Path for a Triangle ◀
			overlayCtx.beginPath();
			overlayCtx.moveTo(outOfRangeNoteSize, overlayCanvas.height - 2);
			overlayCtx.lineTo(
				outOfRangeNoteSize,
				overlayCanvas.height - 2 - outOfRangeNoteSize
			);
			overlayCtx.lineTo(
				0,
				overlayCanvas.height - 2 - outOfRangeNoteSize / 2
			);
			overlayCtx.lineTo(outOfRangeNoteSize, overlayCanvas.height - 2);
		} else if (note > range[1]) {
			//Path for a Triangle ▶
			overlayCtx.beginPath();
			overlayCtx.moveTo(
				overlayCanvas.width - outOfRangeNoteSize,
				overlayCanvas.height - 2
			);
			overlayCtx.lineTo(
				overlayCanvas.width - outOfRangeNoteSize,
				overlayCanvas.height - 2 - outOfRangeNoteSize
			);
			overlayCtx.lineTo(
				overlayCanvas.width,
				overlayCanvas.height - 2 - outOfRangeNoteSize / 2
			);
			overlayCtx.lineTo(
				overlayCanvas.width - outOfRangeNoteSize,
				overlayCanvas.height - 2
			);
		}
		overlayCtx.fill();
		overlayCtx.closePath();
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

let rangeBase = 0;
let rangeOffset = 0;
export function interpolateNoteX(note: Audio.Note) {
	// Piano Key is the index of the key on the Piano, pretending there are no gap in the black keys
	const pianoKey = calculateNoteX(note) - rangeBase;

	return ((pianoKey - rangeOffset) * whiteKeyWidth) / 2;
}

function calculateNoteX(note: Audio.Note) {
	// Desmos View and a bit of explaination: https://www.desmos.com/calculator/40j3sx9jsq
	const noteFloor = Math.floor(note);
	// Instead of working with floors like the Desmos view, we instead take the mod 12 of note and adjust the multiplier from that
	const noteMod12 = noteFloor % 12;
	const mul1 = noteMod12 == 4 ? 1 : 0;
	const mul2 = noteMod12 == 11 ? 1 : 0;
	const multiplier = 1 + mul1 + mul2;

	const offsetBase =
		Math.floor((1 / 12) * note + 1) + Math.floor((1 / 12) * (note - 5));
	const offsetBetween = -(multiplier - 1) * noteFloor;
	const offset = offsetBase + offsetBetween;

	return multiplier * note + offset + 1;
}

export function resize(yPos: number, width: number, height: number) {
	pianoCanvas.width = width;
	pianoCanvas.height = height;
	pianoCanvas.style.top = `${yPos}px`;
	overlayCanvas.width = width;
	overlayCanvas.height = height;
	overlayCanvas.style.top = `${yPos}px`;
}

export function setDrawOutOfRange(value: boolean) {
	drawOutOfRange = value;
}
