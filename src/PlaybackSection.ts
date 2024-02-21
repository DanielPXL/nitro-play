import * as AudioWorkerComms from "./AudioWorkerComms";
import * as AudioPlayer from "./AudioPlayer";
import { storagePrefix } from "./ConfigSection";

const speaker0 = new URL("./assets/speaker0.svg", import.meta.url).href;
const speaker1 = new URL("./assets/speaker1.svg", import.meta.url).href;
const speaker2 = new URL("./assets/speaker2.svg", import.meta.url).href;
const speaker3 = new URL("./assets/speaker3.svg", import.meta.url).href;

let seqLeftButton: HTMLButtonElement;
let seqSelect: HTMLSelectElement;
let seqRightButton: HTMLButtonElement;
let seqPlayButton: HTMLButtonElement;
let seqStopButton: HTMLButtonElement;
let speakerIcon: HTMLImageElement;
let volumeSlider: HTMLInputElement;

let volumeBeforeMute = 0;

export function init(load: () => Promise<void>, play: () => void, stop: () => void) {
	seqLeftButton = document.getElementById("seqLeftButton") as HTMLButtonElement;
	seqSelect = document.getElementById("seqSelect") as HTMLSelectElement;
	seqRightButton = document.getElementById("seqRightButton") as HTMLButtonElement;
	seqPlayButton = document.getElementById("seqPlayButton") as HTMLButtonElement;
	seqStopButton = document.getElementById("seqStopButton") as HTMLButtonElement;
	speakerIcon = document.getElementById("speakerIcon") as HTMLImageElement;
	volumeSlider = document.getElementById("volumeSlider") as HTMLInputElement;

	disable();

	async function loadSeq() {
		seqPlayButton.disabled = true;
		seqStopButton.disabled = true;
		seqPlayButton.disabled = true;
		seqLeftButton.disabled = true;
		seqSelect.disabled = true;
		seqRightButton.disabled = true;

		stop();
		const seq = seqSelect.value;
		await AudioWorkerComms.call("loadSeq", { name: seq });
		await load();

		seqPlayButton.disabled = false;
		seqSelect.disabled = false;

		if (seqSelect.selectedIndex === 0) {
			seqLeftButton.disabled = true;
		} else {
			seqLeftButton.disabled = false;
		}

		if (seqSelect.selectedIndex === seqSelect.options.length - 1) {
			seqRightButton.disabled = true;
		} else {
			seqRightButton.disabled = false;
		}
	}

	seqLeftButton.addEventListener("click", () => {
		seqSelect.selectedIndex = Math.max(0, seqSelect.selectedIndex - 1);
		seqSelect.dispatchEvent(new Event("change"));
	});

	seqRightButton.addEventListener("click", () => {
		seqSelect.selectedIndex = Math.min(seqSelect.options.length - 1, seqSelect.selectedIndex + 1);
		seqSelect.dispatchEvent(new Event("change"));
	});

	seqSelect.addEventListener("change", async () => {
		await loadSeq();		
	});

	seqPlayButton.addEventListener("click", () => {
		seqPlayButton.disabled = true;
		seqLeftButton.disabled = true;
		seqSelect.disabled = true;
		seqRightButton.disabled = true;
		
		play();

		seqStopButton.disabled = false;
	});

	seqStopButton.addEventListener("click", async () => {
		stop();
		await loadSeq();
	});

	volumeSlider.addEventListener("input", () => {
		changeSpeakerIcon();
		localStorage.setItem(storagePrefix + "volume", volumeSlider.value);
		AudioPlayer.setVolume((volumeSlider.valueAsNumber / 100) * 5);
	});
	volumeSlider.dispatchEvent(new Event("input"));

	speakerIcon.addEventListener("click", () => {
		if (volumeSlider.valueAsNumber === 0) {
			volumeSlider.valueAsNumber = volumeBeforeMute;
		} else {
			volumeBeforeMute = volumeSlider.valueAsNumber;
			volumeSlider.valueAsNumber = 0;
		}
		volumeSlider.dispatchEvent(new Event("input"));
	});

	const storedVolume = localStorage.getItem(storagePrefix + "volume");
	volumeSlider.value = storedVolume !== null ? storedVolume : "100";
	volumeSlider.dispatchEvent(new Event("input"));
}

export function enable(seqSymbols: string[]) {
	seqLeftButton.disabled = false;
	seqSelect.disabled = false;
	seqRightButton.disabled = false;

	seqSelect.innerHTML = "";
	for (const symbol of seqSymbols) {
		const option = document.createElement("option");
		option.value = symbol;
		option.textContent = symbol;
		seqSelect.appendChild(option);
	}

	seqSelect.dispatchEvent(new Event("change"));
}

export function disable() {
	seqLeftButton.disabled = true;
	seqSelect.disabled = true;
	seqRightButton.disabled = true;
	seqPlayButton.disabled = true;
	seqStopButton.disabled = true;

	seqSelect.innerHTML = "";
}

function changeSpeakerIcon() {
	const volume = volumeSlider.valueAsNumber;
	if (volume === 0) {
		speakerIcon.src = speaker0;
	} else if (volume < 33) {
		speakerIcon.src = speaker1;
	} else if (volume < 66) {
		speakerIcon.src = speaker2;
	} else {
		speakerIcon.src = speaker3;
	}
}