<script lang="ts">
	import Choice from '#lib/components/Choice.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import { tip } from '#lib/tip';
	import FormError from '#lib/components/FormError.svelte';
	import { regionName } from '#lib/domain';
	import Check from '@lucide/svelte/icons/check';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Truck from '@lucide/svelte/icons/truck';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<p class="text-sm text-base-content/70">Choose which saved address is used for delivery in Hong Kong, Taiwan, or Macau.</p>
	<Dialog title="Add an address" label="Add address" open={Boolean(form?.message)}>
		<form method="POST" action="?/add" class="grid gap-3">
			<FormError message={form?.message} />
			<label class="form-control">
				<span class="label-text">Label</span>
				<input class="input input-bordered" name="label" required maxlength="40" placeholder="Home, office, shop" />
			</label>
			<label class="form-control">
				<span class="label-text">Recipient</span>
				<input class="input input-bordered" name="recipient" required maxlength="80" />
			</label>
			<label class="form-control">
				<span class="label-text">Phone</span>
				<input class="input input-bordered" name="phone" required placeholder="+85212345678" />
			</label>
			<label class="form-control">
				<span class="label-text">Address line</span>
				<input class="input input-bordered" name="line1" required maxlength="80" />
			</label>
			<label class="form-control">
				<span class="label-text">Address line 2</span>
				<input class="input input-bordered" name="line2" maxlength="80" />
			</label>
			<label class="form-control">
				<span class="label-text">City or district</span>
				<input class="input input-bordered" name="city" required maxlength="80" />
			</label>
			<label class="form-control">
				<span class="label-text">Region</span>
				<Choice name="country" required options={data.regions.map((region) => ({ value: region.code, label: region.name }))} />
			</label>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" name="confirm" required />
				I confirm this address is correct
			</label>
			<button class="btn btn-primary w-fit">Save address</button>
		</form>
	</Dialog>
</div>

<div class="mb-8 grid gap-3">
	{#each data.addresses as address (address.id)}
		<article class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p class="flex items-center gap-2 font-medium">
						<MapPin size={16} />
						{address.label}
						{#if address.selected}
							<span class="badge badge-primary badge-sm gap-1"><Check size={12} /> Delivery</span>
						{/if}
					</p>
					<p class="mt-1 text-sm">{address.recipient} · {address.phone}</p>
					<p class="text-sm text-base-content/70">
						{address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {regionName(address.country)}
					</p>
				</div>
				<div class="flex gap-2">
					{#if !address.selected}
						<form method="POST" action="?/select">
							<input type="hidden" name="id" value={address.id} />
							<button class="btn btn-ghost btn-xs btn-square" aria-label="Use for delivery" use:tip={'Use for delivery'}><Truck size={16} /></button>
						</form>
					{/if}
					<form method="POST" action="?/remove">
						<input type="hidden" name="id" value={address.id} />
						<button class="btn btn-ghost btn-xs btn-square" aria-label="Remove {address.label}" use:tip={'Remove'}><Trash2 size={16} /></button>
					</form>
				</div>
			</div>
		</article>
	{:else}
		<p class="text-sm text-base-content/70">No addresses yet.</p>
	{/each}
</div>
