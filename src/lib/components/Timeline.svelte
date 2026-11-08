<script lang="ts">
	import { formatWhen } from '#lib/format';
	import type { TrackingEvent } from '#lib/domain';

	let { events }: { events: TrackingEvent[] } = $props();
</script>

<ol class="timeline timeline-vertical timeline-compact">
	{#each [...events].reverse() as item, index (item.at + item.description + index)}
		<li>
			{#if index > 0}<hr />{/if}
			<div class="timeline-start text-xs opacity-60">{formatWhen(item.at)}</div>
			<div class="timeline-middle">
				<span class="badge badge-xs {item.source === 'carrier' ? 'badge-info' : 'badge-primary'}"></span>
			</div>
			<div class="timeline-end timeline-box">
				<p class="font-medium">{item.description}</p>
				<p class="text-sm opacity-70">{item.location} · {item.source}</p>
			</div>
			{#if index < events.length - 1}<hr />{/if}
		</li>
	{:else}
		<li class="text-sm opacity-70">No tracking events yet.</li>
	{/each}
</ol>
