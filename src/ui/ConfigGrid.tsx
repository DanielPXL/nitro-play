import { useEffect } from "react";
import { useStorage } from "./Helpers";
import * as classes from "./styles/ConfigGrid.module.css";
import { NumberSpinner } from "./NumberSpinner";

export function ConfigGrid({ children }) {
	return <div className={classes.grid}>{children}</div>;
}

export function ConfigGridItem({ label, children, onReset }) {
	return (
		<>
			<div>{label}</div>
			<div className={classes.gridItem}>{children}</div>
			<button onClick={onReset}>&#10226;</button>
		</>
	);
}

export function ConfigGridCheckbox({
	label,
	storageTag,
	defaultValue,
	onChange
}) {
	const [checked, setChecked] = useStorage<boolean>(storageTag, defaultValue);

	useEffect(() => {
		onChange(checked);
	}, [checked]);

	return (
		<ConfigGridItem
			label={label}
			onReset={() => {
				setChecked(defaultValue);
			}}
		>
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => {
					setChecked(e.target.checked);
				}}
			/>
		</ConfigGridItem>
	);
}

export function ConfigGridNumber({
	label,
	storageTag,
	defaultValue,
	min,
	max,
	step,
	forceRange,
	onChange
}) {
	const [value, setValue] = useStorage<number>(storageTag, defaultValue);

	useEffect(() => {
		onChange(value);
	}, [value]);

	useEffect(() => {
		if (forceRange) {
			setValue(Math.min(max, Math.max(min, value)));
		}
	}, [min, max]);

	return (
		<ConfigGridItem
			label={label}
			onReset={() => {
				setValue(defaultValue);
			}}
		>
			<input
				className={classes.slider}
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => setValue(parseFloat(e.target.value))}
			/>
			<NumberSpinner
				value={value}
				step={step}
				onChange={(value) => {
					if (forceRange) {
						value = Math.min(max, Math.max(min, value));
					}

					setValue(value);
				}}
			/>
		</ConfigGridItem>
	);
}

export function ConfigGridMinMax({
	label,
	storageTag,
	defaultValue,
	step,
	onChange
}) {
	const [value, setValue] = useStorage<[number, number]>(
		storageTag,
		defaultValue
	);

	useEffect(() => {
		onChange(value);
	}, [value]);

	return (
		<ConfigGridItem
			label={label}
			onReset={() => {
				setValue(defaultValue);
			}}
		>
			<span>Min:</span>
			<NumberSpinner
				value={value[0]}
				onChange={(n) => {
					if (n > value[1]) {
						setValue([n, n]);
					} else {
						setValue([n, value[1]]);
					}
				}}
				step={step}
			/>
			<span>Max:</span>
			<NumberSpinner
				value={value[1]}
				onChange={(n) => {
					if (n < value[0]) {
						setValue([n, n]);
					} else {
						setValue([value[0], n]);
					}
				}}
				step={step}
			/>
		</ConfigGridItem>
	);
}

export function ConfigGridSelect({
	label,
	storageTag,
	defaultValue,
	options,
	onChange
}) {
	const [value, setValue] = useStorage<string>(storageTag, defaultValue);

	useEffect(() => {
		onChange(value);
	}, [value]);

	return (
		<ConfigGridItem
			label={label}
			onReset={() => {
				setValue(defaultValue);
			}}
		>
			<select value={value} onChange={(e) => setValue(e.target.value)}>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</ConfigGridItem>
	);
}
