<script lang="ts">
	import DataTable from '#lib/components/DataTable.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import BarChart from '#lib/components/BarChart.svelte';
	import LineChart from '#lib/components/LineChart.svelte';
	import { tip } from '#lib/tip';
	import Lock from '@lucide/svelte/icons/lock';
	import LockOpen from '@lucide/svelte/icons/lock-open';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { statusLabel } from '#lib/format';
	import type { ZoneView } from '#lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const chain = $derived(data.report.chain.map((row) => ({ label: statusLabel(row.status), value: row.count })));
	const zones = $derived(data.report.zones.map((zone) => ({ label: zone.name, value: zone.storedCount })));
	const zoneColumns = [
		{ id: 'name', label: 'Zone', value: (zone: ZoneView) => zone.name },
		{ id: 'stored', label: 'Stored parcels', value: (zone: ZoneView) => zone.storedCount },
		{ id: 'state', label: 'State', value: (zone: ZoneView) => (zone.open ? 'Open' : 'Closed') }
	];
</script>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<p class="text-sm text-base-content/70">Open claims {data.report.openClaims} · Paid shipments {data.report.paidPayments}</p>
	<div class="flex gap-2">
		<Dialog title="Add a zone" label="Add zone" open={Boolean(form?.message)}>
			<form method="POST" action="?/add" class="grid gap-3">
				<label class="form-control">
					<span class="label-text">Name</span>
					<input class="input input-bordered" name="name" required maxlength="40" />
				</label>
				<button class="btn btn-primary w-fit">Add zone</button>
			</form>
		</Dialog>
		<a class="btn btn-sm" href="/manage/export">Export CSV</a>
	</div>
</div>
<FormError message={form?.message} />
<div class="mb-6 grid gap-4 lg:grid-cols-2">
	<BarChart labels={chain.map((row) => row.label)} values={chain.map((row) => row.value)} caption="Parcels along the chain" />
	<BarChart labels={zones.map((row) => row.label)} values={zones.map((row) => row.value)} caption="Stored parcels by zone" />
</div>
<div class="mb-6">
	<LineChart
		labels={data.report.flow.map((point) => point.day.slice(5))}
		values={data.report.flow.map((point) => point.count)}
		caption="Recent flow"
	/>
</div>
<div class="mb-6 grid gap-3 sm:grid-cols-3">
	{#each data.report.chain as row (row.status)}
		<div class="rounded-box bg-base-100 p-4 shadow-sm">
			<p class="text-sm capitalize opacity-60">{statusLabel(row.status)}</p>
			<p class="text-2xl font-semibold">{row.count}</p>
		</div>
	{/each}
</div>
<DataTable rows={data.report.zones} columns={zoneColumns} placeholder="Filter zones">
	{#snippet children(zone)}
		<tr>
			<td>{zone.name}</td>
			<td>{zone.storedCount}</td>
			<td>{zone.open ? 'Open' : 'Closed'}</td>
			<td>
				<div class="flex gap-1">
					<form method="POST" action="?/zone">
						<input type="hidden" name="zoneId" value={zone.id} />
						<input type="hidden" name="open" value={zone.open ? 'false' : 'true'} />
						<button
							class="btn btn-ghost btn-xs btn-square"
							aria-label={zone.open ? 'Close zone' : 'Open zone'}
							use:tip={zone.open ? 'Close zone' : 'Open zone'}
						>
							{#if zone.open}<Lock size={16} />{:else}<LockOpen size={16} />{/if}
						</button>
					</form>
					<form method="POST" action="?/drop">
						<input type="hidden" name="zoneId" value={zone.id} />
						<button class="btn btn-ghost btn-xs btn-square" aria-label="Drop zone" use:tip={'Drop zone'}><Trash2 size={16} /></button>
					</form>
				</div>
			</td>
		</tr>
	{/snippet}
</DataTable>
