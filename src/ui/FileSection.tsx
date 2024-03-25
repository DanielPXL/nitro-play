import { ExportButton } from "./ExportButton";
import { NDSImportButton } from "./NDSImportButton";

export function FileSection({ disabled, seqLoaded, fileChosen }) {
	return (
		<>
			<h2>File</h2>
			<NDSImportButton disabled={disabled} fileChosen={fileChosen} />
			<ExportButton disabled={disabled || !seqLoaded} />
		</>
	);
}
