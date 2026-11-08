<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { formatWhen } from '#lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const job = $derived(data.job);
	const stamp = new Date().toISOString().slice(0, 16);
</script>

<a class="link text-sm" href="/delivery">Back</a>
<article class="panel mt-4 p-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold">Member {job.memberCode ?? '—'}</h2>
		<StatusBadge status={job.status} />
	</div>
	<h3 class="mt-4 font-semibold">Pick up</h3>
	<ul class="text-sm">{#each job.pickupLines as line (line)}<li>{line}</li>{/each}</ul>
	<h3 class="mt-4 font-semibold">Next stop</h3>
	<p class="text-sm">
		{job.destination.recipient}<br />
		{job.destination.line1}{#if job.destination.line2}, {job.destination.line2}{/if}<br />
		{job.destination.city}, {job.destination.country}
	</p>
	<p class="mt-3 text-sm">Departure {formatWhen(job.departureAt)} · Delivered {formatWhen(job.deliveredAt)}</p>
	<FormError message={form?.message} />
	{#if job.status === 'ready'}
		<form method="POST" action="?/pickup" class="mt-4 flex flex-wrap items-end gap-2">
			<label class="form-control">
				<span class="label-text">Departure time (UTC)</span>
				<input class="input input-bordered" type="datetime-local" name="departureAt" required value={stamp} />
			</label>
			<button class="btn btn-primary">Picked up</button>
		</form>
	{/if}
	{#if job.status === 'picked_up'}
		<form method="POST" action="?/deliver" class="mt-4 flex flex-wrap items-end gap-2">
			<label class="form-control">
				<span class="label-text">Delivery time (UTC)</span>
				<input class="input input-bordered" type="datetime-local" name="deliveredAt" required value={stamp} />
			</label>
			<button class="btn btn-primary">Proof of delivery</button>
		</form>
	{/if}
</article>
