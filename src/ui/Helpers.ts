import { useState, useEffect } from "react";

export const storagePrefix = "nitro-play";

export function useStorage<T>(
	key: string,
	defaultValue: any
): [T, React.Dispatch<React.SetStateAction<T>>] {
	const k = `${storagePrefix}_${key}`;
	const [value, setValue] = useState<T>(() => {
		const storedValue = localStorage.getItem(k);
		return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
	});

	useEffect(() => {
		localStorage.setItem(k, JSON.stringify(value));
	}, [key, value]);

	return [value, setValue];
}
