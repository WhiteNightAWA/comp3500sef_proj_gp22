<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import PublicFrame from '#lib/components/PublicFrame.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Register · Logistics</title></svelte:head>

<PublicFrame user={data.user}>
	<div class="display-copy mx-auto grid max-w-5xl items-start gap-10 px-4 pt-14 pb-20 lg:grid-cols-2">
		<section>
			<p class="text-sm font-medium uppercase tracking-[0.14em] text-primary">New customer</p>
			<h1 class="mt-3">Create an account</h1>
			<p class="mt-3 text-base-content/70">
				Public signup creates a customer with a member code for inbound parcels; staff accounts are added by an administrator.
			</p>
			<ul class="mt-8 space-y-3 text-sm">
				<li class="panel px-4 py-3">Pre-register tracking numbers before the box arrives.</li>
				<li class="panel px-4 py-3">Confirm a shipping address, then pay one consolidation.</li>
				<li class="panel px-4 py-3">Follow status changes and claim updates in Notices.</li>
			</ul>
		</section>
		<form method="POST" class="panel p-5">
			<div class="space-y-3">
				<FormError message={form?.message} />
				<label class="form-control">
					<span class="label-text">Name</span>
					<input class="input input-bordered" name="name" required maxlength="60" autocomplete="name" />
				</label>
				<label class="form-control">
					<span class="label-text">Email</span>
					<input class="input input-bordered" name="email" type="email" required autocomplete="email" />
				</label>
				<label class="form-control">
					<span class="label-text">Password</span>
					<input class="input input-bordered" name="password" type="password" required minlength="8" autocomplete="new-password" />
				</label>
				<button class="btn btn-primary w-full">Register</button>
				<a class="link text-sm" href="/login">Already have an account? Sign in</a>
			</div>
		</form>
	</div>
</PublicFrame>
