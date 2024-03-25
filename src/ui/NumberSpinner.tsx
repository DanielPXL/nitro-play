import * as classes from "./styles/NumberSpinner.module.css";

export function NumberSpinner({ value, step, onChange }) {
	return (
		<input
			className={classes.input}
			type="number"
			value={value}
			step={step}
			onChange={(e) => onChange(parseFloat(e.target.value))}
		></input>
	);
}
