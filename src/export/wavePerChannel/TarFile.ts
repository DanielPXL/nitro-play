function setCString(view: DataView, offset: number, str: string, length: number) {
	for (let i = 0; i < length; i++) {
		if (i < str.length) {
			view.setUint8(offset + i, str.charCodeAt(i));
		} else {
			view.setUint8(offset + i, 0);
		}
	}
}

function numberToOctalString(num: number, length: number) {
	const str = num.toString(8);
	return "0".repeat(length - str.length) + str;
}

export class TarFile {
	constructor() {
		this.tarHead = 0;
	}

	tarHead: number;

	fileHeader(filename: string, size: number, mtime: Date) {
		const header = new ArrayBuffer(512);
		const view = new DataView(header);
	
		setCString(view, 0, filename, 100); // File name
		setCString(view, 100, "0000777", 8); // File mode
		setCString(view, 108, "0000000", 8); // Owner ID
		setCString(view, 116, "0000000", 8); // Group ID
		setCString(view, 124, numberToOctalString(size, 11), 12); // File size
		const time = Math.floor(mtime.getTime() / 1000);
		setCString(view, 136, numberToOctalString(time, 11), 12); // Modification time
		setCString(view, 148, "        ", 8); // Checksum (filled in later)
		setCString(view, 156, "0", 1); // Type (0 = regular file)
		setCString(view, 157, "", 100); // Link name
		setCString(view, 257, "ustar", 6); // Magic
		setCString(view, 263, "00", 2); // Version (no null byte)
		setCString(view, 265, "", 32); // Owner name
		setCString(view, 297, "", 32); // Group name
		setCString(view, 329, "0000000", 8); // Device major number
		setCString(view, 337, "0000000", 8); // Device minor number
	
		// Fill in checksum
		let checksum = 0;
		for (let i = 0; i < 512; i++) {
			checksum += view.getUint8(i);
		}
		setCString(view, 148, numberToOctalString(checksum, 6), 7);
	
		return new Uint8Array(header);
	}
	
	fileData(buf: Uint8Array) {
		this.tarHead += buf.length;
		return buf;		
	}

	fileEnd() {
		const remainder = 512 - (this.tarHead % 512);
		const block = new ArrayBuffer(remainder);
		const view = new DataView(block);
		setCString(view, 0, "", remainder); // Fill with null bytes

		this.tarHead = 0;

		return new Uint8Array(block);
	}
	
	tarEnd() {
		const block = new ArrayBuffer(1024);
		const view = new DataView(block);
		setCString(view, 0, "", 1024); // Fill with null bytes
		return new Uint8Array(block);
	}
}
