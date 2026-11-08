<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { tip } from '#lib/tip';
	import DataTable from '#lib/components/DataTable.svelte';
	import type { ConsolidationView } from '#lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const columns = [
		{ id: 'method', label: 'Method', value: (row: ConsolidationView) => row.method },
		{ id: 'member', label: 'Member', value: (row: ConsolidationView) => row.memberCode ?? '' },
		{ id: 'count', label: 'Parcels', value: (row: ConsolidationView) => row.packages.length },
		{ id: 'created', label: 'Created', value: (row: ConsolidationView) => row.createdAt }
	];
</script>

<DataTable rows={data.rows} {columns} placeholder="Filter queue">
	{#snippet children(row)}
		<tr class="hover:bg-base-200/70">
			<td class="capitalize">{row.method}</td>
			<td>{row.memberCode ?? '—'}</td>
			<td>{row.packages.length}</td>
			<td>{row.createdAt.slice(0, 10)}</td>
			<td>
				<a class="btn btn-ghost btn-xs btn-square" href="/warehouse/consolidations/{row.id}" aria-label="Open" use:tip={'Open'}><ArrowUpRight size={16} /></a>
			</td>
		</tr>
	{/snippet}
</DataTable>
