import { useEffect, useRef } from "react";
import * as panelClasses from "./styles/Panel.module.css";
import * as classes from "./styles/Dialog.module.css";

export function Dialog({ show, children }) {
	const dialog = useRef<HTMLDialogElement>();

	useEffect(() => {
		if (show) {
			dialog.current.showModal();
		} else {
			dialog.current.close();
		}
	}, [show]);

	return (
		<dialog
			ref={dialog}
			className={panelClasses.panel + " " + classes.dialog}
			onCancel={(e) => e.preventDefault()}
		>
			{children}
		</dialog>
	);
}
