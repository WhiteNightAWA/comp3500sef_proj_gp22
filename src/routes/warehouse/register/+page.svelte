<script lang="ts">
	import Choice from '#lib/components/Choice.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const arrivalDefault = new Date().toISOString().slice(0, 16);
</script>

<form method="POST" class="grid max-w-2xl gap-3 rounded-box bg-base-100 p-4 shadow-sm md:grid-cols-2">
	<div class="md:col-span-2"><FormError message={form?.message} /></div>
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
		<input class="input input-bordered" name="furtherAction" maxlength="200" placeholder="Optional, for example hold for inspection" />
	</label>
	<button class="btn btn-primary w-fit">Register package</button>
</form>
