import {
	ConfigGrid,
	ConfigGridCheckbox,
	ConfigGridMinMax,
	ConfigGridNumber
} from "./ConfigGrid";
import * as Renderer from "../core/Renderer";
import { Collapsible } from "./Collapsible";

export function ConfigSection() {
	return (
		<>
			<h2>Configuration</h2>
			<section>
				<Collapsible title="Appearance">
					<ConfigGrid>
						<ConfigGridCheckbox
							label="Align notes to piano"
							storageTag="alignNotesToPiano"
							defaultValue={true}
							onChange={(checked: boolean) =>
								Renderer.alignNotesToPiano(checked)
							}
						/>
						<ConfigGridNumber
							label="Piano position"
							storageTag="pianoPosition"
							min={0}
							max={1}
							step={0.01}
							defaultValue={0.8}
							forceRange={false}
							onChange={(value: number) =>
								Renderer.setPianoPosition(value)
							}
						/>
						<ConfigGridNumber
							label="Piano height"
							storageTag="pianoHeight"
							min={0}
							max={1}
							step={0.01}
							defaultValue={0.12}
							forceRange={false}
							onChange={(value: number) =>
								Renderer.setPianoHeight(value)
							}
						/>
						<ConfigGridMinMax
							label="Piano range"
							storageTag="pianoRange"
							defaultValue={[0, 119]}
							step={1}
							onChange={(value: [number, number]) =>
								Renderer.setPianoRange(value)
							}
						/>
					</ConfigGrid>
				</Collapsible>
			</section>
		</>
	);
}
