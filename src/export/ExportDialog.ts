import { ControlSection } from "../ControlSection"; 

const exporters = [
	
]

let exportDialog: HTMLDialogElement;
let controlSection: ControlSection;

export function init() {
	exportDialog = document.getElementById("exportDialog") as HTMLDialogElement;

	
}

export function show() {
	exportDialog.showModal();
}
