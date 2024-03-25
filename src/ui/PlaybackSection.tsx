import { useEffect, useState } from "react";
import * as classes from "./styles/PlaybackSection.module.css";
import * as AudioPlayer from "../core/AudioPlayer";
import { useStorage } from "./Helpers";

export function PlaybackSection({
	loading,
	seqs,
	selectedIndex,
	onSelect,
	onPlay,
	onStop
}) {
	const [volume, setVolume] = useStorage<number>("volume", 30);
	const [isMuted, setIsMuted] = useStorage<boolean>("isMuted", false);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const hasSeq = seqs.length > 0;

	useEffect(() => {
		if (isMuted) {
			AudioPlayer.setVolume(0);
		} else {
			AudioPlayer.setVolume(volume / 10);
		}
	}, [volume, isMuted]);

	return (
		<>
			<h2>Playback</h2>
			<div className={classes.controlRow}>
				<button
					disabled={!hasSeq || isPlaying || loading}
					onClick={() =>
						onSelect(
							(selectedIndex - 1 + seqs.length) % seqs.length
						)
					}
				>
					&larr;
				</button>
				<select
					disabled={!hasSeq || isPlaying || loading}
					value={seqs[selectedIndex]}
					onChange={(e) => onSelect(e.target.selectedIndex)}
				>
					{seqs.map((seq) => (
						<option key={seq}>{seq}</option>
					))}
				</select>
				<button
					disabled={!hasSeq || isPlaying || loading}
					onClick={() =>
						onSelect(
							(selectedIndex + 1 + seqs.length) % seqs.length
						)
					}
				>
					&rarr;
				</button>
			</div>
			<div className={classes.controlRow}>
				<button
					disabled={!hasSeq || isPlaying || loading}
					onClick={() => {
						setIsPlaying(true);
						onPlay();
					}}
				>
					Play
				</button>
				<button
					disabled={!isPlaying || loading}
					onClick={() => {
						setIsPlaying(false);
						onStop();
					}}
				>
					Stop
				</button>
			</div>

			<div className={classes.volumeBarContainer}>
				<img
					className={classes.volumeIcon}
					src={getSpeakerIcon(isMuted ? 0 : volume)}
					onClick={() => setIsMuted(!isMuted)}
				/>
				<input
					className={classes.volumeBar}
					type="range"
					min="0"
					max="100"
					value={isMuted ? 0 : volume}
					onChange={(e) => {
						setIsMuted(false);
						setVolume(parseInt(e.target.value));
					}}
				/>
			</div>
		</>
	);
}

function getSpeakerIcon(volume: number) {
	if (volume === 0) {
		return new URL("../assets/speaker0.svg", import.meta.url).href;
	} else if (volume < 33) {
		return new URL("../assets/speaker1.svg", import.meta.url).href;
	} else if (volume < 66) {
		return new URL("../assets/speaker2.svg", import.meta.url).href;
	} else {
		return new URL("../assets/speaker3.svg", import.meta.url).href;
	}
}
