import type { TrackingEvent } from '#lib/domain';

export function carrierTimeline(trackingNumber: string): { events: TrackingEvent[]; eta: string } {
	let hash = 0;
	for (const char of trackingNumber) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
	const origins = ['Shenzhen', 'Guangzhou', 'Dongguan', 'Yiwu', 'Shanghai'];
	const origin = origins[hash % origins.length] ?? 'Shenzhen';
	const base = Date.UTC(2026, 0, 1) + (hash % 15) * 86_400_000;
	const events: TrackingEvent[] = [
		{
			at: new Date(base).toISOString(),
			location: origin,
			description: 'Picked up by carrier',
			source: 'carrier'
		},
		{
			at: new Date(base + 86_400_000).toISOString(),
			location: 'Transit hub',
			description: 'Departed origin facility',
			source: 'carrier'
		},
		{
			at: new Date(base + 2 * 86_400_000).toISOString(),
			location: 'Regional gateway',
			description: 'In transit',
			source: 'carrier'
		}
	];
	const eta = new Date(base + (3 + (hash % 4)) * 86_400_000).toISOString();
	return { events, eta };
}
