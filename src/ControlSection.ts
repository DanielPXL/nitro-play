export const storagePrefix = "nitro-play";

export type ControlSectionEntry = {
	text: string,
	id: string
} & ({
	type: "checkbox",
	default: boolean,
	update?: (value: boolean) => void
} | {
	type: "slider",
	default: number,
	min: number,
	max: number,
	integer?: boolean,
	forceRange?: boolean,
	update?: (value: number) => void
} | {
	type: "minmax",
	default: [number, number]
	integer?: boolean,
	update?: (value: [number, number]) => void
} | {
	type: "select",
	default: string,
	options: string[],
	update?: (value: string) => void
})

export class ControlSection {
	constructor(parent: HTMLElement, title: string, storageTag: string, entries: ControlSectionEntry[]) {
		this.parent = parent;
		this.storageTag = storageTag;

		this.createGrid(title, entries);
	}

	private parent: HTMLElement;
	private storageTag: string
	private values: Map<string, any> = new Map();

	public get(id: string): any {
		return this.values.get(id);
	}

	private createGrid(title: string, entries: ControlSectionEntry[]) {
		const groupDiv = document.createElement("div");

		const titleElement = document.createElement("h3");
		titleElement.textContent = title;
		groupDiv.appendChild(titleElement);

		const gridDiv = document.createElement("div");
		gridDiv.classList.add("controlGroupGrid");
		gridDiv.style.gridTemplateRows = `repeat(${entries.length + 1}, auto)`;

		for (let i = 0; i < entries.length; i++) {
			this.createEntry(entries[i], gridDiv, i);
		}

		groupDiv.appendChild(gridDiv);
		this.parent.appendChild(groupDiv);
	}

