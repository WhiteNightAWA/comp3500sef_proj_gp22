<script lang="ts">
	import { statusLabel } from '#lib/format';

	let { status, longStay = false }: { status: string; longStay?: boolean } = $props();

	const tone: Record<string, string> = {
		pre_registered: 'badge-ghost',
		arrived: 'badge-info',
		measured: 'badge-info',
		stored: 'badge-success',
		in_consolidation: 'badge-warning',
		awaiting_payment: 'badge-warning',
		paid: 'badge-success',
		out_for_delivery: 'badge-info',
		delivered: 'badge-success',
		abnormal: 'badge-error',
		returned: 'badge-ghost',
		submitted: 'badge-warning',
		rejected: 'badge-error',
		cancelled: 'badge-ghost',
		open: 'badge-warning',
		resolved: 'badge-success',
		ready: 'badge-warning',
		picked_up: 'badge-info'
	};
</script>

<span class="badge {tone[status] ?? 'badge-ghost'} capitalize">{statusLabel(status)}</span>
{#if longStay}
	<span class="badge badge-error ml-1">Return needed</span>
{/if}
