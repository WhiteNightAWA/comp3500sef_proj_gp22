<script lang="ts">
	import Shell from '#lib/components/Shell.svelte';
	import { linksForRole } from '#lib/nav';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

{#if data.user}
	<Shell
		title="Account settings"
		links={linksForRole(data.user.role)}
		user={data.user}
		notice={data.notice}
		unread={data.unread}
	>
		{@render children()}
	</Shell>
{/if}
