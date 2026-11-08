<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="grid max-w-3xl gap-8 lg:grid-cols-2">
	<form method="POST" action="?/profile" class="panel space-y-3 p-5">
		<div>
			<h2>Profile</h2>
			<p class="mt-1 text-sm text-base-content/70">Update the name and email on this account.</p>
		</div>
		<FormError message={form?.profileMessage} />
		<label class="form-control">
			<span class="label-text">Name</span>
			<input
				class="input input-bordered"
				name="name"
				required
				maxlength="60"
				autocomplete="name"
				value={data.profile.name}
			/>
		</label>
		<label class="form-control">
			<span class="label-text">Email</span>
			<input
				class="input input-bordered"
				name="email"
				type="email"
				required
				maxlength="120"
				autocomplete="email"
				value={data.profile.email}
			/>
		</label>
		<label class="form-control">
			<span class="label-text">Role</span>
			<input class="input input-bordered capitalize" value={data.profile.role} disabled />
		</label>
		{#if data.profile.memberCode}
			<label class="form-control">
				<span class="label-text">Member code</span>
				<input class="input input-bordered" value={data.profile.memberCode} disabled />
			</label>
		{/if}
		<button class="btn btn-primary w-fit">Save profile</button>
	</form>

	<form method="POST" action="?/password" class="panel space-y-3 p-5">
		<div>
			<h2>Password</h2>
			<p class="mt-1 text-sm text-base-content/70">Choose a new password for this desk.</p>
		</div>
		<FormError message={form?.passwordMessage} />
		<label class="form-control">
			<span class="label-text">Current password</span>
			<input
				class="input input-bordered"
				name="currentPassword"
				type="password"
				required
				minlength="8"
				autocomplete="current-password"
			/>
		</label>
		<label class="form-control">
			<span class="label-text">New password</span>
			<input
				class="input input-bordered"
				name="newPassword"
				type="password"
				required
				minlength="8"
				autocomplete="new-password"
			/>
		</label>
		<label class="form-control">
			<span class="label-text">Confirm new password</span>
			<input
				class="input input-bordered"
				name="confirmPassword"
				type="password"
				required
				minlength="8"
				autocomplete="new-password"
			/>
		</label>
		<button class="btn btn-primary w-fit">Update password</button>
	</form>
</div>
