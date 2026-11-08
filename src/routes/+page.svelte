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
	<div class="mx-auto max-w-6xl px-4 py-14">
		<section class="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
			<div>
				<p class="text-sm font-medium uppercase tracking-wide text-primary">Logistics management</p>
				<h1 class="mt-2 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
					Consolidate parcels, then send them on.
				</h1>
				<p class="mt-4 max-w-xl text-base text-base-content/70">
					Customers in Hong Kong, Taiwan, and Macau pre-register parcels from mainland carriers. The warehouse
					measures and stores them, and one consolidation starts the outbound shipment.
				</p>
				<div class="mt-6 flex flex-wrap gap-2">
					{#if data.user}
						<a class="btn btn-primary" href="/app">Continue</a>
					{:else}
						<a class="btn btn-primary" href="/register">Create a customer account</a>
						<a class="btn btn-outline" href="/login">Sign in</a>
					{/if}
				</div>
			</div>
			<div class="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
				<h2 class="font-semibold">From the dock to the door</h2>
				<ol class="mt-4 space-y-3">
					{#each steps as [n, title, copy] (n)}
						<li class="flex gap-3">
							<span class="grid size-8 shrink-0 place-items-center rounded bg-primary text-sm text-primary-content">{n}</span>
							<span>
								<span class="block font-medium">{title}</span>
								<span class="block text-sm text-base-content/70">{copy}</span>
							</span>
						</li>
					{/each}
				</ol>
			</div>
		</section>
		<section class="mt-12 grid gap-4 md:grid-cols-3">
			<article class="rounded-box bg-base-100 p-5 shadow-sm">
				<h2 class="font-semibold">Customers</h2>
				<p class="mt-2 text-sm text-base-content/70">Track your own parcels, verify an address, pay, and open a claim.</p>
			</article>
			<article class="rounded-box bg-base-100 p-5 shadow-sm">
				<h2 class="font-semibold">Warehouse and support</h2>
				<p class="mt-2 text-sm text-base-content/70">Record arrivals, shelves, mismatches, and unknown cartons by member code.</p>
			</article>
			<article class="rounded-box bg-base-100 p-5 shadow-sm">
				<h2 class="font-semibold">Delivery and management</h2>
				<p class="mt-2 text-sm text-base-content/70">Drivers close jobs. Management charts the chain and opens or closes zones.</p>
			</article>
		</section>
	</div>
</PublicFrame>