	private createEntry(entry: ControlSectionEntry, parent: HTMLElement, index: number) {
		const text = document.createElement("div");
		text.textContent = entry.text;
		text.style.gridColumn = "1";
		text.style.gridRow = (index + 1).toString();
		parent.appendChild(text);

		const controlDiv = document.createElement("div");
		controlDiv.style.gridColumn = "2";
		controlDiv.style.gridRow = (index + 1).toString();
		controlDiv.classList.add("controlEntry");

		parent.appendChild(controlDiv);

		function createResetButton(click: () => void) {
			const resetButton = document.createElement("button");
			resetButton.textContent = "⟲";
			resetButton.onclick = click;
			resetButton.style.gridColumn = "3";
			resetButton.style.gridRow = (index + 1).toString();
			parent.appendChild(resetButton);
			return resetButton;
		}

		const key = `${storagePrefix}_${this.storageTag}_${entry.id}`;
		const storedValue = localStorage.getItem(key);

		function storeValue(value: string | number | boolean) {
			localStorage.setItem(key, value.toString());
		}

		// This is bad code but I don't care
		// We need to copy this so we can use it in the function
		const thisObject = this;
		function updateEntry(value: any) {
			thisObject.values.set(entry.id, value);
			
			if (entry.update) {
				entry.update(value as never);
			}
		}

		switch (entry.type) {
			case "checkbox": {
				const checkbox = document.createElement("input");

				createResetButton(() => {
					checkbox.checked = entry.default;
					checkbox.dispatchEvent(new Event("change"));
				});

				checkbox.type = "checkbox";
				checkbox.checked = storedValue !== null ? storedValue === "true" : entry.default;
				checkbox.onchange = () => {
					storeValue(checkbox.checked);
					updateEntry(checkbox.checked);
				}

				controlDiv.appendChild(checkbox);
				updateEntry(storedValue !== null ? storedValue === "true" : entry.default);
				break;
			}

			case "slider": {
				const slider = document.createElement("input");
				const numberInput = document.createElement("input");

				createResetButton(() => {
					numberInput.value = entry.default.toString();
					numberInput.dispatchEvent(new Event("input"));
				});

				slider.type = "range";
				slider.min = entry.min.toString();
				slider.max = entry.max.toString();
				slider.step = entry.integer ? "1" : ((entry.max - entry.min) / 100).toString();
				slider.value = storedValue !== null ? storedValue : entry.default.toString();
				slider.oninput = () => {
					let value = entry.integer ? Math.round(slider.valueAsNumber) : slider.valueAsNumber;

					if (entry.forceRange) {
						if (value < entry.min) {
							value = entry.min;
						} else if (value > entry.max) {
							value = entry.max;
						}
					}

					numberInput.valueAsNumber = value;
					storeValue(value);
					updateEntry(value);
				}

				numberInput.type = "number";
				numberInput.value = storedValue !== null ? storedValue : entry.default.toString();
				numberInput.step = entry.integer ? "1" : "0.01";
				if (entry.forceRange) {
					numberInput.min = entry.min.toString();
					numberInput.max = entry.max.toString();
				}

				numberInput.oninput = () => {
					let value = entry.integer ? Math.round(numberInput.valueAsNumber) : numberInput.valueAsNumber;

					if (entry.forceRange) {
						if (value < entry.min) {
							value = entry.min;
							numberInput.valueAsNumber = value;
						} else if (value > entry.max) {
							value = entry.max;
							numberInput.valueAsNumber = value;
						}
					}

					slider.valueAsNumber = value;
					storeValue(value);
					updateEntry(value);
				}

				controlDiv.appendChild(slider);
				controlDiv.appendChild(numberInput);

				updateEntry(storedValue !== null ? +storedValue : entry.default);

				break;
			}

			case "minmax": {
				const minInput = document.createElement("input");
				const maxInput = document.createElement("input");

				createResetButton(() => {
					minInput.value = entry.default[0].toString();
					minInput.dispatchEvent(new Event("input"));
					maxInput.value = entry.default[1].toString();
					maxInput.dispatchEvent(new Event("input"));
				});

				function oninput() {
					// Thanks TypeScript (if we don't do this, entry.integer doesn't exist...)
					if (entry.type !== "minmax") {
						return;
					}

					let value: [number, number];
					if (entry.integer) {
						value = [Math.round(minInput.valueAsNumber), Math.round(maxInput.valueAsNumber)];
					} else {
						value = [minInput.valueAsNumber, maxInput.valueAsNumber];
					}

					storeValue(JSON.stringify(value));
					updateEntry(value);
				}

				minInput.type = "number";
				minInput.value = storedValue !== null ? JSON.parse(storedValue)[0] : entry.default[0].toString();
				minInput.step = entry.integer ? "1" : "0.01";
				minInput.oninput = () => {
					if (minInput.valueAsNumber > maxInput.valueAsNumber) {
						maxInput.valueAsNumber = minInput.valueAsNumber;
					}
					oninput();
				}

				maxInput.type = "number";
				maxInput.value = storedValue !== null ? JSON.parse(storedValue)[1] : entry.default[1].toString();
				maxInput.step = entry.integer ? "1" : "0.01";
				maxInput.oninput = () => {
					if (maxInput.valueAsNumber < minInput.valueAsNumber) {
						minInput.valueAsNumber = maxInput.valueAsNumber;
					}
					oninput();
				}

				controlDiv.appendChild(document.createTextNode("Min:"));
				controlDiv.appendChild(minInput);
				controlDiv.appendChild(document.createTextNode("Max:"));
				controlDiv.appendChild(maxInput);

				oninput();

				break;
			}

			case "select": {
				const select = document.createElement("select");

				createResetButton(() => {
					select.value = entry.default;
					select.dispatchEvent(new Event("change"));
				});

				for (const option of entry.options) {
					const optionElement = document.createElement("option");
					optionElement.value = option;
					optionElement.textContent = option;
					select.appendChild(optionElement);
				}

				select.value = storedValue !== null ? storedValue : entry.default;
				select.onchange = () => {
					storeValue(select.value);
					updateEntry(select.value);
				}

				controlDiv.appendChild(select);
				updateEntry(storedValue !== null ? storedValue : entry.default);
				break;
			}
		}
	}
}