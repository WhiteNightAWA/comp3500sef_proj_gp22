<script lang="ts">
	import Shell from '#lib/components/Shell.svelte';
	import { adminLinks } from '#lib/nav';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

{#if data.user}
	<Shell title="Administration" links={adminLinks} user={data.user} notice={data.notice}>
		{@render children()}
	</Shell>
{/if}
