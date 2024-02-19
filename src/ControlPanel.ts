import * as AudioWorkerComms from "./AudioWorkerComms";
import * as PlaybackSection from "./PlaybackSection";
import * as FileImportDialog from "./FileImportDialog";

export function init(load: () => Promise<void>, play: () => void, stop: () => void) {
	const ndsFileImportButton = document.getElementById("ndsFileImportButton") as HTMLButtonElement;

	PlaybackSection.init(async () => {
		await load();
	}, () => {
		ndsFileImportButton.disabled = true;
		play();
	}, () => {
		ndsFileImportButton.disabled = false;
		stop();
	});

	FileImportDialog.init(async () => {
		const symbols = await AudioWorkerComms.call("getSeqSymbols");
		PlaybackSection.enable(symbols);
	});

	ndsFileImportButton.addEventListener("click", () => {
		PlaybackSection.disable();
		FileImportDialog.show();
	});
}
