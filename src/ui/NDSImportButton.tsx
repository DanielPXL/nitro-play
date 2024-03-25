import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import * as classes from "./styles/NDSImportButton.module.css";
import * as AudioWorkerComms from "../core/AudioWorkerComms";

export function NDSImportButton({ disabled, fileChosen }) {
	const [show, setShow] = useState<boolean>(false);
	const [file, setFile] = useState<File>(null);
	const [fileStatus, setFileStatus] = useState<string>("");
	const [possibleSdats, setPossibleSdats] = useState<string[]>([]);
	const [selectedSdat, setSelectedSdat] = useState<string>(null);
	const [sdatStatus, setSdatStatus] = useState<string>("");
	const [sdatIsImportable, setSdatIsImportable] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		if (!file) {
			setFileStatus("");
			return;
		}

		setSelectedSdat(null);
		setFileStatus("⌛");
		setLoading(true);

		file.arrayBuffer().then((buffer) => {
			AudioWorkerComms.call("parseNds", buffer)
				.then((possibleSdats) => {
					setFileStatus(`✅ ${possibleSdats.length} SDATs found`);
					setPossibleSdats(possibleSdats);
					setSelectedSdat(possibleSdats[0]);
					setLoading(false);
				})
				.catch((err) => {
					console.error(err);
					setFileStatus(`❌ Error: ${err.message}`);
					setPossibleSdats([]);
					setSelectedSdat(null);
					setLoading(false);
				});
		});
	}, [file]);

	useEffect(() => {
		setSdatIsImportable(false);
		setSdatStatus("");
		if (!selectedSdat) {
			return;
		}

		setSdatStatus("⌛");
		setLoading(true);

		file.arrayBuffer().then((buffer) => {
			AudioWorkerComms.call("checkSdat", {
				rom: buffer,
				path: selectedSdat
			})
				.then((numSequences) => {
					setSdatStatus(`✅ ${numSequences} sequences`);
					setSdatIsImportable(true);
					setLoading(false);
				})
				.catch((err) => {
					console.error(err);
					setSdatStatus(`❌ Error: ${err.message}`);
					setLoading(false);
				});
		});
	}, [selectedSdat]);

	return (
		<>
			<button disabled={disabled} onClick={() => setShow(true)}>
				Import .nds
			</button>
			<Dialog show={show}>
				<div className={classes.container}>
					<form className={classes.row}>
						<label
							className={loading ? "button disabled" : "button"}
							htmlFor="ndsFile"
						>
							Select .nds file
						</label>
						<input
							className={classes.input}
							type="file"
							accept=".nds"
							id="ndsFile"
							onChange={(e) => {
								if (e.target.files.length > 0) {
									setFile(e.target.files[0]);
								}
							}}
						></input>
						{file ? (
							<>
								<span>{file.name}</span>
								<span>{fileStatus}</span>
							</>
						) : null}
					</form>

					<div className={classes.row}>
						<select
							disabled={possibleSdats.length == 0 || loading}
							onChange={(e) => setSelectedSdat(e.target.value)}
						>
							{possibleSdats.map((sdat) => (
								<option key={sdat}>{sdat}</option>
							))}
						</select>
						<span>{sdatStatus}</span>
						<button
							disabled={!sdatIsImportable || loading}
							onClick={() => {
								setLoading(true);

								file.arrayBuffer().then((buffer) => {
									AudioWorkerComms.call("useSdat", {
										rom: buffer,
										path: selectedSdat
									}).then(() => {
										fileChosen();
										setShow(false);
										setLoading(false);
									});
								});
							}}
						>
							Import
						</button>
					</div>
				</div>
			</Dialog>
		</>
	);
}
