<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Choice from '#lib/components/Choice.svelte';
	import { tip } from '#lib/tip';
	import DataTable from '#lib/components/DataTable.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { regionName } from '#lib/domain';
	import { formatMoney } from '#lib/format';
	import type { ActionData, PageData } from './$types';
	import type { ConsolidationView } from '#lib/types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const columns = [
		{ id: 'created', label: 'Created', value: (row: ConsolidationView) => row.createdAt },
		{ id: 'method', label: 'Method', value: (row: ConsolidationView) => row.method },
		{ id: 'status', label: 'Status', value: (row: ConsolidationView) => row.status },
		{ id: 'total', label: 'Total', value: (row: ConsolidationView) => row.fee?.total ?? -1 }
	];
</script>

<div class="mb-4 flex justify-end">
	<Dialog title="Submit a consolidation" label="Submit consolidation" open={Boolean(form?.message)}>
		<form method="POST" action="?/submit" class="grid gap-3">
			{#if data.delivery}
				<p class="text-sm">
					Ships to {data.delivery.label}: {data.delivery.line1}, {data.delivery.city}, {regionName(data.delivery.country)}.
					<a class="link" href="/app/address">Switch address</a>
				</p>
			{:else}
				<p class="text-sm">Add a delivery address first. <a class="link" href="/app/address">Addresses</a></p>
			{/if}
			<FormError message={form?.message} />
			<div class="space-y-2">
				{#each data.stored as pkg (pkg.id)}
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" name="packageId" value={pkg.id} />
						{pkg.trackingNumber} · {pkg.description}
					</label>
				{:else}
					<p class="text-sm text-base-content/60">No stored parcels are ready.</p>
				{/each}
			</div>
			<label class="form-control">
				<span class="label-text">Method</span>
				<Choice name="method" options={data.methods.map((method) => ({ value: method, label: method }))} />
			</label>
			<button class="btn btn-primary w-fit">Submit</button>
		</form>
	</Dialog>
</div>

<DataTable rows={data.consolidations} {columns} placeholder="Filter consolidations">
	{#snippet children(row)}
		<tr class="hover:bg-base-200/70">
			<td>{row.createdAt.slice(0, 10)}</td>
			<td class="capitalize">{row.method}</td>
			<td><StatusBadge status={row.status} /></td>
			<td>{formatMoney(row.fee?.total)}</td>
			<td>
				<a class="btn btn-ghost btn-xs btn-square" href="/app/consolidations/{row.id}" aria-label="Open" use:tip={'Open'}><ArrowUpRight size={16} /></a>
			</td>
		</tr>
	{/snippet}
</DataTable>
