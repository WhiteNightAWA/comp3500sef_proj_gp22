function closeTree(node: HTMLElement) {
	if (node instanceof HTMLDetailsElement) node.open = false;
	node.querySelectorAll('details').forEach((item) => {
		item.open = false;
	});
}

export function closeOnOutside(node: HTMLElement) {
	const onPointer = (event: PointerEvent) => {
		const target = event.target;
		if (target instanceof Node && node.contains(target)) return;
		closeTree(node);
	};
	const onFocusOut = (event: FocusEvent) => {
		const next = event.relatedTarget;
		if (next instanceof Node && node.contains(next)) return;
		closeTree(node);
	};
	document.addEventListener('pointerdown', onPointer);
	node.addEventListener('focusout', onFocusOut);
	return {
		destroy() {
			document.removeEventListener('pointerdown', onPointer);
			node.removeEventListener('focusout', onFocusOut);
		}
	};
}
