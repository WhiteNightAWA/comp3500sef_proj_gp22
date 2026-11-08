<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	let {
		name,
		options,
		value = $bindable(''),
		required = false,
		onpick
	}: {
		name?: string;
		options: { value: string; label: string }[];
		value?: string;
		required?: boolean;
		onpick?: (value: string) => void;
	} = $props();

	let open = $state(false);
	let root = $state<HTMLDivElement>();
	const selected = $derived(options.find((option) => option.value === value) ?? options[0]);
	const current = $derived(selected?.value ?? '');

	$effect(() => {
		if (!value && options[0]) value = options[0].value;
	});

	$effect(() => {
		if (!open) return;
		const onPointer = (event: PointerEvent) => {
			const target = event.target;
			if (target instanceof Node && root?.contains(target)) return;
			open = false;
		};
		const onFocusOut = (event: FocusEvent) => {
			const next = event.relatedTarget;
			if (next instanceof Node && root?.contains(next)) return;
			open = false;
		};
		document.addEventListener('pointerdown', onPointer);
		root?.addEventListener('focusout', onFocusOut);
		return () => {
			document.removeEventListener('pointerdown', onPointer);
			root?.removeEventListener('focusout', onFocusOut);
		};
	});
</script>

<div class="relative" bind:this={root}>
	{#if name}
		<input type="hidden" {name} value={current} {required} />
	{/if}
	<button class="btn btn-outline w-full justify-between font-normal" type="button" aria-expanded={open} onclick={() => (open = !open)}>
		<span class="truncate">{selected?.label ?? 'Choose'}</span>
		<ChevronDown size={16} />
	</button>
	{#if open}
		<ul class="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded border border-base-300 bg-base-100 p-1 shadow-lg">
			{#each options as option (option.value)}
				<li>
					<button
						class="btn btn-ghost btn-sm w-full justify-start {option.value === current ? 'btn-active' : ''}"
						type="button"
						onclick={() => {
							value = option.value;
							onpick?.(option.value);
							open = false;
						}}
					>
						{option.label}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
