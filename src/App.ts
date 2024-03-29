import * as ServiceWorkerComms from "./ServiceWorkerComms";
import * as AudioWorkerComms from "./core/AudioWorkerComms";
import * as AudioPlayer from "./core/AudioPlayer";
import * as StateManager from "./core/StateManager";
import * as Renderer from "./core/Renderer";
import { SynthState } from "./core/SynthState";
import * as ReactRoot from "./ui/ReactRoot";

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

async function load(seq: string) {
	stop();
	await AudioWorkerComms.call("loadSeq", { name: seq });

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
ReactRoot.init(load, start);
