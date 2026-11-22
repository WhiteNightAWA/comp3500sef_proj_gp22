<script lang="ts">
	let { href = '/', label = 'Pigeon Logistic' }: { href?: string; label?: string } = $props();
</script>

<a class="font-display inline-flex items-center gap-2 tracking-tight" {href}>
	<span class="grid size-8 place-items-center rounded bg-primary text-sm text-primary-content">PL</span>
	<span class="hidden text-lg sm:inline">{label}</span>
</a>
