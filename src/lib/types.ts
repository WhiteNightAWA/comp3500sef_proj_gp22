import type { ConsolidationStatus, PackageStatus, ShippingMethod, TrackingEvent } from './domain';

export type AddressView = {
	id: string;
	label: string;
	recipient: string;
	phone: string;
	line1: string;
	line2: string;
	city: string;
	country: string;
	selected: boolean;
	verifiedAt: string | null;
};

export type PackageView = {
	id: string;
	customerId: string | null;
	memberCode: string | null;
	trackingNumber: string;
	carrier: string;
	description: string;
	status: PackageStatus;
	arrivalAt: string | null;
	estimatedDeparture: string | null;
	zoneId: string | null;
	zoneName: string | null;
	shelf: string | null;
	weightKg: number | null;
	lengthCm: number | null;
	widthCm: number | null;
	heightCm: number | null;
	volumeWeightKg: number | null;
	deliveryFee: number;
	furtherAction: string | null;
	mismatchNote: string | null;
	events: TrackingEvent[];
	eta: string | null;
	storedAt: string | null;
	longStay: boolean;
	consolidationId: string | null;
	createdAt: string;
	updatedAt: string;
};

export type FeeView = {
	shipping: number;
	service: number;
	handling: number;
	total: number;
};

export type ConsolidationView = {
	id: string;
	customerId: string;
	memberCode: string | null;
	packageIds: string[];
	packages: PackageView[];
	address: AddressView;
	method: ShippingMethod;
	status: ConsolidationStatus;
	chargeableWeight: number | null;
	fee: FeeView | null;
	verificationNote: string | null;
	createdAt: string;
	updatedAt: string;
	canCancel: boolean;
};

export type ClaimView = {
	id: string;
	packageId: string;
	trackingNumber: string;
	memberCode: string | null;
	type: string;
	description: string;
	status: 'open' | 'resolved' | 'rejected';
	resolution: string | null;
	createdAt: string;
	updatedAt: string;
};

export type NotificationView = {
	id: string;
	message: string;
	href: string;
	readAt: string | null;
	createdAt: string;
};

export type ZoneView = {
	id: string;
	name: string;
	open: boolean;
	storedCount: number;
};

export type DeliveryView = {
	id: string;
	consolidationId: string;
	memberCode: string | null;
	pickupLines: string[];
	destination: {
		recipient: string;
		line1: string;
		line2: string;
		city: string;
		country: string;
	};
	status: 'ready' | 'picked_up' | 'delivered' | 'cancelled';
	departureAt: string | null;
	deliveredAt: string | null;
	createdAt: string;
};

export type AccountView = {
	id: string;
	name: string;
	email: string;
	role: string;
	disabled: boolean;
	memberCode: string | null;
};

export type AnalyticsView = {
	chain: { status: string; count: number }[];
	openClaims: number;
	paidPayments: number;
	zones: ZoneView[];
	flow: { day: string; count: number }[];
};
