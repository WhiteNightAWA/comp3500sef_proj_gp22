<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const claim = $derived(data.claim);
</script>

<a class="link text-sm" href="/support">Back</a>
<article class="mt-4 rounded-box bg-base-100 p-4 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold">{claim.trackingNumber}</h2>
		<StatusBadge status={claim.status} />
	</div>
	<p class="mt-2 text-sm">Member {claim.memberCode ?? '—'} · {claim.type.replaceAll('_', ' ')}</p>
	<p class="mt-3">{claim.description}</p>
	{#if claim.status === 'open'}
		<form method="POST" class="mt-4 space-y-2">
			<FormError message={form?.message} />
			<textarea class="textarea textarea-bordered w-full" name="resolution" required maxlength="400"></textarea>
			<div class="flex gap-2">
				<button class="btn btn-primary" name="decision" value="resolved">Resolve</button>
				<button class="btn btn-ghost" name="decision" value="rejected">Reject</button>
			</div>
		</form>
	{:else if claim.resolution}
		<p class="mt-3 text-sm opacity-70">{claim.resolution}</p>
	{/if}
</article>
