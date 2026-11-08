<script lang="ts">
	import PublicFrame from '#lib/components/PublicFrame.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const steps = [
		['1', 'Pre-register', 'Tell the warehouse which tracking numbers are yours.'],
		['2', 'Store', 'Staff weigh the parcel and put it on an open shelf.'],
		['3', 'Consolidate', 'Choose express, air, or sea, then pay one fee.'],
		['4', 'Deliver', 'A driver records pickup and proof of delivery.']
	];
</script>

<svelte:head>
	<title>Harbour Lane Logistics</title>
</svelte:head>

<PublicFrame user={data.user}>
	<div class="display-copy mx-auto max-w-6xl px-4 pt-16 pb-8">
		<section class="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
			<div>
				<p class="text-sm font-medium uppercase tracking-[0.14em] text-primary">Logistics management</p>
				<h1 class="mt-3">
					Consolidate parcels, then send them on.
				</h1>
				<p class="mt-4 max-w-xl text-base text-base-content/70">
					Customers in Hong Kong, Taiwan, and Macau pre-register mainland parcels for warehouse storage and one outbound consolidation.
				</p>
				<div class="mt-8 flex flex-wrap gap-3">
					{#if data.user}
						<a class="btn btn-primary" href="/app">Continue to workspace</a>
					{:else}
						<a class="btn btn-primary" href="/register">Create a customer account</a>
						<a class="btn btn-outline" href="/login">Sign in</a>
					{/if}
				</div>
			</div>
			<div class="panel p-6">
				<h2>From the dock to the door</h2>
				<ol class="mt-5 space-y-4">
					{#each steps as [n, title, copy] (n)}
						<li class="flex gap-3">
							<span class="grid size-8 shrink-0 place-items-center rounded bg-primary text-sm text-primary-content">{n}</span>
							<span>
								<span class="block font-medium leading-snug">{title}</span>
								<span class="block text-sm text-base-content/70">{copy}</span>
							</span>
						</li>
					{/each}
				</ol>
			</div>
		</section>

		<section class="mt-20 border-t border-base-300 pt-12">
			<h2 class="max-w-xl">Who works the same parcel</h2>
			<p class="mt-2 max-w-xl text-base-content/70">Each role opens a desk that only shows the work it needs.</p>
			<div class="mt-8 grid gap-6 md:grid-cols-3">
				<article class="panel p-5">
					<h3>Customers</h3>
					<p class="mt-2 text-sm text-base-content/70">Track your own parcels, verify an address, pay, and open a claim.</p>
				</article>
				<article class="panel p-5">
					<h3>Warehouse and support</h3>
					<p class="mt-2 text-sm text-base-content/70">Record arrivals, shelves, mismatches, and unknown cartons by member code.</p>
				</article>
				<article class="panel p-5">
					<h3>Delivery and management</h3>
					<p class="mt-2 text-sm text-base-content/70">Drivers close jobs. Management charts the chain and opens or closes zones.</p>
				</article>
			</div>
		</section>
	</div>
</PublicFrame>
