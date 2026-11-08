<script lang="ts">
	import Shell from '#lib/components/Shell.svelte';
	import { managementLinks } from '#lib/nav';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

{#if data.user}
	<Shell title="Management" links={managementLinks} user={data.user} notice={data.notice}>
		{@render children()}
	</Shell>
{/if}
