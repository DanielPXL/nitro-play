import * as Renderer from "./Renderer";

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
			}, {
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
]

export default schema;

export type ConfigSchema = {
	title: string,
	entries: ConfigEntry[]
}[]

export type ConfigEntry = {
	text: string,
	id: string
} & ({
	type: "checkbox",
	default: boolean,
	update: (value: boolean) => void
} | {
	type: "slider",
	default: number,
	min: number,
	max: number,
	integer?: boolean,
	forceRange?: boolean,
	update: (value: number) => void
} | {
	type: "minmax",
	default: [number, number]
	integer?: boolean,
	update: (value: [number, number]) => void
})