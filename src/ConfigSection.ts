import ConfigSchema, { ConfigEntry } from "./ConfigSchema"

export const storagePrefix = "nitro-play_config_";

let configSection: HTMLDivElement;

export function init() {
	configSection = document.getElementById("config") as HTMLDivElement;

	for (const configGroup of ConfigSchema) {
		const groupDiv = document.createElement("div");
		groupDiv.classList.add("configGroup");

		const title = document.createElement("h3");
		title.textContent = configGroup.title;
		groupDiv.appendChild(title);

		const gridDiv = document.createElement("div");
		gridDiv.classList.add("configGroupGrid");
		gridDiv.style.gridTemplateRows = `repeat(${configGroup.entries.length + 1}, auto)`;

		for (let i = 0; i < configGroup.entries.length; i++) {
			createEntry(configGroup.entries[i], gridDiv, i);
		}

		groupDiv.appendChild(gridDiv);
		configSection.appendChild(groupDiv);
	}
}

function createEntry(entry: ConfigEntry, parent: HTMLElement, index: number) {
	const text = document.createElement("div");
	text.textContent = entry.text;
	text.style.gridColumn = "1";
	text.style.gridRow = (index + 1).toString();
	parent.appendChild(text);

	const controlDiv = document.createElement("div");
	controlDiv.style.gridColumn = "2";
	controlDiv.style.gridRow = (index + 1).toString();
	controlDiv.classList.add("configControl");

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

	const storedValue = localStorage.getItem(storagePrefix + entry.id);

	function storeValue(value: string | number | boolean) {
		localStorage.setItem(storagePrefix + entry.id, value.toString());
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
				entry.update(checkbox.checked);
			}
			
			controlDiv.appendChild(checkbox);
			entry.update(storedValue !== null ? storedValue === "true" : entry.default);
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
				entry.update(value);
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
				entry.update(value);
			}

			controlDiv.appendChild(slider);
			controlDiv.appendChild(numberInput);

			entry.update(storedValue !== null ? +storedValue : entry.default);

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
				entry.update(value);
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
	}
}