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
	<div class="display-copy mx-auto grid max-w-6xl items-start gap-10 px-4 pt-14 pb-20 lg:grid-cols-[1.1fr_0.9fr]">
		<section>
			<p class="text-sm font-medium uppercase tracking-[0.14em] text-primary">Harbour Lane</p>
			<h1 class="mt-3">Sign in to your desk</h1>
			<p class="mt-3 max-w-xl text-base-content/70">Each role opens its own workspace.</p>
		</section>
		<div class="space-y-4">
			<form method="POST" class="panel p-5">
				<h2 class="text-lg">Email and password</h2>
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
			<details class="panel group">
				<summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-medium">
					Try a demo role
					<span class="text-sm text-base-content/50 group-open:hidden">Show</span>
					<span class="hidden text-sm text-base-content/50 group-open:inline">Hide</span>
				</summary>
				<div class="grid gap-2 border-t border-base-300 p-4 sm:grid-cols-2">
					{#each demoAccounts as account (account.email)}
						<form method="POST">
							<input type="hidden" name="email" value={account.email} />
							<input type="hidden" name="password" value={DEMO_PASSWORD} />
							<button class="btn btn-outline w-full">{account.label}</button>
						</form>
					{/each}
				</div>
			</details>
		</div>
	</div>
</PublicFrame>
