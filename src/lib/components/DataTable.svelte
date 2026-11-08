<script lang="ts" generics="T extends { id: string }">
	import type { Snippet } from 'svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Choice from './Choice.svelte';

	type Column = {
		id: string;
		label: string;
		value: (row: T) => string | number;
	};

	let {
		rows,
		columns,
		placeholder = 'Search',
		query = $bindable(''),
		search,
		children
	}: {
		rows: T[];
		columns: Column[];
		placeholder?: string;
		query?: string;
		search?: (row: T) => string;
		children: Snippet<[T]>;
	} = $props();

	let sortId = $state('');
	let ascending = $state(true);
	let page = $state(1);
	let perPage = $state(6);
	const pageSizes = [6, 10, 20, 50];

	const filtered = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		const matched = needle
			? rows.filter((row) => {
					const haystack = columns.map((column) => String(column.value(row))).join(' ');
					const extra = search ? search(row) : '';
					return `${haystack} ${extra}`.toLowerCase().includes(needle);
				})
			: rows;
		const column = columns.find((item) => item.id === sortId);
		if (!column) return matched;
		const direction = ascending ? 1 : -1;
		return [...matched].sort((a, b) => {
			const left = column.value(a);
			const right = column.value(b);
			if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction;
			return String(left).localeCompare(String(right)) * direction;
		});
	});

	const pages = $derived(Math.max(1, Math.ceil(filtered.length / perPage)));
	const safePage = $derived(Math.min(page, pages));
	const visible = $derived(filtered.slice((safePage - 1) * perPage, safePage * perPage));
	const columnWidth = $derived(`${Math.floor(88 / Math.max(columns.length, 1))}%`);

	function sortBy(id: string) {
		if (sortId === id) ascending = !ascending;
		else {
			sortId = id;
			ascending = true;
		}
		page = 1;
	}
</script>

<div class="data-grid rounded-box border border-base-300 bg-base-100 shadow-sm">
	<div class="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 p-3">
		<input
			class="input input-bordered input-sm w-full max-w-xs"
			placeholder={placeholder}
			bind:value={query}
			oninput={() => (page = 1)}
		/>
		<p class="text-xs text-base-content/60">{filtered.length} rows</p>
	</div>
	<div class="overflow-x-auto">
		<table class="table table-fixed w-full">
			<colgroup>
				{#each columns as column (column.id)}
					<col style="width: {columnWidth}" />
				{/each}
				<col style="width: 12%" />
			</colgroup>
			<thead>
				<tr>
					{#each columns as column (column.id)}
						<th class="truncate">
							<button class="btn btn-ghost btn-xs max-w-full truncate font-semibold" type="button" onclick={() => sortBy(column.id)}>
								{column.label}
								{#if sortId === column.id}{ascending ? '↑' : '↓'}{/if}
							</button>
						</th>
					{/each}
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each visible as row (row.id)}
					{@render children(row)}
				{:else}
					<tr>
						<td colspan={columns.length + 1} class="text-sm text-base-content/60">Nothing matches.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<div class="flex flex-wrap items-center justify-end gap-2 border-t border-base-300 p-3">
		<label class="flex items-center gap-2 text-xs text-base-content/70">
			Rows
			<div class="w-20">
				<Choice
					options={pageSizes.map((size) => ({ value: String(size), label: String(size) }))}
					value={String(perPage)}
					onpick={(next) => {
						perPage = Number(next);
						page = 1;
					}}
				/>
			</div>
		</label>
		<button class="btn btn-ghost btn-sm" type="button" disabled={safePage <= 1} onclick={() => (page = safePage - 1)} aria-label="Previous page">
			<ChevronLeft size={16} />
		</button>
		<span class="text-xs tabular-nums">{safePage} / {pages}</span>
		<button class="btn btn-ghost btn-sm" type="button" disabled={safePage >= pages} onclick={() => (page = safePage + 1)} aria-label="Next page">
			<ChevronRight size={16} />
		</button>
	</div>
</div>

<style>
	.data-grid :global(td),
	.data-grid :global(th) {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.data-grid :global(td:last-child),
	.data-grid :global(th:last-child) {
		overflow: visible;
		text-align: end;
	}
</style>
