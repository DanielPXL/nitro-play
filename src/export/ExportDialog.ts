import * as AudioWorkerComms from "../AudioWorkerComms";
import { ControlSection, ControlSectionEntry } from "../ControlSection";
import * as ProgressStatus from "./ProgressStatus";
import { exporters, prepareStreamExport } from "./ExportManager";

let exportDialog: HTMLDialogElement;
let exportConfigContainer: HTMLDivElement;
let exportStartContainer: HTMLDivElement;
let exportStartButton: HTMLAnchorElement;

let commonControls: ControlSection;
const exportControls: (ControlSection | null)[] = [];
const exportControlSections: HTMLElement[] = [];

const commonControlsSchema: ControlSectionEntry[] = [
	{
		type: "select",
		text: "Export As",
		id: "exportAs",
		default: "Wave",
		options: exporters.map((e) => e.name),
		update(value) {
			const index = exporters.findIndex((e) => e.name === value);

			for (let i = 0; i < exportControls.length; i++) {
				if (exportControls[i]) {
					exportControlSections[i].style.display = i === index ? "" : "none";
				}
			}
		},
	},
	{
		type: "slider",
		text: "Sample Rate",
		id: "sampleRate",
		min: 2000,
		max: 96000,
		default: 48000
	},
	{
		type: "slider",
		text: "Seconds",
		id: "seconds",
		min: 1,
		max: 600,
		default: 60
	},
	{
		type: "checkbox",
		text: "Compress (as .gz)",
		id: "compress",
		default: true
	}
]

export function init() {
	exportDialog = document.getElementById("exportDialog") as HTMLDialogElement;
	exportDialog.addEventListener("cancel", (e) => {
		e.preventDefault();
	});

	exportConfigContainer = document.getElementById("exportConfigContainer") as HTMLDivElement;
	exportStartContainer = document.getElementById("exportStartContainer") as HTMLDivElement;

	document.getElementById("exportCancelButton")!.addEventListener("click", () => {
		exportDialog.close();
	});

	document.getElementById("exportContinueButton")!.addEventListener("click", async () => {
		await continueExport();
	});

	// Create the control sections for each exporter first so that they can be controlled by the common controls
	const exportControlsSection = exportDialog.querySelector("#exportControls") as HTMLElement;
	for (const exporter of exporters) {
		const section = document.createElement("section");
		exportControlsSection.appendChild(section);

		if (exporter.configSchema) {
			const controls = new ControlSection(section, exporter.name, "export_" + exporter.storageTag, exporter.configSchema);
			exportControls.push(controls);
		} else {
			exportControls.push(null);
		}

		exportControlSections.push(section);
	}

	const commonControlsSection = exportDialog.querySelector("#exportCommonControls") as HTMLElement;
	commonControls = new ControlSection(commonControlsSection, "Export", "export_common", commonControlsSchema);

	// Second part of the dialog
	exportStartButton = document.getElementById("exportStartButton") as HTMLAnchorElement;
	ProgressStatus.init();

	exportStartButton.addEventListener("click", () => {
		exportStartButton.style.display = "none";
		ProgressStatus.show();
	});
}

export function showDialog() {
	exportDialog.showModal();
	exportStartButton.setAttribute("disabled", "true");
	exportStartButton.style.display = "";
}

export function close() {
	exportDialog.close();
	exportConfigContainer.style.display = "";
	exportStartContainer.style.display = "none";
	ProgressStatus.hide();
}

export function enableStartButton(url: string, filename: string) {
	exportStartButton.removeAttribute("disabled");
	exportStartButton.href = url;

	// For some reason, setting the download attribute prevents the download from
	// being intercepted by the service worker in Chromium. And not setting it does
	// some weird stuff in Safari. So we only set it if we're not in Chromium.
	const isChromium = "chrome" in window;
	if (!isChromium) {
		exportStartButton.download = filename;
	}

	exportStartButton.style.display = "";
}

async function continueExport() {
	exportConfigContainer.style.display = "none";
	exportStartContainer.style.display = "flex";
	
	const exporterName = commonControls.get("exportAs");
	const exporterIndex = exporters.findIndex((e) => e.name === exporterName);

	const seqName = await AudioWorkerComms.call("getCurrentSeqSymbol");
	const sampleRate = commonControls.get("sampleRate");
	const seconds = commonControls.get("seconds");
	const compress = commonControls.get("compress");
	const configSection = exportControls[exporterIndex];

	ProgressStatus.reset(seconds);
	
	await prepareStreamExport(exporterIndex, sampleRate, seconds, compress, seqName, configSection);
}
