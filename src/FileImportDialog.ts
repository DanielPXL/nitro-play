import * as AudioWorkerComms from "./AudioWorkerComms";

let dialog: HTMLDialogElement;
let fileInput: HTMLInputElement;
let fileName: HTMLSpanElement;
let fileStatus: HTMLSpanElement;
let sdatSelect: HTMLSelectElement;
let sdatStatus: HTMLSpanElement;
let importButton: HTMLButtonElement;

let buffer: ArrayBuffer | null;

export function init(useSdatCallback: () => void) {
	dialog = document.getElementById(
		"ndsFileImportDialog"
	) as HTMLDialogElement;
	fileInput = document.getElementById("ndsFileInput") as HTMLInputElement;
	fileName = document.getElementById("ndsFileName") as HTMLSpanElement;
	fileStatus = document.getElementById("ndsImportStatus") as HTMLSpanElement;
	sdatSelect = document.getElementById("ndsSdatSelect") as HTMLSelectElement;
	sdatStatus = document.getElementById("ndsSdatStatus") as HTMLSpanElement;
	importButton = document.getElementById(
		"ndsImportButton"
	) as HTMLButtonElement;

	fileInput.addEventListener("change", async () => {
		fileName.textContent = fileInput.files![0].name;
		sdatSelect.innerHTML = "";
		sdatSelect.disabled = true;
		sdatStatus.textContent = "";
		importButton.disabled = true;
		fileStatus.textContent = "⌛";

		let possibleSdats: string[];
		try {
			buffer = await fileInput.files![0].arrayBuffer();
			possibleSdats = await AudioWorkerComms.call("parseNds", buffer);
			fileStatus.textContent = "✅";
		} catch (err) {
			fileStatus.textContent = "❌";
			console.error(err);
			buffer = null;
			sdatSelect.disabled = true;
			alert(err);
			return;
		}

		displaySdatOptions(possibleSdats);
		sdatSelect.dispatchEvent(new Event("change"));
	});

	sdatSelect.addEventListener("change", async () => {
		importButton.disabled = true;
		sdatStatus.textContent = "⌛";
		const sdatPath = sdatSelect.value;

		try {
			const numSequences = await AudioWorkerComms.call("checkSdat", {
				rom: buffer,
				path: sdatPath
			});
			sdatStatus.textContent = `✅ ${numSequences} sequences`;
		} catch (err) {
			sdatStatus.textContent = "❌";
			console.error(err);
			alert(err);
			return;
		}

		importButton.disabled = false;
	});

	importButton.addEventListener("click", async () => {
		fileInput.disabled = true;
		sdatSelect.disabled = true;
		importButton.disabled = true;

		await AudioWorkerComms.call("useSdat", {
			rom: buffer,
			path: sdatSelect.value
		});
		useSdatCallback();

		dialog.close();
	});
}

export function show() {
	fileInput.disabled = false;
	dialog.showModal();

	// Call the change event when there is already a file selected
	if (fileInput.files && fileInput.files.length > 0) {
		fileInput.dispatchEvent(new Event("change"));
	}
}

function displaySdatOptions(sdats: string[]) {
	for (const sdat of sdats) {
		const option = document.createElement("option");
		option.value = sdat;
		option.textContent = sdat;
		sdatSelect.appendChild(option);
	}

	sdatSelect.disabled = false;
}
