<script lang="ts">
	import Choice from '#lib/components/Choice.svelte';
	import DataTable from '#lib/components/DataTable.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import type { ClaimView } from '#lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const columns = [
		{ id: 'tracking', label: 'Parcel', value: (row: ClaimView) => row.trackingNumber },
		{ id: 'type', label: 'Type', value: (row: ClaimView) => row.type },
		{ id: 'status', label: 'Status', value: (row: ClaimView) => row.status },
		{ id: 'detail', label: 'Detail', value: (row: ClaimView) => row.description }
	];
</script>

<div class="mb-4 flex justify-end">
	<Dialog title="Report a problem" label="Report" open={Boolean(form?.message)}>
		<form method="POST" action="?/open" class="grid gap-3">
			<FormError message={form?.message} />
			<label class="form-control">
				<span class="label-text">Parcel</span>
				<Choice name="packageId" required options={data.packages.map((pkg) => ({ value: pkg.id, label: pkg.trackingNumber }))} />
			</label>
			<label class="form-control">
				<span class="label-text">Type</span>
				<Choice name="type" options={data.types.map((type) => ({ value: type, label: type.replaceAll('_', ' ') }))} />
			</label>
			<label class="form-control">
				<span class="label-text">What happened</span>
				<textarea class="textarea textarea-bordered" name="description" required maxlength="400"></textarea>
			</label>
			<button class="btn btn-primary w-fit">Open claim</button>
		</form>
	</Dialog>
</div>

<DataTable rows={data.claims} {columns} placeholder="Filter claims">
	{#snippet children(claim)}
		<tr class="hover:bg-base-200/70">
			<td class="font-medium">{claim.trackingNumber}</td>
			<td class="capitalize">{claim.type.replaceAll('_', ' ')}</td>
			<td><StatusBadge status={claim.status} /></td>
			<td>
				<p>{claim.description}</p>
				{#if claim.resolution}<p class="text-xs text-base-content/60">{claim.resolution}</p>{/if}
			</td>
			<td></td>
		</tr>
	{/snippet}
</DataTable>
