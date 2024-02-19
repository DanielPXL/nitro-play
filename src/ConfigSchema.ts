import * as Renderer from "./Renderer";

const schema: ConfigSchema = [
	{
		title: "Playback",
		entries: [

		]
	},
	{
		title: "Appearance",
		entries: [
			{
				text: "Piano position",
				type: "slider",
				default: 1,
				min: 0,
				max: 1,
				update: (value) => {
					Renderer.setPianoPosition(value);
				}
			},
			{
				text: "Piano height",
				type: "slider",
				default: 0.2,
				min: 0,
				max: 0.8,
				update: (value) => {
					Renderer.setPianoHeight(value);
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

type ConfigEntry = {
	text: string
} & ({
	type: "checkbox",
	default: boolean,
	update: (value: boolean) => void
} | {
	type: "slider",
	default: number,
	min: number,
	max: number,
	update: (value: number) => void
})