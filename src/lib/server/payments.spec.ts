import { describe, expect, it } from 'vitest';
import { chargeCard } from './payments';

describe('payment gateway', () => {
	it('declines the test card and accepts another 16-digit card', () => {
		expect(chargeCard('4000000000000002', 10).ok).toBe(false);
		const paid = chargeCard('4242424242424242', 10);
		expect(paid.ok).toBe(true);
		expect(paid.gatewayRef.startsWith('gw_')).toBe(true);
		expect(paid.gatewayRef).not.toContain('4242');
	});
});
