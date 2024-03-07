import { createEntry } from "../ConfigSection";

let exportDialog: HTMLDialogElement;

export function init() {
	exportDialog = document.getElementById("exportDialog") as HTMLDialogElement;
}

export function show() {
	exportDialog.showModal();
}
