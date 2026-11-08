<script lang="ts">
	import Choice from '#lib/components/Choice.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import PackageTable from '#lib/components/PackageTable.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const arrivalDefault = new Date().toISOString().slice(0, 16);
</script>

<div class="mb-4 flex justify-end">
	<Dialog title="Register an arrival" label="Register arrival">
		<form method="POST" action="/warehouse/register" class="grid gap-3 md:grid-cols-2">
			<label class="form-control">
				<span class="label-text">Item id / tracking number</span>
				<input class="input input-bordered" name="trackingNumber" required maxlength="40" />
			</label>
			<label class="form-control">
				<span class="label-text">Carrier</span>
				<Choice name="carrier" options={data.carriers.map((carrier) => ({ value: carrier, label: carrier }))} />
			</label>
			<label class="form-control md:col-span-2">
				<span class="label-text">Description</span>
				<input class="input input-bordered" name="description" maxlength="200" />
			</label>
			<label class="form-control">
				<span class="label-text">Arrival time (UTC)</span>
				<input class="input input-bordered" type="datetime-local" name="arrivalAt" required value={arrivalDefault} />
			</label>
			<label class="form-control">
				<span class="label-text">Estimated departure</span>
				<input class="input input-bordered" type="datetime-local" name="estimatedDeparture" />
			</label>
			<label class="form-control">
				<span class="label-text">Current zone</span>
				<Choice name="zoneId" required options={data.zones.map((zone) => ({ value: zone.id, label: zone.name }))} />
			</label>
			<label class="form-control">
				<span class="label-text">Delivery fee (USD)</span>
				<input class="input input-bordered" name="deliveryFee" type="number" min="0" step="0.01" value="0" />
			</label>
			<label class="form-control md:col-span-2">
				<span class="label-text">Further action</span>
				<input class="input input-bordered" name="furtherAction" maxlength="200" />
			</label>
			<button class="btn btn-primary w-fit">Register package</button>
		</form>
	</Dialog>
</div>
<PackageTable rows={data.packages} hrefBase="/warehouse/packages" />
