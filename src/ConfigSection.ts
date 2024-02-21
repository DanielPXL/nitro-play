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
				slider.value = entry.default.toString();
				slider.dispatchEvent(new Event("input"));
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
				
				slider.valueAsNumber = value;
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
	}
}