export function tip(node: HTMLElement, text: string) {
	let bubble: HTMLDivElement | null = null;

	function place() {
		const box = node.getBoundingClientRect();
		if (!bubble) {
			bubble = document.createElement('div');
			bubble.className =
				'pointer-events-none fixed z-[90] -translate-x-1/2 -translate-y-full rounded bg-neutral px-2 py-1 text-xs text-neutral-content shadow';
			document.body.appendChild(bubble);
		}
		bubble.textContent = text;
		bubble.style.left = `${box.left + box.width / 2}px`;
		bubble.style.top = `${box.top - 6}px`;
	}

	function hide() {
		bubble?.remove();
		bubble = null;
	}

	node.addEventListener('mouseenter', place);
	node.addEventListener('mouseleave', hide);
	node.addEventListener('focus', place);
	node.addEventListener('blur', hide);
	return {
		update(next: string) {
			text = next;
			if (bubble) bubble.textContent = next;
		},
		destroy() {
			hide();
			node.removeEventListener('mouseenter', place);
			node.removeEventListener('mouseleave', hide);
			node.removeEventListener('focus', place);
			node.removeEventListener('blur', hide);
		}
	};
}
