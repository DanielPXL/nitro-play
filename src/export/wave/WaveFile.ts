export function header(numSamples: number, numChannels: number, sampleRate: number) {
	const buffer = new ArrayBuffer(44);
	const view = new DataView(buffer);

	view.setUint32(0, 0x46464952, true); // "RIFF"
	view.setUint32(4, 36 + numSamples * numChannels * 4, true); // File size - 8
	view.setUint32(8, 0x45564157, true); // "WAVE"
	view.setUint32(12, 0x20746d66, true); // "fmt "
	view.setUint32(16, 16, true); // Size of fmt chunk
	view.setUint16(20, 0x03, true); // Format (3 = IEEE float)
	view.setUint16(22, numChannels, true); // Number of channels
	view.setUint32(24, sampleRate, true); // Sample rate
	view.setUint32(28, sampleRate * numChannels * 4, true); // Byte rate
	view.setUint16(32, numChannels * 4, true); // Block align
	view.setUint16(34, 32, true); // Bits per sample
	view.setUint32(36, 0x61746164, true); // "data"
	view.setUint32(40, numSamples * numChannels * 4, true); // Size of data chunk

	return new Uint8Array(buffer);
}

export function interleave(buffers: Float32Array[]) {
	const newBuffer = new Float32Array(buffers[0].length * buffers.length);
	for (let i = 0; i < buffers[0].length; i++) {
		for (let j = 0; j < buffers.length; j++) {
			newBuffer[i * buffers.length + j] = buffers[j][i];
		}
	}

	return newBuffer;
}
