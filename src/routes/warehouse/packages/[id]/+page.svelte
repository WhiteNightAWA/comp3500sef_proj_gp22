<script lang="ts">
	import Choice from '#lib/components/Choice.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import Timeline from '#lib/components/Timeline.svelte';
	import { formatWhen } from '#lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const pkg = $derived(data.pkg);
</script>

<a class="link text-sm" href="/warehouse">Back to inventory</a>
<div class="mt-4 flex items-start justify-between gap-3">
	<div>
		<h2 class="text-xl font-semibold">{pkg.trackingNumber}</h2>
		<p class="text-sm opacity-70">{pkg.carrier} · {pkg.description} · member {pkg.memberCode ?? 'unknown'}</p>
	</div>
	<StatusBadge status={pkg.status} longStay={pkg.longStay} />
</div>
<p class="mt-2 text-sm">Arrived {formatWhen(pkg.arrivalAt)} · Estimated departure {formatWhen(pkg.estimatedDeparture)}</p>
<FormError message={form?.message} />

<div class="mt-4 grid gap-4 lg:grid-cols-2">
	{#if pkg.status === 'arrived' || pkg.status === 'measured'}
		<form method="POST" action="?/measure" class="panel p-4">
			<h3 class="font-semibold">Weigh and measure</h3>
			<div class="mt-3 grid grid-cols-2 gap-2">
				<label class="form-control"><span class="label-text">Weight kg</span><input class="input input-bordered" name="weightKg" type="number" min="0.01" step="0.01" required value={pkg.weightKg ?? ''} /></label>
				<label class="form-control"><span class="label-text">Length cm</span><input class="input input-bordered" name="lengthCm" type="number" min="0.1" max="200" step="0.1" required value={pkg.lengthCm ?? ''} /></label>
				<label class="form-control"><span class="label-text">Width cm</span><input class="input input-bordered" name="widthCm" type="number" min="0.1" max="200" step="0.1" required value={pkg.widthCm ?? ''} /></label>
				<label class="form-control"><span class="label-text">Height cm</span><input class="input input-bordered" name="heightCm" type="number" min="0.1" max="200" step="0.1" required value={pkg.heightCm ?? ''} /></label>
			</div>
			{#if pkg.volumeWeightKg != null}<p class="mt-2 text-sm">Volume weight {pkg.volumeWeightKg} kg</p>{/if}
			<button class="btn btn-primary mt-3">Save measurements</button>
		</form>
	{/if}
	{#if pkg.status === 'measured' || pkg.status === 'stored'}
		<form method="POST" action="?/store" class="panel p-4">
			<h3 class="font-semibold">Shelf in an open zone</h3>
			<label class="form-control mt-3">
				<span class="label-text">Zone</span>
				<Choice
					name="zoneId"
					required
					value={pkg.zoneId ?? ''}
					options={data.zones.map((zone) => ({ value: zone.id, label: zone.name }))}
				/>
			</label>
			<label class="form-control mt-2">
				<span class="label-text">Shelf</span>
				<input class="input input-bordered" name="shelf" required maxlength="20" value={pkg.shelf ?? ''} />
			</label>
			<button class="btn btn-primary mt-3">Store package</button>
		</form>
	{/if}
	<form method="POST" action="?/mismatch" class="panel p-4">
		<h3 class="font-semibold">Verify declaration</h3>
		<textarea class="textarea textarea-bordered mt-3 w-full" name="note" maxlength="200" placeholder="What does not match?"></textarea>
		<button class="btn mt-3">Flag mismatch</button>
	</form>
	<div class="panel p-4">
		<h3 class="font-semibold">Tracking</h3>
		<form method="POST" action="?/refresh" class="my-3"><button class="btn btn-sm">Refresh tracking</button></form>
		{#if pkg.status === 'stored'}
			<form method="POST" action="?/return"><button class="btn btn-warning btn-sm">Mark return</button></form>
		{/if}
		<div class="mt-4"><Timeline events={pkg.events} /></div>
	</div>
</div>
