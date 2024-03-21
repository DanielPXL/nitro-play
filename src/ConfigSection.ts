import { ControlSection, ControlSectionEntry } from "./ControlSection";
import * as Renderer from "./Renderer";

export function init() {
	const configSection = document.getElementById("config") as HTMLDivElement;

	for (const configGroup of schema) {
		new ControlSection(
			configSection,
			configGroup.title,
			"config",
			configGroup.entries
		);
	}
}

const schema: ConfigSchema = [
	{
		title: "Appearance",
		entries: [
			{
				text: "Align notes to piano",
				id: "alignNotesToPiano",
				type: "checkbox",
				default: true,
				update: (value) => {
					Renderer.alignNotesToPiano(value);
				}
			},
			{
				text: "Piano position",
				id: "pianoPosition",
				type: "slider",
				default: 0.7,
				min: 0,
				max: 1,
				forceRange: true,
				update: (value) => {
					Renderer.setPianoPosition(value);
				}
			},
			{
				text: "Piano height",
				id: "pianoHeight",
				type: "slider",
				default: 0.1,
				min: 0,
				max: 0.8,
				update: (value) => {
					Renderer.setPianoHeight(value);
				}
			},
			{
				text: "Piano range",
				id: "pianoRange",
				type: "minmax",
				default: [0, 119],
				integer: true,
				update: (value) => {
					Renderer.setPianoRange(value);
				}
			}
		]
	}
];

type ConfigSchema = {
	title: string;
	entries: ControlSectionEntry[];
}[];
