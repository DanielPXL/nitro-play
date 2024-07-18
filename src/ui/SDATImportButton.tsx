import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import * as classes from "./styles/ImportButton.module.css";
import * as AudioWorkerComms from "../core/AudioWorkerComms";

export function SDATImportButton({ disabled, fileChosen }) {
	const [show, setShow] = useState<boolean>(false);
	const [file, setFile] = useState<File>(null);
	const [fileStatus, setFileStatus] = useState<string>("");
	const [sdatIsImportable, setSdatIsImportable] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		setSdatIsImportable(false);
		if (!file) {
			setFileStatus("");
			return;
		}

		setFileStatus("⌛");
		setLoading(true);

		file.arrayBuffer().then((buffer) => {
			AudioWorkerComms.call("checkSdat", buffer)
				.then((numSequences) => {
					setFileStatus(`✅ ${numSequences} sequences`);
					setSdatIsImportable(true);
					setLoading(false);
				})
				.catch((err) => {
					console.error(err);
					setFileStatus(`❌ Error: ${err.message}`);
					setLoading(false);
				});
		});
	}, [file]);

	return (
		<>
			<button disabled={disabled} onClick={() => setShow(true)}>
				Import .sdat
			</button>
			<Dialog show={show}>
				<div className={classes.container}>
					<form className={classes.row}>
						<label
							className={loading ? "button disabled" : "button"}
							htmlFor="sdatFile"
						>
							Select .sdat file
						</label>
						<input
							className={classes.input}
							type="file"
							accept=".sdat"
							id="sdatFile"
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
						{/* This empty span is literally just so that the button appears on the right */}
						<span></span>
						<button
							disabled={!sdatIsImportable || loading}
							onClick={() => {
								setLoading(true);

								file.arrayBuffer().then((buffer) => {
									AudioWorkerComms.call(
										"useSdat",
										buffer
									).then(() => {
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
