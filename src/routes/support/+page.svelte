<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { tip } from '#lib/tip';
	import DataTable from '#lib/components/DataTable.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import type { ClaimView } from '#lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const columns = [
		{ id: 'tracking', label: 'Parcel', value: (row: ClaimView) => row.trackingNumber },
		{ id: 'member', label: 'Member', value: (row: ClaimView) => row.memberCode ?? '' },
		{ id: 'type', label: 'Status', value: (row: ClaimView) => row.status },
		{ id: 'detail', label: 'Detail', value: (row: ClaimView) => row.description }
	];
</script>

<DataTable rows={data.claims} {columns} placeholder="Filter claims">
	{#snippet children(claim)}
		<tr class="hover:bg-base-200/70">
			<td class="font-medium">{claim.trackingNumber}</td>
			<td>{claim.memberCode ?? '—'}</td>
			<td><StatusBadge status={claim.status} /></td>
			<td class="truncate">{claim.description}</td>
			<td>
				<a class="btn btn-ghost btn-xs btn-square" href="/support/claims/{claim.id}" aria-label="Open" use:tip={'Open'}><ArrowUpRight size={16} /></a>
			</td>
		</tr>
	{/snippet}
</DataTable>
