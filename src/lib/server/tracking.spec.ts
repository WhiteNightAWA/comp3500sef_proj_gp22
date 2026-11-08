import { describe, expect, it } from 'vitest';
import { carrierTimeline } from './tracking';

describe('carrier timeline', () => {
	it('returns the same estimate for the same tracking number', () => {
		const first = carrierTimeline('TRK1001');
		const second = carrierTimeline('TRK1001');
		expect(first.eta).toBe(second.eta);
		expect(first.events).toHaveLength(3);
		expect(first.events[0]?.source).toBe('carrier');
	});
});
