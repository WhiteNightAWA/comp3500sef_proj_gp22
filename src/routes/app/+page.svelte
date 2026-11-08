<script lang="ts">
	import Choice from '#lib/components/Choice.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import PackageTable from '#lib/components/PackageTable.svelte';
	import { statusLabel } from '#lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let query = $state('');
	const statusCounts = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const row of data.packages) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
		return [...counts.entries()].map(([status, value]) => ({ label: statusLabel(status), value }));
	});
</script>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<p class="text-sm text-base-content/70">
		Ship inbound parcels to member code <strong>{data.memberCode ?? 'pending'}</strong>.
	</p>
	<Dialog title="Pre-register a parcel" label="Pre-register" open={Boolean(form?.message)}>
		<form method="POST" action="?/preRegister" class="grid gap-3">
			<FormError message={form?.message} />
			<label class="form-control">
				<span class="label-text">Tracking number</span>
				<input class="input input-bordered" name="trackingNumber" required maxlength="40" />
			</label>
			<label class="form-control">
				<span class="label-text">Carrier</span>
				<Choice name="carrier" required options={data.carriers.map((carrier) => ({ value: carrier, label: carrier }))} />
			</label>
			<label class="form-control">
				<span class="label-text">Description</span>
				<input class="input input-bordered" name="description" required maxlength="200" />
			</label>
			<button class="btn btn-primary w-fit">Save</button>
		</form>
	</Dialog>
</div>

{#if statusCounts.length > 0}
	<div class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		{#each statusCounts as row (row.label)}
			<button
				class="rounded-box border bg-base-100 p-4 text-left shadow-sm {query === row.label ? 'border-primary' : 'border-base-300'}"
				type="button"
				onclick={() => (query = query === row.label ? '' : row.label)}
			>
				<p class="text-3xl font-semibold tabular-nums">{row.value}</p>
				<p class="text-sm capitalize text-base-content/70">{row.label}</p>
			</button>
		{/each}
	</div>
{/if}

<PackageTable rows={data.packages} hrefBase="/app/packages" bind:query />
