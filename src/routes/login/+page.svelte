<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import { toast } from 'svelte-sonner';
	import PublicFrame from '#lib/components/PublicFrame.svelte';
	import { DEMO_PASSWORD, demoAccounts } from '#lib/nav';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	$effect(() => {
		if (data.disabled) toast.error('This account is disabled');
	});
</script>

<svelte:head><title>Sign in · Logistics</title></svelte:head>

<PublicFrame user={data.user}>
	<div class="mx-auto grid max-w-6xl items-start gap-8 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr]">
		<section>
			<p class="text-sm font-medium uppercase tracking-wide text-primary">Harbour Lane</p>
			<h1 class="mt-2 text-4xl font-semibold tracking-tight">Sign in to your desk</h1>
			<p class="mt-3 max-w-xl text-base-content/70">Each role opens its own workspace.</p>
		</section>
		<div class="space-y-4">
			<form method="POST" class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
				<h2 class="text-lg font-semibold">Email and password</h2>
				<div class="mt-4 space-y-3">
					<FormError message={form?.message} />
					<label class="form-control">
						<span class="label-text">Email</span>
						<input class="input input-bordered" name="email" type="email" required autocomplete="username" />
					</label>
					<label class="form-control">
						<span class="label-text">Password</span>
						<input class="input input-bordered" name="password" type="password" required minlength="8" autocomplete="current-password" />
					</label>
					<button class="btn btn-primary w-full">Sign in</button>
					<a class="link text-sm" href="/register">Create a customer account</a>
				</div>
			</form>
			<div class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
				<h2 class="text-lg font-semibold">Roles</h2>
				<div class="mt-3 grid gap-2 sm:grid-cols-2">
					{#each demoAccounts as account (account.email)}
						<form method="POST">
							<input type="hidden" name="email" value={account.email} />
							<input type="hidden" name="password" value={DEMO_PASSWORD} />
							<button class="btn btn-outline w-full">{account.label}</button>
						</form>
					{/each}
				</div>
			</div>
		</div>
	</div>
</PublicFrame>
