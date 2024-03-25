import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ControlPanel } from "./ControlPanel";
import * as classes from "./styles/ControlPanel.module.css";

export function init(load: (seq: string) => void, start: () => void) {
	const reactRoot = createRoot(document.getElementById("reactRoot")!);
	reactRoot.render(<Root load={load} start={start} />);
}

function Root({ load, start }) {
	const [controlPanelOpen, setControlPanelOpen] = useState(true);

	return (
		<>
			<ControlPanel
				show={controlPanelOpen}
				load={load}
				start={start}
				onClose={() => setControlPanelOpen(false)}
			/>
			{!controlPanelOpen && (
				<img
					className={classes.openButton}
					src={new URL("../assets/cog.svg", import.meta.url).href}
					onClick={() => setControlPanelOpen(true)}
				></img>
			)}
		</>
	);
}
