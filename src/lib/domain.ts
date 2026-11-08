export const ROLES = ['customer', 'warehouse', 'support', 'delivery', 'management', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_HOME: Record<Role, string> = {
	customer: '/app',
	warehouse: '/warehouse',
	support: '/support',
	delivery: '/delivery',
	management: '/manage',
	admin: '/admin'
};

export const PACKAGE_STATUSES = [
	'pre_registered',
	'arrived',
	'measured',
	'stored',
	'in_consolidation',
	'out_for_delivery',
	'delivered',
	'abnormal',
	'returned'
] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export const CONSOLIDATION_STATUSES = [
	'submitted',
	'awaiting_payment',
	'rejected',
	'paid',
	'out_for_delivery',
	'delivered',
	'cancelled'
] as const;
export type ConsolidationStatus = (typeof CONSOLIDATION_STATUSES)[number];

export const SHIPPING_METHODS = ['express', 'air', 'sea'] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const CLAIM_TYPES = ['damaged', 'missing', 'wrong_item', 'other'] as const;
export type ClaimType = (typeof CLAIM_TYPES)[number];

export const CARRIERS = [
	'SF Express 顺丰',
	'ZTO Express 中通',
	'YTO Express 圆通',
	'STO Express 申通',
	'Yunda 韵达',
	'JD Logistics 京东物流',
	'China Post EMS 中国邮政',
	'Cainiao 菜鸟',
	'J&T Express 极兔'
] as const;

export const DELIVERY_REGIONS = [
	{ code: 'HK', name: 'Hong Kong' },
	{ code: 'TW', name: 'Taiwan' },
	{ code: 'MO', name: 'Macau' }
] as const;
export type DeliveryRegion = (typeof DELIVERY_REGIONS)[number]['code'];

export function isDeliveryRegion(value: string): value is DeliveryRegion {
	return DELIVERY_REGIONS.some((region) => region.code === value);
}

export function regionName(code: string): string {
	return DELIVERY_REGIONS.find((region) => region.code === code)?.name ?? code;
}

export const MAX_TEXT = 80;
export const MAX_SIDE_CM = 200;
export const LONG_STAY_MS = 14 * 24 * 60 * 60 * 1000;

const EMOJI = /\p{Extended_Pictographic}/u;

export type TrackingEvent = {
	at: string;
	location: string;
	description: string;
	source: 'carrier' | 'warehouse' | 'system';
};

export type AddressInput = {
	recipient: string;
	phone: string;
	line1: string;
	line2: string;
	city: string;
	country: string;
};

export type FeeQuote = {
	shipping: number;
	service: number;
	handling: number;
	total: number;
};

const RATES: Record<ShippingMethod, { perKg: number; service: number }> = {
	express: { perKg: 12, service: 8 },
	air: { perKg: 8, service: 6 },
	sea: { perKg: 4, service: 5 }
};

export function isRole(value: string): value is Role {
	return (ROLES as readonly string[]).includes(value);
}

export function validateWeight(weightKg: number): string | null {
	if (!Number.isFinite(weightKg) || weightKg <= 0) return 'Weight must be greater than 0';
	return null;
}

export function validateDimension(label: string, cm: number): string | null {
	if (!Number.isFinite(cm) || cm <= 0) return `${label} must be greater than 0`;
	if (cm > MAX_SIDE_CM) return `${label} cannot exceed ${MAX_SIDE_CM} cm`;
	return null;
}

export function validateDimensions(lengthCm: number, widthCm: number, heightCm: number): string | null {
	return (
		validateDimension('Length', lengthCm) ||
		validateDimension('Width', widthCm) ||
		validateDimension('Height', heightCm)
	);
}

export function volumeWeightKg(lengthCm: number, widthCm: number, heightCm: number): number {
	return round2((lengthCm * widthCm * heightCm) / 5000);
}

export function chargeableKg(actualKg: number, volumeKg: number): number {
	return round2(Math.max(actualKg, volumeKg));
}

export function validatePhone(phone: string): string | null {
	if (!/^\+(852\d{8}|853\d{8}|886\d{8,10})$/.test(phone.trim())) {
		return 'Use a Hong Kong (+852), Macau (+853), or Taiwan (+886) number';
	}
	return null;
}

export function validateText(label: string, value: string, max = MAX_TEXT): string | null {
	const trimmed = value.trim();
	if (!trimmed) return `${label} is required`;
	if (trimmed.length > max) return `${label} must be ${max} characters or fewer`;
	if (EMOJI.test(trimmed)) return `${label} cannot contain emoji`;
	return null;
}

export function validateAddress(input: AddressInput): string | null {
	return (
		validateText('Recipient', input.recipient) ||
		validatePhone(input.phone) ||
		validateText('Address line', input.line1) ||
		(input.line2.trim() ? validateText('Address line 2', input.line2) : null) ||
		validateText('City', input.city) ||
		(isDeliveryRegion(input.country.trim()) ? null : 'Choose Hong Kong, Taiwan, or Macau')
	);
}

export function validateTrackingNumber(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return 'Tracking number is required';
	if (trimmed.length > 40) return 'Tracking number must be 40 characters or fewer';
	if (!/^[A-Za-z0-9-]+$/.test(trimmed)) {
		return 'Tracking number can only contain letters, numbers, and dashes';
	}
	return null;
}

export function duplicateTrackingMessage(exists: boolean): string | null {
	return exists ? 'A package with this tracking number already exists' : null;
}

export function validateFee(amount: number): string | null {
	if (!Number.isFinite(amount) || amount < 0) return 'Delivery fee cannot be negative';
	if (amount > 100000) return 'Delivery fee is too large';
	return null;
}

export function quote(method: ShippingMethod, chargeableWeight: number, handling = 0): FeeQuote {
	const rate = RATES[method];
	const shipping = round2(chargeableWeight * rate.perKg);
	const service = rate.service;
	const handlingFee = round2(handling);
	return {
		shipping,
		service,
		handling: handlingFee,
		total: round2(shipping + service + handlingFee)
	};
}

export function appendEvent(events: TrackingEvent[], event: TrackingEvent): TrackingEvent[] {
	return [...events, event];
}

export function mergeEvents(existing: TrackingEvent[], incoming: TrackingEvent[]): TrackingEvent[] {
	const key = (event: TrackingEvent) => `${event.source}|${event.at}|${event.description}`;
	const seen = new Set(existing.map(key));
	const next = [...existing];
	for (const event of incoming) {
		const id = key(event);
		if (seen.has(id)) continue;
		seen.add(id);
		next.push(event);
	}
	return next;
}

export function cancelPackages<T extends { status: string; events: TrackingEvent[] }>(packages: T[]): T[] {
	return packages.map((pkg) => ({ ...pkg, status: 'stored' }));
}

export function canCancelConsolidation(status: string, deliveryStatus: string | null): boolean {
	if (status !== 'submitted' && status !== 'awaiting_payment' && status !== 'paid') return false;
	if (deliveryStatus && deliveryStatus !== 'ready') return false;
	return true;
}

export function isLongStay(storedAt: string | null, now = Date.now()): boolean {
	if (!storedAt) return false;
	const time = Date.parse(storedAt);
	if (Number.isNaN(time)) return false;
	return now - time > LONG_STAY_MS;
}

export function isShippingMethod(value: string): value is ShippingMethod {
	return (SHIPPING_METHODS as readonly string[]).includes(value);
}

export function isClaimType(value: string): value is ClaimType {
	return (CLAIM_TYPES as readonly string[]).includes(value);
}

export function round2(value: number): number {
	return Math.round(value * 100) / 100;
}
