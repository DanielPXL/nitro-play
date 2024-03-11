let parentDiv: HTMLDivElement;
let progressBar: HTMLProgressElement;
let progressPercentage: HTMLSpanElement;
let progressAbsolute: HTMLSpanElement;

let fullLength: number;

export function init() {
	parentDiv = document.getElementById("exportProgress") as HTMLDivElement;
	progressBar = document.getElementById("exportProgressBar") as HTMLProgressElement;
	progressPercentage = document.getElementById("exportProgressPercentage") as HTMLSpanElement;
	progressAbsolute = document.getElementById("exportProgressAbsolute") as HTMLSpanElement;

	hide();
}

export function show() {
	parentDiv.style.display = "";
}

export function hide() {
	parentDiv.style.display = "none";
}

export function reset(_fullLength: number) {
	fullLength = _fullLength;
	progressBar.value = 0;
	progressPercentage.textContent = "0%";
	progressAbsolute.textContent = "0s / " + fullLength.toFixed(2) + "s";
}

export function update(amount: number) {
	progressBar.value = amount;
	progressPercentage.textContent = (amount * 100).toFixed(2) + "%";
	progressAbsolute.textContent = (amount * fullLength).toFixed(2) + "s / " + fullLength.toFixed(2) + "s";
}
