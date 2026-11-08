<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import Timeline from '#lib/components/Timeline.svelte';
	import { formatWhen } from '#lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const pkg = $derived(data.pkg);
</script>

<a class="link text-sm" href="/app">Back to parcels</a>
<div class="mt-4 grid gap-6 lg:grid-cols-2">
	<section class="rounded-box bg-base-100 p-4 shadow-sm">
		<div class="flex items-start justify-between gap-3">
			<div>
				<h2 class="text-xl font-semibold">{pkg.trackingNumber}</h2>
				<p class="text-sm opacity-70">{pkg.carrier} · {pkg.description}</p>
			</div>
			<StatusBadge status={pkg.status} longStay={pkg.longStay} />
		</div>
		<dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
			<div><dt class="opacity-60">Estimated arrival</dt><dd>{formatWhen(pkg.eta)}</dd></div>
			<div><dt class="opacity-60">Arrived</dt><dd>{formatWhen(pkg.arrivalAt)}</dd></div>
			<div><dt class="opacity-60">Location</dt><dd>{pkg.zoneName ? `${pkg.zoneName}${pkg.shelf ? ` / ${pkg.shelf}` : ''}` : '—'}</dd></div>
			<div><dt class="opacity-60">Weight</dt><dd>{pkg.weightKg == null ? '—' : `${pkg.weightKg} kg`}</dd></div>
		</dl>
		{#if pkg.furtherAction}<p class="mt-3 alert alert-warning">{pkg.furtherAction}</p>{/if}
		{#if pkg.mismatchNote}<p class="mt-3 text-sm">Mismatch: {pkg.mismatchNote}</p>{/if}
		<form method="POST" action="?/refresh" class="mt-4">
			<FormError message={form?.message} />
			<button class="btn btn-sm">Refresh tracking</button>
		</form>
	</section>
	<section class="rounded-box bg-base-100 p-4 shadow-sm">
		<h2 class="mb-3 font-semibold">Tracking</h2>
		<Timeline events={pkg.events} />
	</section>
</div>
