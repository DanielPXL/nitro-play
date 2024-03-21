import * as ServiceWorkerComms from "./ServiceWorkerComms";
import * as AudioWorkerComms from "./AudioWorkerComms";
import * as ControlPanel from "./ControlPanel";
import * as AudioPlayer from "./AudioPlayer";
import * as StateManager from "./StateManager";
import * as Renderer from "./Renderer";
import * as ExportManager from "./export/ExportManager";
import { SynthState } from "./SynthState";

const targetBufferHealth = 3.0;
let acceptBuffers = false;

// AudioContext can only be created in response to a user gesture
addEventListener("click", () => {
	if (AudioPlayer.ctx === undefined) {
		AudioPlayer.init();
	}
});

AudioWorkerComms.on("pcm", (data: Float32Array[]) => {
	if (acceptBuffers) {
		AudioPlayer.addPCM(data);
	}
});

async function load() {
	acceptBuffers = true;
	const s = await AudioWorkerComms.call("tickSeconds", {
		seconds: targetBufferHealth - AudioPlayer.getBufferHealth()
	});
	StateManager.addStates(s);
}

let tickInterval: number;
function start() {
	// Assumes load has already been called
	AudioPlayer.start();
	tickInterval = setInterval(async () => {
		if (AudioPlayer.getBufferHealth() < targetBufferHealth) {
			const states: SynthState[] = await AudioWorkerComms.call(
				"tickSeconds",
				{ seconds: targetBufferHealth - AudioPlayer.getBufferHealth() }
			);
			if (acceptBuffers) {
				StateManager.addStates(states);
			}
		}
	}, 200);
}

setInterval(() => {
	// document.title = `Buffer health: ${AudioPlayer.getBufferHealth()}`;
	// document.title = `States: ${StateManager.statesQueue.array().length}`;
	// document.title = `Time: ${AudioPlayer.getTime()}`;
	// document.title = `Top time: ${StateManager.topTime()}`;
	StateManager.discardStates(StateManager.topTime() - targetBufferHealth * 2);
}, 200);

function stop() {
	acceptBuffers = false;
	clearInterval(tickInterval);
	AudioPlayer.stop();
	StateManager.discardStates(Infinity);
}

ServiceWorkerComms.init();
AudioWorkerComms.init();
Renderer.init();
ExportManager.init();
ControlPanel.init(load, start, stop);
