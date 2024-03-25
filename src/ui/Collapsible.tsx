import { useState } from "react";
import * as classes from "./styles/Collapsible.module.css";

// Thanks Luna for this snippet! https://github.com/DJLuna441

export function Collapsible({ title, children }) {
	const [isCollapsed, setCollapsed] = useState(true);

	return (
		<div className={classes.collapsibleSection}>
			<h3
				onClick={() => setCollapsed(!isCollapsed)}
				className={classes.title}
			>
				<span>
					<img
						className={
							isCollapsed ? classes.arrowCollapsed : classes.arrow
						}
						src={
							new URL("../assets/arrow.svg", import.meta.url).href
						}
					></img>
				</span>
				<span>{title}</span>
			</h3>
			<div className={classes.wrapper}>
				<div style={{ width: "100%" }}>
					<div
						className={
							classes.collapsible +
							" " +
							(isCollapsed ? classes.collapsed : "")
						}
					>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
