<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const row = $derived(data.row);
</script>

<a class="link text-sm" href="/warehouse/consolidations">Back</a>
<div class="mt-4 rounded-box bg-base-100 p-4 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold capitalize">{row.method}</h2>
		<StatusBadge status={row.status} />
	</div>
	<p class="mt-2 text-sm">
		Ship to {row.address.recipient}, {row.address.line1}, {row.address.city}, {row.address.country}
	</p>
	<ul class="mt-3 text-sm">
		{#each row.packages as pkg (pkg.id)}
			<li>
				{pkg.trackingNumber}: {pkg.weightKg ?? '—'} kg actual, {pkg.volumeWeightKg ?? '—'} kg volume,
				{pkg.zoneName ?? 'no zone'} / {pkg.shelf ?? 'no shelf'}
			</li>
		{/each}
	</ul>
	{#if row.status === 'submitted'}
		<form method="POST" action="?/verify" class="mt-4 space-y-2">
			<FormError message={form?.message} />
			<textarea class="textarea textarea-bordered w-full" name="note" maxlength="200" placeholder="Verification note"></textarea>
			<div class="flex gap-2">
				<button class="btn btn-primary" name="decision" value="approve">Approve</button>
				<button class="btn btn-ghost" name="decision" value="reject">Reject</button>
			</div>
		</form>
	{/if}
</div>
