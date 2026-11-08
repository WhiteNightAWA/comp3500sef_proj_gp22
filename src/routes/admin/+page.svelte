<script lang="ts">
	import Choice from '#lib/components/Choice.svelte';
	import { tip } from '#lib/tip';
	import Ban from '@lucide/svelte/icons/ban';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import DataTable from '#lib/components/DataTable.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import type { AccountView } from '#lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const columns = [
		{ id: 'name', label: 'Name', value: (row: AccountView) => row.name },
		{ id: 'email', label: 'Email', value: (row: AccountView) => row.email },
		{ id: 'role', label: 'Role', value: (row: AccountView) => row.role },
		{ id: 'state', label: 'State', value: (row: AccountView) => (row.disabled ? 'Disabled' : 'Active') }
	];
</script>

<div class="mb-4 flex justify-end">
	<Dialog title="Create a staff account" label="Create staff" open={Boolean(form?.message)}>
		<form method="POST" action="?/create" class="grid gap-3">
			<FormError message={form?.message} />
			<label class="form-control">
				<span class="label-text">Name</span>
				<input class="input input-bordered" name="name" required maxlength="60" />
			</label>
			<label class="form-control">
				<span class="label-text">Email</span>
				<input class="input input-bordered" name="email" type="email" required />
			</label>
			<label class="form-control">
				<span class="label-text">Password</span>
				<input class="input input-bordered" name="password" type="password" required minlength="8" />
			</label>
			<label class="form-control">
				<span class="label-text">Role</span>
				<Choice name="role" options={data.roles.map((role) => ({ value: role, label: role }))} />
			</label>
			<button class="btn btn-primary w-fit">Create</button>
		</form>
	</Dialog>
</div>

<DataTable rows={data.accounts} {columns} placeholder="Filter accounts">
	{#snippet children(account)}
		<tr class="hover:bg-base-200/70">
			<td>{account.name}</td>
			<td>{account.email}</td>
			<td class="capitalize">{account.role}</td>
			<td>{account.disabled ? 'Disabled' : 'Active'}</td>
			<td>
				<form method="POST" action="?/disable">
					<input type="hidden" name="id" value={account.id} />
					<input type="hidden" name="disabled" value={account.disabled ? 'false' : 'true'} />
					<button
						class="btn btn-ghost btn-xs btn-square"
						aria-label={account.disabled ? 'Enable' : 'Disable'}
						use:tip={account.disabled ? 'Enable' : 'Disable'}
					>
						{#if account.disabled}<CircleCheck size={16} />{:else}<Ban size={16} />{/if}
					</button>
				</form>
			</td>
		</tr>
	{/snippet}
</DataTable>
