import { Queue } from "./Queue";
import { SynthState } from "./SynthState";

export const statesQueue = new Queue<SynthState[]>();

export function addStates(s: SynthState[]) {
	statesQueue.enqueue(s);
}

export function getState(time: number) {
	// First, find the states array in the queue that contains the state for the requested time
	let states: SynthState[] | undefined;
	let prevStates: SynthState[] | undefined;
	for (const s of statesQueue) {
		if (s === undefined) {
			continue;
		}

		if (prevStates) {
			if (prevStates[0].time <= time && time < s[0].time) {
				states = prevStates;
				break;
			}
		}

		prevStates = s;
	}

	if (prevStates === undefined) {
		return undefined;
	}

	if (states === undefined) {
		states = prevStates;
	}

	// Then, find the state just before the requested time
	let prev: SynthState | undefined;
	for (const s of states!) {
		if (s.time <= time) {
			prev = s;
		} else {
			break;
		}
	}

	return prev;
}

export function discardStates(time: number) {
	function lastTimeInState(s: SynthState[] | undefined) {
		if (s === undefined) {
			return Infinity;
		}

		return s[s.length - 1].time;
	}

	while (lastTimeInState(statesQueue.peek()) < time) {
		statesQueue.dequeue();
	}
}

export function topTime() {
	const top = statesQueue.top();
	if (top === undefined) {
		return 0;
	}

	return top[top.length - 1].time;
}
