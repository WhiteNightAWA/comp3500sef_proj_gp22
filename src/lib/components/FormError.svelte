<script lang="ts">
	import { toast } from 'svelte-sonner';

	let { message = null }: { message?: string | null } = $props();
	let shown = '';

	$effect(() => {
		if (!message) {
			shown = '';
			return;
		}
		if (message === shown) return;
		shown = message;
		toast.error(message);
	});
</script>
