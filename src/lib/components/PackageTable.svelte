<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { tip } from '#lib/tip';
	import DataTable from './DataTable.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import { statusLabel } from '#lib/format';
	import type { PackageView } from '#lib/types';

	let { rows, hrefBase, query = $bindable('') }: { rows: PackageView[]; hrefBase: string; query?: string } = $props();

	const columns = [
		{
			id: 'tracking',
			label: 'Tracking',
			value: (row: PackageView) => `${row.trackingNumber} ${row.carrier} ${row.description}`
		},
		{ id: 'status', label: 'Status', value: (row: PackageView) => statusLabel(row.status) },
		{ id: 'member', label: 'Member', value: (row: PackageView) => row.memberCode ?? '' },
		{
			id: 'location',
			label: 'Location',
			value: (row: PackageView) => (row.zoneName ? `${row.zoneName}${row.shelf ? ` / ${row.shelf}` : ''}` : '')
		}
	];
</script>

<DataTable {rows} {columns} placeholder="Search parcels" bind:query>
	{#snippet children(row)}
		<tr class="hover:bg-base-200/70">
			<td>
				<p class="truncate font-medium">{row.trackingNumber}</p>
				<p class="truncate text-xs opacity-60">{row.carrier} · {row.description}</p>
			</td>
			<td><StatusBadge status={row.status} longStay={row.longStay} /></td>
			<td class="truncate">{row.memberCode ?? '—'}</td>
			<td class="truncate">{row.zoneName ? `${row.zoneName}${row.shelf ? ` / ${row.shelf}` : ''}` : '—'}</td>
			<td>
				<a class="btn btn-ghost btn-xs btn-square" href="{hrefBase}/{row.id}" aria-label="Open" use:tip={'Open'}>
					<ArrowUpRight size={16} />
				</a>
			</td>
		</tr>
	{/snippet}
</DataTable>
