import * as ServiceWorkerComms from "../ServiceWorkerComms";
import { ControlSection, ControlSectionEntry } from "../ControlSection"; 
import { waveExporter } from "./WaveExporter";
import { skibidiExporter } from "./Skibidi";

const exporters = [
	waveExporter,
	skibidiExporter
]

let exportDialog: HTMLDialogElement;
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
	}
]

export function init() {
	exportDialog = document.getElementById("exportDialog") as HTMLDialogElement;
	exportDialog.addEventListener("cancel", (e) => {
		e.preventDefault();
	});

	// document.getElementById("exportCancelButton")!.addEventListener("click", () => {
	// 	exportDialog.close();
	// });

	// document.getElementById("exportContinueButton")!.addEventListener("click", () => {

	// });

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
}

export function show() {
	exportDialog.showModal();
}
