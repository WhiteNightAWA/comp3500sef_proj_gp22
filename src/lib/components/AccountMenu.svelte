<script lang="ts">
	import { closeOnOutside } from '#lib/close-outside';
	import { DEMO_PASSWORD, demoAccounts } from '#lib/nav';
	import type { Role } from '#lib/domain';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Settings from '@lucide/svelte/icons/settings';
	import ThemeToggle from './ThemeToggle.svelte';

	let {
		user
	}: {
		user: { name: string; email: string; role: Role; memberCode: string | null };
	} = $props();

	let switchOpen = $state(false);
</script>

<details class="dropdown dropdown-end" use:closeOnOutside>
	<summary class="menu-toggle btn btn-ghost gap-2 px-2">
		<span class="grid size-8 place-items-center rounded bg-primary text-xs font-semibold text-primary-content">
			{user.name.slice(0, 1).toUpperCase()}
		</span>
		<span class="hidden text-left sm:block">
			<span class="block text-sm font-medium leading-tight">{user.name}</span>
			<span class="block text-xs capitalize text-base-content/60">{user.role}</span>
		</span>
		<ChevronDown size={16} class="opacity-60" />
	</summary>
	<div class="dropdown-content z-40 mt-2 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
		<div class="px-3 py-2">
			<p class="font-medium">{user.name}</p>
			<p class="text-xs text-base-content/60">{user.email}</p>
			{#if user.memberCode}
				<p class="mt-1 text-xs">Member {user.memberCode}</p>
			{/if}
		</div>
		<div class="mt-1 border-t border-base-300 pt-1">
			<a class="btn btn-ghost btn-sm w-full justify-start gap-2" href="/settings">
				<Settings size={16} />
				Account settings
			</a>
		</div>
		<div class="mt-1 flex items-center justify-between border-t border-base-300 px-2 pt-1">
			<span class="text-xs text-base-content/60">Appearance</span>
			<ThemeToggle />
		</div>
		<div
			class="relative mt-1"
			role="group"
			onmouseenter={() => (switchOpen = true)}
			onmouseleave={() => (switchOpen = false)}
			onfocusin={() => (switchOpen = true)}
			onfocusout={(event) => {
				const next = event.relatedTarget;
				if (next instanceof Node && event.currentTarget.contains(next)) return;
				switchOpen = false;
			}}
		>
			<button class="btn btn-ghost btn-sm w-full justify-between" type="button" aria-expanded={switchOpen}>
				Switch account
				<ChevronRight size={14} />
			</button>
			{#if switchOpen}
				<div class="absolute top-0 right-[calc(100%+0.1rem)] z-50 w-52 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg">
					{#each demoAccounts as account (account.email)}
						<form method="POST" action="/login">
							<input type="hidden" name="email" value={account.email} />
							<input type="hidden" name="password" value={DEMO_PASSWORD} />
							<button class="btn btn-ghost btn-sm w-full justify-between" disabled={user.email === account.email}>
								<span>{account.label}</span>
								{#if user.email === account.email}
									<span class="badge badge-primary badge-xs">Active</span>
								{/if}
							</button>
						</form>
					{/each}
				</div>
			{/if}
		</div>
		<form method="POST" action="/logout" class="mt-1 border-t border-base-300 pt-2">
			<button class="btn btn-sm btn-block">
				<LogOut size={16} />
				Sign out
			</button>
		</form>
	</div>
</details>
