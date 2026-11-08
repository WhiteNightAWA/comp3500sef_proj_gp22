import { describe, expect, it } from 'vitest';
import {
	appendEvent,
	canCancelConsolidation,
	cancelPackages,
	chargeableKg,
	duplicateTrackingMessage,
	isLongStay,
	quote,
	validateAddress,
	validateDimension,
	validatePhone,
	validateText,
	validateTrackingNumber,
	validateWeight,
	volumeWeightKg,
	type TrackingEvent
} from './domain';

const event = (description: string): TrackingEvent => ({
	at: '2026-01-01T00:00:00.000Z',
	location: 'Hub',
	description,
	source: 'carrier'
});

describe('parcel rules', () => {
	it('rejects zero, negative, and oversized measurements', () => {
		expect(validateWeight(0)).toMatch(/greater than 0/);
		expect(validateWeight(-1)).toMatch(/greater than 0/);
		expect(validateWeight(1.2)).toBeNull();
		expect(validateDimension('Length', 0)).toMatch(/greater than 0/);
		expect(validateDimension('Length', 201)).toMatch(/200/);
		expect(validateDimension('Length', 20)).toBeNull();
	});

	it('checks phone and address fields', () => {
		expect(validatePhone('8521234')).toMatch(/Hong Kong/);
		expect(validatePhone('+85212345678')).toBeNull();
		expect(validateText('City', '')).toMatch(/required/);
		expect(validateText('City', 'a'.repeat(81))).toMatch(/80/);
		expect(validateText('City', 'Hello 😀')).toMatch(/emoji/);
		expect(
			validateAddress({
				recipient: '',
				phone: '+85212345678',
				line1: '1 Road',
				line2: '',
				city: 'Hong Kong',
				country: 'HK'
			})
		).toMatch(/Recipient/);
		expect(
			validateAddress({
				recipient: 'Ada',
				phone: '+85212345678',
				line1: '1 Road',
				line2: '',
				city: 'Hong Kong',
				country: 'HK'
			})
		).toBeNull();
	});

	it('rejects a duplicate tracking number and keeps history when status changes', () => {
		expect(validateTrackingNumber('')).toMatch(/required/);
		expect(duplicateTrackingMessage(true)).toMatch(/already exists/);
		expect(duplicateTrackingMessage(false)).toBeNull();
		const original = [event('Picked up by carrier')];
		const next = appendEvent(original, {
			at: '2026-01-02T00:00:00.000Z',
			location: 'Warehouse',
			description: 'Weighed and measured',
			source: 'warehouse'
		});
		expect(original).toHaveLength(1);
		expect(next.map((item) => item.description)).toEqual(['Picked up by carrier', 'Weighed and measured']);
		const cancelled = cancelPackages([{ status: 'paid', events: next }]);
		expect(cancelled[0]?.status).toBe('stored');
		expect(cancelled[0]?.events).toHaveLength(2);
		expect(next).toHaveLength(2);
	});

	it('prices chargeable weight and only cancels before pickup', () => {
		expect(volumeWeightKg(50, 40, 20)).toBe(8);
		expect(chargeableKg(2, 8)).toBe(8);
		expect(quote('air', 8, 0)).toEqual({ shipping: 64, service: 6, handling: 0, total: 70 });
		expect(canCancelConsolidation('paid', 'ready')).toBe(true);
		expect(canCancelConsolidation('paid', 'picked_up')).toBe(false);
		expect(canCancelConsolidation('delivered', null)).toBe(false);
		const storedAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
		expect(isLongStay(storedAt)).toBe(true);
		expect(isLongStay(new Date().toISOString())).toBe(false);
	});
});
