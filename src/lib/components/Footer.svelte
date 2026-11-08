<script lang="ts">
	import { ROLE_HOME, type Role } from '#lib/domain';

	let { user = null }: { user?: { role: Role } | null } = $props();
</script>

<footer class="mt-auto border-t border-base-300 bg-base-100">
	<div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
		<div>
			<p class="font-display text-lg">Harbour Lane</p>
			<p class="mt-2 text-sm text-base-content/70">
				Parcel consolidation for inbound storage, one outbound shipment, and proof of delivery.
			</p>
		</div>
		<div>
			<p class="text-sm font-medium">Workspace</p>
			<ul class="mt-2 space-y-1 text-sm">
				<li><a class="link link-hover" href="/">Home</a></li>
				{#if user}
					<li><a class="link link-hover" href={ROLE_HOME[user.role]}>Your desk</a></li>
				{:else}
					<li><a class="link link-hover" href="/login">Sign in</a></li>
					<li><a class="link link-hover" href="/register">Create a customer account</a></li>
				{/if}
			</ul>
		</div>
	</div>
	<p class="border-t border-base-300 px-4 py-3 text-center text-xs text-base-content/60">Harbour Lane · 2026</p>
</footer>
