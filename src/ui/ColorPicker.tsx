import { useEffect, useRef, useState } from "react";
import * as classes from "./styles/ColorPicker.module.css";
import * as panelClasses from "./styles/Panel.module.css";
import { NumberSpinner } from "./NumberSpinner";

export type Color = { r: number; g: number; b: number };
export type HSVColor = { h: number; s: number; v: number };

export function ColorPicker({
	color,
	onChange
}: {
	color: Color;
	onChange: (color: Color) => void;
}) {
	const [show, setShow] = useState(false);
	const [dialogX, setDialogX] = useState(0);
	const [dialogY, setDialogY] = useState(0);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Just for display purposes
	const [hsvColor, setHsvColor] = useState(() => {
		const hsv = RGBtoHSV(color.r, color.g, color.b);
		return roundColor(hsv);
	});
	const hueOnly = HSVtoRGB(hsvColor.h, 1, 1);

	function setupOutsideClickListeners() {
		function listener(e: MouseEvent) {
			if (!show || !dialogRef.current || !buttonRef.current) {
				return;
			}

			// Check if click is outside the panel and button
			const buttonRect = buttonRef.current.getBoundingClientRect();
			const dialogRect = dialogRef.current.getBoundingClientRect();
			const x = e.clientX;
			const y = e.clientY;
			if (
				x < buttonRect.left ||
				x > buttonRect.right ||
				y < buttonRect.top ||
				y > buttonRect.bottom
			) {
				if (
					x < dialogRect.left ||
					x > dialogRect.right ||
					y < dialogRect.top ||
					y > dialogRect.bottom
				) {
					setShow(false);
				}
			}
		}

		document.addEventListener("click", listener);
		return () => document.removeEventListener("click", listener);
	}

	useEffect(() => {
		if (show) {
			if (dialogRef.current) {
				dialogRef.current.show();
			}

			return setupOutsideClickListeners();
		} else {
			if (dialogRef.current) {
				dialogRef.current.close();
			}
		}
	}, [show]);

	function setRGB(r: number, g: number, b: number) {
		r = Math.min(255, Math.max(0, r));
		g = Math.min(255, Math.max(0, g));
		b = Math.min(255, Math.max(0, b));

		const hsv = RGBtoHSV(r, g, b);
		setHsvColor(roundColor(hsv));
		onChange(roundColor({ r, g, b }));
	}

	function setHSV(h: number, s: number, v: number) {
		h = Math.min(360, Math.max(0, h));
		s = Math.min(1, Math.max(0, s));
		v = Math.min(1, Math.max(0, v));

		setHsvColor(roundColor({ h, s, v }));
		const rgb = HSVtoRGB(h, s, v);
		onChange(roundColor(rgb));
	}

	return (
		<div className={classes.container}>
			<button
				ref={buttonRef}
				className={classes.preview}
				style={{
					backgroundColor: `rgb(${color.r} ${color.g} ${color.b})`
				}}
				onClick={(e) => {
					// This is jank but who cares
					const y = Math.min(e.clientY, window.innerHeight - 350);
					setDialogX(e.clientX);
					setDialogY(y);
					setShow(true);
				}}
			></button>
			{show ? (
				<dialog
					ref={dialogRef}
					className={panelClasses.panel + " " + classes.panel}
					style={{
						margin: 0,
						top: dialogY,
						left: dialogX
					}}
				>
					<div
						className={classes.satValuePicker}
						style={{
							background: `linear-gradient(to right, #fff, rgba(${hueOnly.r}, ${hueOnly.g}, ${hueOnly.b}, 255)),
								linear-gradient(to top, #000, rgba(${hueOnly.r}, ${hueOnly.g}, ${hueOnly.b}, 0))`
						}}
						onMouseMove={(e) => {
							if (e.buttons === 0) {
								return;
							}

							const rect =
								e.currentTarget.getBoundingClientRect();
							const x = e.clientX - rect.left;
							const y = e.clientY - rect.top;

							const v = x / rect.width;
							const s = 1 - y / rect.height;

							setHSV(hsvColor.h, s, v);
						}}
					>
						<img
							className={classes.pickerCircle}
							src={
								new URL(
									"../assets/pickercircle.svg",
									import.meta.url
								).href
							}
							style={{
								top: `${100 - hsvColor.s * 100}%`,
								left: `${hsvColor.v * 100}%`
							}}
							draggable={false}
						></img>
					</div>

					<div
						className={classes.huePicker}
						onMouseMove={(e) => {
							if (e.buttons === 0) {
								return;
							}

							const rect =
								e.currentTarget.getBoundingClientRect();
							const y = e.clientY - rect.top;
							const h = (y / rect.height) * 360;

							setHSV(h, hsvColor.s, hsvColor.v);
						}}
					>
						<img
							className={classes.pickerLine}
							src={
								new URL(
									"../assets/pickerline.svg",
									import.meta.url
								).href
							}
							style={{
								top: `${(hsvColor.h / 360) * 100}%`
							}}
							draggable={false}
						></img>
					</div>

					<div className={classes.manualPicker}>
						<div className={classes.manualPickerEntry}>
							R
							<NumberSpinner
								value={color.r}
								step={1}
								onChange={(v: number) =>
									setRGB(v, color.g, color.b)
								}
							/>
						</div>
						<div className={classes.manualPickerEntry}>
							G
							<NumberSpinner
								value={color.g}
								step={1}
								onChange={(v: number) =>
									setRGB(color.r, v, color.b)
								}
							/>
						</div>
						<div className={classes.manualPickerEntry}>
							B
							<NumberSpinner
								value={color.b}
								step={1}
								onChange={(v: number) =>
									setRGB(color.r, color.g, v)
								}
							/>
						</div>

						<div className={classes.manualPickerEntry}>
							H
							<NumberSpinner
								value={hsvColor.h}
								step={1}
								onChange={(v: number) =>
									setHSV(v, hsvColor.s, hsvColor.v)
								}
							/>
						</div>
						<div className={classes.manualPickerEntry}>
							S
							<NumberSpinner
								value={hsvColor.s}
								step={0.1}
								onChange={(v: number) =>
									setHSV(hsvColor.h, v, hsvColor.v)
								}
							/>
						</div>
						<div className={classes.manualPickerEntry}>
							V
							<NumberSpinner
								value={hsvColor.v}
								step={0.1}
								onChange={(v: number) =>
									setHSV(hsvColor.h, hsvColor.s, v)
								}
							/>
						</div>
					</div>
				</dialog>
			) : (
				<></>
			)}
		</div>
	);
}

