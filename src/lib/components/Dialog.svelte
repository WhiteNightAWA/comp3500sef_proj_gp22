<script lang="ts">
	import type { Snippet } from 'svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';

	let {
		title,
		label,
		open = false,
		compact = false,
		children
	}: {
		title: string;
		label: string;
		open?: boolean;
		compact?: boolean;
		children: Snippet;
	} = $props();

	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if (open) dialog?.showModal();
	});

	function onClick(event: MouseEvent) {
		if (event.target === dialog) dialog?.close();
	}
</script>

<button
	class={compact ? 'btn btn-ghost btn-xs btn-square' : 'btn btn-primary btn-sm'}
	type="button"
	aria-label={label}
	onclick={() => dialog?.showModal()}
>
	{#if compact}<Plus size={16} />{:else}{label}{/if}
</button>
<dialog bind:this={dialog} class="panel-dialog" onclick={onClick}>
	<div class="w-[min(32rem,calc(100vw-2rem))] rounded border border-base-300 bg-base-100 p-5 text-base-content shadow-xl">
		<div class="mb-4 flex items-start justify-between gap-3">
			<h2 class="text-lg font-semibold">{title}</h2>
			<form method="dialog">
				<button class="btn btn-ghost btn-sm" aria-label="Close"><X size={16} /></button>
			</form>
		</div>
		{@render children()}
	</div>
</dialog>
