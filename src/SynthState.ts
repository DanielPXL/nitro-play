import { Audio } from "nitro-fs";

export interface SynthState {
	time: number;
	channels: SynthChannel[];
}

export interface SynthChannel {
	playing: SynthNote[];
}

export interface SynthNote {
	note: number;
	volume: number;
	state: Audio.EnvelopeState;
}

export function createSynthState(renderer: Audio.SequenceRenderer): SynthState {
	const channels: SynthChannel[] = [];
	for (let i = 0; i < renderer.synth.channels.length; i++) {
		channels.push({ playing: [] });
		for (const p of renderer.synth.channels[i].playing) {
			if (p) {
				channels[i].playing.push({
					note: p.notePlusPortamento + p.trackInfo.pitchBendSemitones + getModulationSemitones(p, renderer.synth.time),
					volume: getVolume(p),
					state: p.envelope.state
				});
			}
		}
	}

	return {
		time: renderer.synth.time,
		channels
	};
}

function getModulationSemitones(playing: Audio.PlayingNote, time: number) {
	if (playing.trackInfo.modType !== Audio.ModType.Pitch) {
		return 0;
	}

	if (playing.trackInfo.modDepth === 0) {
		return 0;
	}

	if (playing.modulationStartTime === undefined) {
		return 0;
	}

	const modulationAmplitude = (playing.trackInfo.modDepth / 127) * playing.trackInfo.modRange;
	const modulationFreq = (playing.trackInfo.modSpeed / 127) * 50;
	
	const modulationValue = modulationAmplitude * Math.sin(2 * Math.PI * modulationFreq * (time - playing.modulationStartTime));
	return modulationValue;
}

function getVolume(playing: Audio.PlayingNote) {
	const volume = playing.velocity
		+ playing.envelope.gain
		+ Audio.ADSRConverter.convertSustain(playing.trackInfo.volume1)
		+ Audio.ADSRConverter.convertSustain(playing.trackInfo.volume2);
	
	return Audio.ADSRConverter.convertVolume(volume) * playing.modulationVolume;
}