// https://github.com/DanielPXL/PXLed/blob/master/PXLed/Color24.cs#L121
export function HSVtoRGB(h: number, s: number, v: number): Color {
	const hi = Math.floor(h / 60) % 6;
	const f = h / 60 - Math.floor(h / 60);

	v *= 255;
	const p = v * (1 - s);
	const q = v * (1 - f * s);
	const t = v * (1 - (1 - f) * s);

	switch (hi) {
		case 0:
			return { r: v, g: t, b: p };
		case 1:
			return { r: q, g: v, b: p };
		case 2:
			return { r: p, g: v, b: t };
		case 3:
			return { r: p, g: q, b: v };
		case 4:
			return { r: t, g: p, b: v };
		case 5:
			return { r: v, g: p, b: q };
	}
}

export function RGBtoHSV(r: number, g: number, b: number): HSVColor {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;

	let h = 0;
	if (d === 0) {
		h = 0;
	} else if (max === r) {
		h = ((g - b) / d) % 6;
	} else if (max === g) {
		h = (b - r) / d + 2;
	} else if (max === b) {
		h = (r - g) / d + 4;
	}

	h = h * 60;
	if (h < 0) {
		h += 360;
	}

	const s = max === 0 ? 0 : d / max;
	const v = max;

	return { h, s, v };
}

export function roundColor(color: Color): Color;
export function roundColor(color: HSVColor): HSVColor;
export function roundColor(color: Color | HSVColor): Color | HSVColor {
	if ("r" in color) {
		return {
			r: Math.round(color.r),
			g: Math.round(color.g),
			b: Math.round(color.b)
		};
	} else {
		return {
			h: Math.round(color.h),
			s: Math.round(color.s * 100) / 100,
			v: Math.round(color.v * 100) / 100
		};
	}
}
