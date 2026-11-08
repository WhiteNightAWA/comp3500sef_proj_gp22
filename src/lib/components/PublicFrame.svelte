<script lang="ts">
	import { ROLE_HOME, type Role } from '#lib/domain';
	import type { Snippet } from 'svelte';
	import BrandMark from './BrandMark.svelte';
	import Footer from './Footer.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let {
		user = null,
		children
	}: {
		user?: { role: Role } | null;
		children: Snippet;
	} = $props();
</script>

<div>
	<header class="navbar border-b border-base-300 bg-base-100/90 px-4 backdrop-blur">
		<div class="flex-1"><BrandMark /></div>
		<div class="flex items-center gap-2">
			<ThemeToggle />
			{#if user}
				<a class="btn btn-primary btn-sm" href={ROLE_HOME[user.role]}>Open workspace</a>
			{:else}
				<a class="btn btn-ghost btn-sm" href="/login">Sign in</a>
				<a class="btn btn-primary btn-sm" href="/register">Register</a>
			{/if}
		</div>
	</header>
	<main class="harbour-wash page-main">{@render children()}</main>
	<Footer {user} />
</div>
