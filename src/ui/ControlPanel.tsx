import { useState } from "react";
import * as panelClasses from "./styles/Panel.module.css";
import * as classes from "./styles/ControlPanel.module.css";
import { FileSection } from "./FileSection";
import { PlaybackSection } from "./PlaybackSection";
import * as AudioWorkerComms from "../core/AudioWorkerComms";
import { ConfigSection } from "./ConfigSection";

export function ControlPanel({ show, load, start, onClose }) {
	const [seqs, setSeqs] = useState<string[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number>(0);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [allocatedTracks, setAllocatedTracks] = useState<number>(0xffff);

	return (
		<div
			className={panelClasses.panel + " " + classes.controlPanel}
			style={show ? { display: "" } : { display: "none" }}
		>
			<button className={classes.closeButton} onClick={onClose}>
				X
			</button>
			<section className={classes.section}>
				<FileSection
					disabled={isLoading || isPlaying}
					seqLoaded={seqs.length > 0}
					fileChosen={() => {
						setSeqs([]);

						AudioWorkerComms.call("getSeqSymbols").then((s) => {
							setSeqs(s);
							setSelectedIndex(0);
							setIsLoading(true);
							load(s[0]).then(() => {
								AudioWorkerComms.call(
									"findAllocatedTracks"
								).then((t) => {
									setAllocatedTracks(t);
									setIsLoading(false);
								});
							});
						});
					}}
				/>
			</section>
			<section className={classes.section}>
				<PlaybackSection
					loading={isLoading}
					seqs={seqs}
					selectedIndex={selectedIndex}
					onSelect={(index: number) => {
						setSelectedIndex(index);
						setIsLoading(true);
						load(seqs[index]).then(() => {
							AudioWorkerComms.call("findAllocatedTracks").then(
								(t) => {
									setAllocatedTracks(t);
									setIsLoading(false);
								}
							);
						});
					}}
					onPlay={() => {
						setIsPlaying(true);
						start();
						document.title = `NitroPlay 🎵 ${seqs[selectedIndex]}`;
					}}
					onStop={() => {
						setIsPlaying(false);
						// Loading stops playback
						setIsLoading(true);
						load(seqs[selectedIndex]).then(() => {
							AudioWorkerComms.call("findAllocatedTracks").then(
								(t) => {
									setAllocatedTracks(t);
									setIsLoading(false);
								}
							);
						});
						document.title = "NitroPlay";
					}}
				/>
			</section>
			<section className={classes.section}>
				<ConfigSection allocatedTracks={allocatedTracks} />
			</section>
		</div>
	);
}
