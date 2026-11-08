<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import type { Snippet } from 'svelte';
	import type { Role } from '#lib/domain';
	import Bell from '@lucide/svelte/icons/bell';
	import AccountMenu from './AccountMenu.svelte';
	import BrandMark from './BrandMark.svelte';
	import Footer from './Footer.svelte';

	type Link = { href: string; label: string };

	let {
		title,
		links,
		user,
		notice = null,
		unread = 0,
		children
	}: {
		title: string;
		links: Link[];
		user: { name: string; email: string; role: Role; memberCode: string | null };
		notice?: string | null;
		unread?: number;
		children: Snippet;
	} = $props();

	const activeHref = $derived(
		links
			.filter((link) => page.url.pathname === link.href || page.url.pathname.startsWith(`${link.href}/`))
			.sort((a, b) => b.href.length - a.href.length)[0]?.href
	);
	const showNav = $derived(links.length > 1);
	let toasted = '';

	$effect(() => {
		if (!notice) return;
		const key = `${page.url.pathname}?${notice}`;
		if (toasted === key) return;
		toasted = key;
		toast.success(notice);
		const url = new URL(page.url.href);
		if (url.searchParams.has('notice')) {
			url.searchParams.delete('notice');
			history.replaceState(history.state, '', `${url.pathname}${url.search}`);
		}
	});
</script>

<svelte:head>
	<title>{title} · Logistics</title>
</svelte:head>

<div>
	<div class="navbar sticky top-0 z-40 border-b border-base-300 bg-base-100/95 px-3 backdrop-blur md:px-4">
		<div class="flex-1"><BrandMark href={links[0]?.href ?? '/'} /></div>
		<div class="flex items-center gap-1">
			{#if user.role === 'customer'}
				<a class="btn btn-ghost btn-sm" href="/app/notifications" aria-label="Notices">
					<Bell size={16} />
					{#if unread > 0}<span class="badge badge-primary badge-sm">{unread}</span>{/if}
				</a>
			{/if}
			<AccountMenu {user} />
		</div>
	</div>
	<div class="md:flex">
		{#if showNav}
			<aside class="border-b border-base-300 bg-base-100 md:sticky md:top-16 md:h-[calc(100svh-4rem)] md:w-52 md:shrink-0 md:border-r md:border-b-0">
				<ul class="menu w-full">
					{#each links as link (link.href)}
						<li>
							<a class:menu-active={link.href === activeHref} href={link.href}>{link.label}</a>
						</li>
					{/each}
				</ul>
			</aside>
		{/if}
		<div class="min-w-0 flex-1">
		<main class="harbour-wash page-main mx-auto w-full max-w-6xl px-4 py-6">
			<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
				<h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
			</div>
			{@render children()}
		</main>
		<Footer {user} />
		</div>
	</div>
</div>
