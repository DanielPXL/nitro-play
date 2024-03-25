import { useState } from "react";
import { Dialog } from "./Dialog";
import {
	ConfigGrid,
	ConfigGridCheckbox,
	ConfigGridNumber,
	ConfigGridSelect
} from "./ConfigGrid";
import * as classes from "./styles/ExportButton.module.css";
import * as ExportManager from "../export/ExportManager";
import * as AudioWorkerComms from "../core/AudioWorkerComms";

export function ExportButton({ disabled }) {
	const [showDialog, setShowDialog] = useState<boolean>(false);
	const [page, setPage] = useState<"config" | "start" | "progress">("config");
	const [url, setUrl] = useState<string>(null);
	const [filename, setFilename] = useState<string>(null);
	const [progress, setProgress] = useState<number>(0);

	return (
		<>
			<button
				disabled={disabled}
				onClick={() => {
					setShowDialog(true);
					setPage("config");
				}}
			>
				Export
			</button>
			<Dialog show={showDialog}>
				{page === "config" ? (
					<ConfigPage
						onReady={(url, filename) => {
							setUrl(url);
							setFilename(filename);
							setPage("start");
						}}
						onProgress={(amount) => setProgress(amount)}
						onClose={() => setShowDialog(false)}
					/>
				) : page === "start" ? (
					<a
						className={"button " + classes.startButton}
						target="_blank"
						href={url}
						// For some reason, setting the download attribute prevents the download from
						// being intercepted by the service worker in Chromium. And not setting it does
						// some weird stuff in Safari. So we only set it if we're not in Chromium.
						download={"chrome" in window ? null : filename}
						onClick={() => setPage("progress")}
					>
						Start Export
					</a>
				) : (
					<div className={classes.progressContainer}>
						<progress
							className={classes.progress}
							value={progress}
						></progress>
						<span>{(progress * 100).toFixed(2)}%</span>
					</div>
				)}
			</Dialog>
		</>
	);
}

function ConfigPage({ onReady, onProgress, onClose }) {
	const [exportAs, setExportAs] = useState<string>("Wave");
	const [sampleRate, setSampleRate] = useState<number>(48000);
	const [seconds, setSeconds] = useState<number>(60);
	const [compress, setCompress] = useState<boolean>(false);
	const [exportLoading, setExportLoading] = useState<boolean>(false);

	return (
		<>
			<ConfigGrid>
				<ConfigGridSelect
					label="Export as"
					storageTag="export_exportAs"
					defaultValue="Wave"
					options={ExportManager.exporters.map((e) => e.name)}
					onChange={(value: string) => setExportAs(value)}
				/>
				<ConfigGridNumber
					label="Sample Rate"
					storageTag="export_sampleRate"
					min={2000}
					max={96000}
					step={100}
					defaultValue={48000}
					forceRange={true}
					onChange={(value: number) => setSampleRate(value)}
				/>
				<ConfigGridNumber
					label="Seconds"
					storageTag="export_seconds"
					min={1}
					max={600}
					step={1}
					defaultValue={60}
					forceRange={false}
					onChange={(value: number) => setSeconds(value)}
				/>
				<ConfigGridCheckbox
					label="Compress"
					storageTag="export_compress"
					defaultValue={false}
					onChange={(checked: boolean) => setCompress(checked)}
				/>
			</ConfigGrid>
			<div className={classes.menuButtons}>
				<button disabled={exportLoading} onClick={() => onClose()}>
					Cancel
				</button>
				<button
					disabled={exportLoading}
					onClick={() => {
						setExportLoading(true);
						AudioWorkerComms.call("getCurrentSeqSymbol").then(
							(seq) => {
								const exporterIndex =
									ExportManager.exporters.findIndex(
										(x) => x.name === exportAs
									);

								ExportManager.prepareStreamExport(
									exporterIndex,
									sampleRate,
									seconds,
									compress,
									seq,
									onReady,
									onProgress,
									onClose
								);
							}
						);
					}}
				>
					Continue
				</button>
			</div>
		</>
	);
}
