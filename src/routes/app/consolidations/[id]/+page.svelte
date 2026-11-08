<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { formatMoney } from '#lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const row = $derived(data.consolidation);
</script>

<a class="link text-sm" href="/app/consolidations">Back</a>
<div class="panel mt-4 p-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold capitalize">{row.method} shipment</h2>
		<StatusBadge status={row.status} />
	</div>
	<p class="mt-2 text-sm">
		{row.address.recipient}, {row.address.line1}, {row.address.city}, {row.address.country}
	</p>
	<ul class="mt-3 text-sm">
		{#each row.packages as pkg (pkg.id)}
			<li>{pkg.trackingNumber} · {pkg.description}</li>
		{/each}
	</ul>
	{#if row.fee}
		<dl class="mt-4 grid max-w-sm grid-cols-2 gap-2 text-sm">
			<dt>Chargeable weight</dt><dd>{row.chargeableWeight} kg</dd>
			<dt>Shipping</dt><dd>{formatMoney(row.fee.shipping)}</dd>
			<dt>Service</dt><dd>{formatMoney(row.fee.service)}</dd>
			<dt>Handling</dt><dd>{formatMoney(row.fee.handling)}</dd>
			<dt class="font-semibold">Total</dt><dd class="font-semibold">{formatMoney(row.fee.total)}</dd>
		</dl>
	{/if}
	{#if row.verificationNote}<p class="mt-3 text-sm opacity-70">{row.verificationNote}</p>{/if}
	<FormError message={form?.message} />
	{#if row.status === 'awaiting_payment'}
		<form method="POST" action="?/pay" class="mt-4 max-w-sm space-y-2">
			<input class="input input-bordered w-full" name="card" inputmode="numeric" autocomplete="off" required placeholder="4242424242424242" />
			<button class="btn btn-primary">Pay service fee</button>
		</form>
	{/if}
	{#if row.canCancel}
		<form method="POST" action="?/cancel" class="mt-3">
			<button class="btn btn-ghost">Cancel shipment</button>
		</form>
	{/if}
</div>
