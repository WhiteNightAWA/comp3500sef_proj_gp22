<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { tip } from '#lib/tip';
	import DataTable from '#lib/components/DataTable.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { regionName } from '#lib/domain';
	import type { DeliveryView } from '#lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const columns = [
		{ id: 'pickup', label: 'Pickup', value: (row: DeliveryView) => row.pickupLines.join(', ') },
		{ id: 'stop', label: 'Next stop', value: (row: DeliveryView) => `${row.destination.city} ${row.destination.country}` },
		{ id: 'status', label: 'Status', value: (row: DeliveryView) => row.status },
		{ id: 'member', label: 'Member', value: (row: DeliveryView) => row.memberCode ?? '' }
	];
</script>

<DataTable rows={data.jobs} {columns} placeholder="Filter jobs">
	{#snippet children(job)}
		<tr class="hover:bg-base-200/70">
			<td>{job.pickupLines[0] ?? 'Warehouse'}</td>
			<td>{job.destination.city}, {regionName(job.destination.country)}</td>
			<td><StatusBadge status={job.status} /></td>
			<td>{job.memberCode ?? '—'}</td>
			<td>
				<a class="btn btn-ghost btn-xs btn-square" href="/delivery/{job.id}" aria-label="Open" use:tip={'Open'}><ArrowUpRight size={16} /></a>
			</td>
		</tr>
	{/snippet}
</DataTable>
