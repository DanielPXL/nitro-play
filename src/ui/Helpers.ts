import { useState, useEffect } from "react";

export const storagePrefix = "nitro-play";

function getStorage() {
	const storage = localStorage.getItem(storagePrefix);
	return storage ? JSON.parse(storage) : {};
}

function setStorage(storage: { [key: string]: string }) {
	localStorage.setItem(storagePrefix, JSON.stringify(storage));
}

export function useStorage<T>(
	key: string,
	defaultValue: any
): [T, React.Dispatch<React.SetStateAction<T>>] {
	const [value, setValue] = useState<T>(() => {
		const storage = getStorage();
		const storedValue = storage[key];
		const parsed = storedValue ? JSON.parse(storedValue) : defaultValue;
		return parsed;
	});

	useEffect(() => {
		const storage = getStorage();
		storage[key] = JSON.stringify(value);
		setStorage(storage);
	}, [key, value]);

	return [value, setValue];
}

export function repeat<T>(n: number, fn: (i: number) => T) {
	return Array(n)
		.fill(0)
		.map((_, i) => fn(i));
}
