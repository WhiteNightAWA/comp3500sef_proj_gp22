<script lang="ts">
	import { tip } from '#lib/tip';
	import DataTable from '#lib/components/DataTable.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import type { PackageView } from '#lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const columns = [
		{ id: 'tracking', label: 'Tracking', value: (row: PackageView) => row.trackingNumber },
		{ id: 'description', label: 'Description', value: (row: PackageView) => row.description },
		{ id: 'zone', label: 'Zone', value: (row: PackageView) => row.zoneName ?? '' }
	];
</script>

<FormError message={form?.message} />
<DataTable rows={data.packages} {columns} placeholder="Filter unknown parcels">
	{#snippet children(pkg)}
		<tr class="hover:bg-base-200/70">
			<td class="font-medium">{pkg.trackingNumber}</td>
			<td>{pkg.description}</td>
			<td>{pkg.zoneName ?? '—'}</td>
			<td>
				<span use:tip={'Assign'}>
				<Dialog title="Assign {pkg.trackingNumber}" label="Assign" compact open={Boolean(form?.message)}>
					<form method="POST" action="?/assign" class="grid gap-3">
						<input type="hidden" name="packageId" value={pkg.id} />
						<label class="form-control">
							<span class="label-text">Member code</span>
							<input class="input input-bordered" name="memberCode" required maxlength="20" />
						</label>
						<button class="btn btn-primary w-fit">Assign</button>
					</form>
				</Dialog>
				</span>
			</td>
		</tr>
	{/snippet}
</DataTable>
