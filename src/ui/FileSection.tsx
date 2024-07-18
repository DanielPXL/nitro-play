import { ExportButton } from "./ExportButton";
import { NDSImportButton } from "./NDSImportButton";
import { SDATImportButton } from "./SDATImportButton";
import * as classes from "./styles/FileSection.module.css";

export function FileSection({ disabled, seqLoaded, fileChosen }) {
	return (
		<>
			<h2>File</h2>
			<div className={classes.importButtons}>
				<NDSImportButton disabled={disabled} fileChosen={fileChosen} />
				<SDATImportButton disabled={disabled} fileChosen={fileChosen} />
			</div>
			<ExportButton disabled={disabled || !seqLoaded} />
		</>
	);
}
