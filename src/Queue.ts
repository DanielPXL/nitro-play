export class Queue<T> {
	private head: QueueNode<T> | null = null;
	private tail: QueueNode<T> | null = null;

	enqueue(value: T) {
		const node = { value, next: null };
		if (this.tail === null) {
			this.head = node;
			this.tail = node;
		} else {
			this.tail.next = node;
			this.tail = node;
		}
	}

	dequeue(): T | undefined {
		if (this.head === null) {
			return undefined;
		}

		const value = this.head.value;
		this.head = this.head.next;
		if (this.head === null) {
			this.tail = null;
		}
		return value;
	}

	peek(): T | undefined {
		return this.head?.value;
	}

	top(): T | undefined {
		return this.tail?.value;
	}

	isEmpty(): boolean {
		return this.head === null;
	}

	array(): T[] {
		const arr: T[] = [];
		let node = this.head;
		while (node !== null) {
			arr.push(node.value);
			node = node.next;
		}
		return arr;
	}

	[Symbol.iterator]() {
		let node = this.head;
		return {
			next: () => {
				if (node === null) {
					return { done: true, value: undefined };
				} else {
					const value = node.value;
					node = node.next;
					return { done: false, value };
				}
			}
		};
	}

	remove(predicate: (value: T) => boolean): T | undefined {
		let prev: QueueNode<T> | null = null;
		let node = this.head;
		while (node !== null) {
			if (predicate(node.value)) {
				if (prev === null) {
					this.head = node.next;
				} else {
					prev.next = node.next;
				}
				if (node === this.tail) {
					this.tail = prev;
				}
				return node.value;
			}
			prev = node;
			node = node.next;
		}
		return undefined;
	}
}

interface QueueNode<T> {
	value: T;
	next: QueueNode<T> | null;
}