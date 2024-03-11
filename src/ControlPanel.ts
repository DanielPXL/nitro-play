import * as AudioWorkerComms from "./AudioWorkerComms";
import * as PlaybackSection from "./PlaybackSection";
import * as FileImportDialog from "./FileImportDialog";
import * as ExportDialog from "./export/ExportDialog";
import * as ConfigSection from "./ConfigSection";

export function init(load: () => Promise<void>, play: () => void, stop: () => void) {
	const controlPanel = document.getElementById("controlPanel") as HTMLDivElement;
	const openButton = document.getElementById("openButton") as HTMLImageElement;
	const closeButton = document.getElementById("closeButton") as HTMLButtonElement;
	const ndsFileImportButton = document.getElementById("ndsFileImportButton") as HTMLButtonElement;
	const exportButton = document.getElementById("exportButton") as HTMLButtonElement;

	PlaybackSection.init(async () => {
		ndsFileImportButton.disabled = true;
		exportButton.disabled = true;
		await load();
		ndsFileImportButton.disabled = false;
		exportButton.disabled = false;
	}, () => {
		ndsFileImportButton.disabled = true;
		exportButton.disabled = true;
		play();
	}, () => {
		ndsFileImportButton.disabled = false;
		exportButton.disabled = false;
		stop();
	});

	FileImportDialog.init(async () => {
		const symbols = await AudioWorkerComms.call("getSeqSymbols");
		PlaybackSection.enable(symbols);
	});

	ndsFileImportButton.addEventListener("click", () => {
		exportButton.disabled = true;
		PlaybackSection.disable();
		FileImportDialog.show();
	});

	ExportDialog.init();

	exportButton.disabled = true;
	exportButton.addEventListener("click", () => {
		ExportDialog.showDialog();
	});

	ConfigSection.init();

	openButton.style.display = "none";
	openButton.addEventListener("click", () => {
		controlPanel.style.display = "block";
	});

	closeButton.addEventListener("click", () => {
		controlPanel.style.display = "none";
		openButton.style.display = "block";
	});
}
