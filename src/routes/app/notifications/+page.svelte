<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { tip } from '#lib/tip';
	import DataTable from '#lib/components/DataTable.svelte';
	import { formatWhen } from '#lib/format';
	import type { NotificationView } from '#lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const columns = [
		{ id: 'when', label: 'When', value: (row: NotificationView) => row.createdAt },
		{ id: 'message', label: 'Message', value: (row: NotificationView) => row.message }
	];
</script>

<DataTable rows={data.items} {columns} placeholder="Filter notices">
	{#snippet children(item)}
		<tr class="hover:bg-base-200/70">
			<td class="whitespace-nowrap text-sm">{formatWhen(item.createdAt)}</td>
			<td>{item.message}</td>
			<td>
				<a class="btn btn-ghost btn-xs btn-square" href={item.href} aria-label="Open" use:tip={'Open'}><ArrowUpRight size={16} /></a>
			</td>
		</tr>
	{/snippet}
</DataTable>
