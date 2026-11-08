<script lang="ts">
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';

	let theme = $state<'light' | 'dark'>('light');

	$effect(() => {
		theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
	});

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', theme);
		document.documentElement.style.colorScheme = theme;
		localStorage.setItem('harbour-theme', theme);
		document.dispatchEvent(new Event('harbour-theme'));
	}
</script>

<button class="btn btn-ghost btn-sm gap-2" type="button" onclick={toggle} aria-pressed={theme === 'dark'}>
	{#if theme === 'dark'}
		<Sun size={16} />
		Light
	{:else}
		<Moon size={16} />
		Dark
	{/if}
</button>
