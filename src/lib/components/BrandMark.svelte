<script lang="ts">
	let { href = '/', label = 'Harbour Lane' }: { href?: string; label?: string } = $props();
</script>

<a class="inline-flex items-center gap-2 font-semibold tracking-tight" {href}>
	<span class="grid size-8 place-items-center rounded bg-primary text-sm text-primary-content">HL</span>
	<span class="hidden sm:inline">{label}</span>
</a>
