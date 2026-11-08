<script lang="ts">
	import Shell from '#lib/components/Shell.svelte';
	import { customerLinks } from '#lib/nav';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

{#if data.user}
	<Shell title="Your parcels" links={customerLinks} user={data.user} notice={data.notice} unread={data.unread}>
		{@render children()}
	</Shell>
{/if}
