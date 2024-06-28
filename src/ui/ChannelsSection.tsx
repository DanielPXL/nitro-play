import { useEffect } from "react";
import { repeat, useStorage } from "./Helpers";
import * as classes from "./styles/ChannelsSection.module.css";
import * as AudioWorkerComms from "../core/AudioWorkerComms";
import * as Renderer from "../core/Renderer";
import { Color, ColorPicker, HSVtoRGB, roundColor } from "./ColorPicker";

// TODO: Make some nice icons for this instead of text
export function ChannelsSection({ allocatedTracks }) {
	return (
		<div className={classes.container}>
			<div>Some of these settings may take a few seconds to apply.</div>
			<div className={classes.grid}>
				<div>Channel</div>
				<div className={classes.rightAlign}>Color</div>
				<div className={classes.rightAlign}>Sound</div>
				<div className={classes.rightAlign}>Top</div>
				<div className={classes.rightAlign}>Piano</div>
				<div className={classes.rightAlign}>Bottom</div>
				<div></div>
				{repeat(16, (i) => (
					<ChannelRow
						key={i}
						id={i}
						disabled={((1 << i) & allocatedTracks) === 0}
					/>
				))}
			</div>
		</div>
	);
}

function ChannelRow({ id, disabled }) {
	const [color, setColor] = useStorage<Color>(
		`channel_${id}_color`,
		roundColor(HSVtoRGB((id * 360) / 16, 1, 1))
	);
	const [active, setActive] = useStorage<boolean>(
		`channel_${id}_active`,
		true
	);
	const [showTop, setShowTop] = useStorage<boolean>(
		`channel_${id}_showTop`,
		true
	);
	const [showPiano, setShowPiano] = useStorage<boolean>(
		`channel_${id}_showPiano`,
		true
	);
	const [showBottom, setShowBottom] = useStorage<boolean>(
		`channel_${id}_showBottom`,
		true
	);

	useEffect(() => {
		const colorString = `rgb(${color.r}, ${color.g}, ${color.b})`;
		Renderer.setChannelColor(id, colorString);
	}, [color]);

	useEffect(() => {
		AudioWorkerComms.call("setTrackActive", {
			track: id,
			active: active
		});
	}, [active]);

	useEffect(() => {
		if (showTop) {
			Renderer.showChannel("top", id);
		} else {
			Renderer.hideChannel("top", id);
		}
	}, [showTop]);

	useEffect(() => {
		if (showPiano) {
			Renderer.showChannel("piano", id);
		} else {
			Renderer.hideChannel("piano", id);
		}
	}, [showPiano]);

	useEffect(() => {
		if (showBottom) {
			Renderer.showChannel("bottom", id);
		} else {
			Renderer.hideChannel("bottom", id);
		}
	}, [showBottom]);

	return (
		<>
			<div>
				{disabled ? (
					<>
						<del>{id + 1}</del>
						🔇
					</>
				) : (
					<>{id + 1}</>
				)}
			</div>
			<ColorPicker color={color} onChange={(c) => setColor(c)} />
			<input
				type="checkbox"
				className={classes.rightAlign}
				checked={active}
				onChange={(e) => setActive(e.target.checked)}
			></input>
			<input
				type="checkbox"
				className={classes.rightAlign}
				checked={showTop}
				onChange={(e) => {
					setShowTop(e.target.checked);
				}}
			></input>
			<input
				type="checkbox"
				className={classes.rightAlign}
				checked={showPiano}
				onChange={(e) => {
					setShowPiano(e.target.checked);
				}}
			></input>
			<input
				type="checkbox"
				className={classes.rightAlign}
				checked={showBottom}
				onChange={(e) => {
					setShowBottom(e.target.checked);
				}}
			></input>
			<button
				className={classes.resetButton}
				onClick={() => {
					setColor(roundColor(HSVtoRGB((id * 360) / 16, 1, 1)));
					setActive(true);
					setShowTop(true);
					setShowPiano(true);
					setShowBottom(true);
				}}
			>
				&#10226;
			</button>
		</>
	);
}
