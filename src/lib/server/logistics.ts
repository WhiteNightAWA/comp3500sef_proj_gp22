import { ObjectId, type Filter } from 'mongodb';
import { auth } from './auth';
import { userIdFilter } from './auth-core';
import { db, client } from './db';
import { RuleError } from './errors';
import { carrierTimeline } from './tracking';
import { chargeCard } from './payments';
import type {
	AccountView,
	AddressView,
	AnalyticsView,
	ClaimView,
	ConsolidationView,
	DeliveryView,
	NotificationView,
	PackageView,
	ZoneView
} from '#lib/types';
import {
	type AddressInput,
	type ClaimType,
	type PackageStatus,
	type Role,
	type ShippingMethod,
	type TrackingEvent,
	CARRIERS,
	appendEvent,
	canCancelConsolidation,
	chargeableKg,
	duplicateTrackingMessage,
	isClaimType,
	isLongStay,
	isRole,
	isShippingMethod,
	quote,
	round2,
	validateAddress,
	validateDimensions,
	validateFee,
	validateText,
	validateTrackingNumber,
	validateWeight,
	volumeWeightKg
} from '#lib/domain';

type Actor = NonNullable<App.Locals['user']>;

type PackageDoc = {
	_id: ObjectId;
	customerId: string | null;
	memberCode: string | null;
	trackingNumber: string;
	carrier: string;
	description: string;
	status: PackageStatus;
	arrivalAt: string | null;
	estimatedDeparture: string | null;
	zoneId: string | null;
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
	consolidationId: string | null;
	createdAt: string;
	updatedAt: string;
};

type AddressDoc = AddressInput & {
	_id: ObjectId;
	userId: string;
	label?: string;
	selected?: boolean;
	verifiedAt: string | null;
};

type ConsolidationDoc = {
	_id: ObjectId;
	customerId: string;
	memberCode: string | null;
	packageIds: string[];
	address: AddressDoc;
	method: ShippingMethod;
	status: ConsolidationView['status'];
	chargeableWeight: number | null;
	fee: ConsolidationView['fee'];
	verificationNote: string | null;
	createdAt: string;
	updatedAt: string;
};

const packages = () => db.collection<PackageDoc>('packages');
const addresses = () => db.collection<AddressDoc>('addresses');
const consolidations = () => db.collection<ConsolidationDoc>('consolidations');
const claims = () => db.collection('claims');
const notifications = () => db.collection('notifications');
const zones = () => db.collection<{ name: string; open: boolean }>('zones');
const deliveries = () => db.collection('deliveries');
const payments = () => db.collection('payments');
const users = () => db.collection('user');

let ready: Promise<void> | null = null;

export function ensureReady(): Promise<void> {
	ready ??= setup();
	return ready;
}

async function setup(): Promise<void> {
	await packages().createIndex({ trackingNumber: 1 }, { unique: true });
	await packages().createIndex({ customerId: 1 });
	await packages().createIndex({ status: 1 });
	await addresses().createIndex({ userId: 1 });
	await notifications().createIndex({ userId: 1, kind: 1 }, { unique: true });
	if ((await zones().countDocuments()) === 0) {
		await zones().insertMany([
			{ name: 'Zone A', open: true },
			{ name: 'Zone B', open: true },
			{ name: 'Zone C', open: false }
		]);
	}
}

function nowIso(): string {
	return new Date().toISOString();
}

function parseId(id: string, label = 'Record'): ObjectId {
	if (!ObjectId.isValid(id) || new ObjectId(id).toHexString() !== id) {
		throw new RuleError(`${label} not found`);
	}
	return new ObjectId(id);
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isDuplicate(error: unknown): boolean {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

function toIso(value: string, label: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) throw new RuleError(`${label} is not a valid time`);
	return date.toISOString();
}

async function zoneNameMap(): Promise<Map<string, { name: string; open: boolean }>> {
	const docs = await zones().find().toArray();
	return new Map(docs.map((zone) => [zone._id.toString(), { name: zone.name, open: zone.open }]));
}

function toPackage(doc: PackageDoc, names: Map<string, { name: string; open: boolean }>): PackageView {
	const zone = doc.zoneId ? names.get(doc.zoneId) : undefined;
	return {
		id: doc._id.toString(),
		customerId: doc.customerId,
		memberCode: doc.memberCode,
		trackingNumber: doc.trackingNumber,
		carrier: doc.carrier,
		description: doc.description,
		status: doc.status,
		arrivalAt: doc.arrivalAt,
		estimatedDeparture: doc.estimatedDeparture,
		zoneId: doc.zoneId,
		zoneName: zone?.name ?? null,
		shelf: doc.shelf,
		weightKg: doc.weightKg,
		lengthCm: doc.lengthCm,
		widthCm: doc.widthCm,
		heightCm: doc.heightCm,
		volumeWeightKg: doc.volumeWeightKg,
		deliveryFee: doc.deliveryFee ?? 0,
		furtherAction: doc.furtherAction,
		mismatchNote: doc.mismatchNote,
		events: doc.events ?? [],
		eta: doc.eta,
		storedAt: doc.storedAt,
		longStay: doc.status === 'stored' && isLongStay(doc.storedAt),
		consolidationId: doc.consolidationId,
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt
	};
}

async function presentPackages(docs: PackageDoc[]): Promise<PackageView[]> {
	const names = await zoneNameMap();
	const views = docs.map((doc) => toPackage(doc, names));
	await flagLongStays(views);
	return views;
}

async function flagLongStays(views: PackageView[]): Promise<void> {
	for (const pkg of views) {
		if (!pkg.longStay || !pkg.customerId) continue;
		await notifyOnce(
			pkg.customerId,
			`long_stay:${pkg.id}`,
			`Parcel ${pkg.trackingNumber} has been stored for more than 14 days and may need to be returned.`,
			`/app/packages/${pkg.id}`
		);
	}
}

async function notifyOnce(userId: string, kind: string, message: string, href: string): Promise<void> {
	await notifications().updateOne(
		{ userId, kind },
		{
			$setOnInsert: {
				userId,
				kind,
				message,
				href,
				createdAt: nowIso(),
				readAt: null
			}
		},
		{ upsert: true }
	);
}

async function requirePackage(id: string, customerId?: string): Promise<PackageDoc> {
	const filter: Filter<PackageDoc> = { _id: parseId(id, 'Package') };
	if (customerId) filter.customerId = customerId;
	const doc = await packages().findOne(filter);
	if (!doc) throw new RuleError('Package not found');
	return doc;
}

async function requireOpenZone(zoneId: string): Promise<{ id: string; name: string }> {
	const doc = await zones().findOne({ _id: parseId(zoneId, 'Zone') });
	if (!doc) throw new RuleError('Zone not found');
	if (!doc.open) throw new RuleError('That warehouse zone is closed');
	return { id: doc._id.toString(), name: doc.name };
}

function event(description: string, location: string, at = nowIso()): TrackingEvent {
	return { at, location, description, source: 'warehouse' };
}

export async function findAccount(id: string): Promise<AccountView | null> {
	const doc = await users().findOne(userIdFilter(id));
	if (!doc) return null;
	return {
		id: String(doc._id),
		name: String(doc.name ?? ''),
		email: String(doc.email ?? ''),
		role: String(doc.role ?? 'customer'),
		disabled: Boolean(doc.disabled),
		memberCode: doc.memberCode ? String(doc.memberCode) : null
	};
}

export async function updateProfile(userId: string, input: { name: string; email: string }): Promise<void> {
	const nameError = validateText('Name', input.name, 60);
	if (nameError) throw new RuleError(nameError);
	const email = input.email.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new RuleError('Email is not valid');
	if (email.length > 120) throw new RuleError('Email must be 120 characters or fewer');
	const filter = userIdFilter(userId);
	const taken = await users().findOne({ email, _id: { $ne: filter._id } });
	if (taken) throw new RuleError('That email is already in use');
	const result = await users().updateOne(filter, { $set: { name: input.name.trim(), email } });
	if (result.matchedCount === 0) throw new RuleError('Account not found');
}

export async function listAccounts(): Promise<AccountView[]> {
	const docs = await users().find({}, { projection: { name: 1, email: 1, role: 1, disabled: 1, memberCode: 1 } }).sort({ role: 1, email: 1 }).toArray();
	return docs.map((doc) => ({
		id: String(doc._id),
		name: String(doc.name ?? ''),
		email: String(doc.email ?? ''),
		role: String(doc.role ?? 'customer'),
		disabled: Boolean(doc.disabled),
		memberCode: doc.memberCode ? String(doc.memberCode) : null
	}));
}

export async function setAccountDisabled(actorId: string, targetId: string, disabled: boolean): Promise<void> {
	if (actorId === targetId) throw new RuleError('You cannot disable your own account');
	const result = await users().updateOne(userIdFilter(targetId), { $set: { disabled } });
	if (result.matchedCount === 0) throw new RuleError('Account not found');
}

export async function createStaff(
	input: { name: string; email: string; password: string; role: string },
	headers: Headers
): Promise<void> {
	const nameError = validateText('Name', input.name, 60);
	if (nameError) throw new RuleError(nameError);
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new RuleError('Email is not valid');
	if (input.password.length < 8) throw new RuleError('Password must be at least 8 characters');
	if (!isRole(input.role) || input.role === 'customer') throw new RuleError('Choose a staff role');
	await auth.api.signUpEmail({
		body: { name: input.name.trim(), email: input.email.trim(), password: input.password },
		headers
	});
	await users().updateOne(
		{ email: input.email.trim().toLowerCase() },
		{ $set: { role: input.role }, $unset: { memberCode: '' } }
	);
}

function toAddress(doc: AddressDoc): AddressView {
	return {
		id: doc._id.toString(),
		label: doc.label?.trim() || 'Address',
		recipient: doc.recipient,
		phone: doc.phone,
		line1: doc.line1,
		line2: doc.line2,
		city: doc.city,
		country: doc.country,
		selected: Boolean(doc.selected),
		verifiedAt: doc.verifiedAt
	};
}

async function loadAddresses(userId: string): Promise<AddressDoc[]> {
	const docs = await addresses().find({ userId }).sort({ _id: 1 }).toArray();
	if (docs.length > 0 && !docs.some((doc) => doc.selected)) {
		await addresses().updateOne({ _id: docs[0]?._id }, { $set: { selected: true, label: docs[0]?.label?.trim() || 'Home' } });
		if (docs[0]) {
			docs[0].selected = true;
			docs[0].label = docs[0].label?.trim() || 'Home';
		}
	}
	return docs;
}

export async function listAddresses(userId: string): Promise<AddressView[]> {
	return (await loadAddresses(userId)).map(toAddress);
}

export async function addAddress(userId: string, input: AddressInput & { label: string }): Promise<void> {
	const labelError = validateText('Label', input.label, 40);
	if (labelError) throw new RuleError(labelError);
	const error = validateAddress(input);
	if (error) throw new RuleError(error);
	const existing = await addresses().countDocuments({ userId });
	await addresses().insertOne({
		_id: new ObjectId(),
		userId,
		label: input.label.trim(),
		recipient: input.recipient.trim(),
		phone: input.phone.trim(),
		line1: input.line1.trim(),
		line2: input.line2.trim(),
		city: input.city.trim(),
		country: input.country.trim(),
		selected: existing === 0,
		verifiedAt: nowIso()
	});
}

export async function selectAddress(userId: string, id: string): Promise<void> {
	const addressId = parseId(id, 'Address');
	const doc = await addresses().findOne({ _id: addressId, userId });
	if (!doc) throw new RuleError('Address not found');
	await addresses().updateMany({ userId }, { $set: { selected: false } });
	await addresses().updateOne({ _id: addressId, userId }, { $set: { selected: true } });
}

export async function removeAddress(userId: string, id: string): Promise<void> {
	const addressId = parseId(id, 'Address');
	const doc = await addresses().findOne({ _id: addressId, userId });
	if (!doc) throw new RuleError('Address not found');
	await addresses().deleteOne({ _id: addressId, userId });
	if (doc.selected) {
		const next = await addresses().findOne({ userId });
		if (next) await addresses().updateOne({ _id: next._id }, { $set: { selected: true } });
	}
}

export async function listCustomerPackages(userId: string): Promise<PackageView[]> {
	const docs = await packages().find({ customerId: userId }).sort({ updatedAt: -1 }).toArray();
	return presentPackages(docs);
}

export async function getCustomerPackage(userId: string, id: string): Promise<PackageView> {
	const doc = await requirePackage(id, userId);
	const [view] = await presentPackages([doc]);
	return view;
}

export async function preRegister(
	user: Actor,
	input: { trackingNumber: string; carrier: string; description: string }
): Promise<void> {
	const trackingError = validateTrackingNumber(input.trackingNumber);
	if (trackingError) throw new RuleError(trackingError);
	if (!(CARRIERS as readonly string[]).includes(input.carrier)) throw new RuleError('Choose a carrier');
	const descriptionError = validateText('Description', input.description, 200);
	if (descriptionError) throw new RuleError(descriptionError);
	const trackingNumber = input.trackingNumber.trim();
	const exists = await packages().findOne({ trackingNumber });
	const duplicate = duplicateTrackingMessage(Boolean(exists));
	if (duplicate) throw new RuleError(duplicate);
	const timeline = carrierTimeline(trackingNumber);
	const now = nowIso();
	try {
		await packages().insertOne({
			_id: new ObjectId(),
			customerId: user.id,
			memberCode: user.memberCode,
			trackingNumber,
			carrier: input.carrier,
			description: input.description.trim(),
			status: 'pre_registered',
			arrivalAt: null,
			estimatedDeparture: null,
			zoneId: null,
			shelf: null,
			weightKg: null,
			lengthCm: null,
			widthCm: null,
			heightCm: null,
			volumeWeightKg: null,
			deliveryFee: 0,
			furtherAction: null,
			mismatchNote: null,
			events: timeline.events,
			eta: timeline.eta,
			storedAt: null,
			consolidationId: null,
			createdAt: now,
			updatedAt: now
		});
	} catch (error) {
		if (isDuplicate(error)) throw new RuleError(duplicateTrackingMessage(true) ?? 'Duplicate tracking number');
		throw error;
	}
}

export async function refreshTracking(id: string, customerId?: string): Promise<void> {
	const doc = await requirePackage(id, customerId);
	const timeline = carrierTimeline(doc.trackingNumber);
	const stillValid = doc.events.filter(
		(item) =>
			item.source !== 'carrier' ||
			timeline.events.some((carrier) => carrier.at === item.at && carrier.description === item.description)
	);
	const events = stillValid.concat(
		timeline.events.filter(
			(carrier) =>
				!stillValid.some(
					(item) => item.source === 'carrier' && item.at === carrier.at && item.description === carrier.description
				)
		)
	);
	await packages().updateOne(
		{ _id: doc._id },
		{ $set: { events, eta: timeline.eta, updatedAt: nowIso() } }
	);
}

export async function listWarehousePackages(query: string): Promise<PackageView[]> {
	const filter: Filter<PackageDoc> = {};
	const q = query.trim();
	if (q) {
		const pattern = escapeRegex(q);
		filter.$or = [{ trackingNumber: { $regex: pattern, $options: 'i' } }, { memberCode: { $regex: pattern, $options: 'i' } }];
	}
	const docs = await packages().find(filter).sort({ updatedAt: -1 }).limit(100).toArray();
	return presentPackages(docs);
}

export async function getWarehousePackage(id: string): Promise<PackageView> {
	const doc = await requirePackage(id);
	const [view] = await presentPackages([doc]);
	return view;
}

export async function listOpenZones(): Promise<ZoneView[]> {
	const docs = await zones().find({ open: true }).sort({ name: 1 }).toArray();
	return docs.map((zone) => ({ id: zone._id.toString(), name: zone.name, open: true, storedCount: 0 }));
}

export async function registerArrival(input: {
	trackingNumber: string;
	carrier: string;
	description: string;
	arrivalAt: string;
	estimatedDeparture: string;
	zoneId: string;
	deliveryFee: string;
	furtherAction: string;
}): Promise<string> {
	const trackingError = validateTrackingNumber(input.trackingNumber);
	if (trackingError) throw new RuleError(trackingError);
	if (!(CARRIERS as readonly string[]).includes(input.carrier)) throw new RuleError('Choose a carrier');
	const descriptionError = validateText('Description', input.description || 'Arrived parcel', 200);
	if (descriptionError) throw new RuleError(descriptionError);
	const arrivalAt = toIso(input.arrivalAt, 'Arrival time');
	const estimatedDeparture = input.estimatedDeparture.trim() ? toIso(input.estimatedDeparture, 'Estimated departure') : null;
	const furtherAction = input.furtherAction.trim();
	if (furtherAction) {
		const furtherError = validateText('Further action', furtherAction, 200);
		if (furtherError) throw new RuleError(furtherError);
	}
	const fee = input.deliveryFee.trim() === '' ? 0 : Number(input.deliveryFee);
	const feeError = validateFee(fee);
	if (feeError) throw new RuleError(feeError);
	const zone = await requireOpenZone(input.zoneId);
	const trackingNumber = input.trackingNumber.trim();
	const existing = await packages().findOne({ trackingNumber });
	const arrivalEvent = event('Registered at warehouse', zone.name, arrivalAt);
	const now = nowIso();
	if (existing) {
		if (existing.status !== 'pre_registered' && existing.status !== 'abnormal') {
			throw new RuleError('This package is already in the warehouse');
		}
		await packages().updateOne(
			{ _id: existing._id },
			{
				$set: {
					status: existing.customerId ? 'arrived' : 'abnormal',
					carrier: input.carrier,
					description: input.description.trim() || existing.description,
					arrivalAt,
					estimatedDeparture,
					zoneId: zone.id,
					deliveryFee: fee,
					furtherAction: furtherAction || null,
					events: appendEvent(existing.events, arrivalEvent),
					updatedAt: now
				}
			}
		);
		if (existing.customerId) {
			await notifyOnce(
				existing.customerId,
				`arrived:${existing._id.toString()}`,
				`Parcel ${trackingNumber} arrived at the warehouse.`,
				`/app/packages/${existing._id.toString()}`
			);
		}
		return existing._id.toString();
	}
	const inserted = await packages().insertOne({
		_id: new ObjectId(),
		customerId: null,
		memberCode: null,
		trackingNumber,
		carrier: input.carrier,
		description: input.description.trim() || 'Arrived parcel',
		status: 'abnormal',
		arrivalAt,
		estimatedDeparture,
		zoneId: zone.id,
		shelf: null,
		weightKg: null,
		lengthCm: null,
		widthCm: null,
		heightCm: null,
		volumeWeightKg: null,
		deliveryFee: fee,
		furtherAction: furtherAction || 'Unknown owner',
		mismatchNote: null,
		events: [arrivalEvent],
		eta: null,
		storedAt: null,
		consolidationId: null,
		createdAt: now,
		updatedAt: now
	});
	return inserted.insertedId.toString();
}

export async function measurePackage(
	id: string,
	input: { weightKg: number; lengthCm: number; widthCm: number; heightCm: number }
): Promise<void> {
	const doc = await requirePackage(id);
	if (doc.status !== 'arrived' && doc.status !== 'measured') {
		throw new RuleError('Weigh a package after it has arrived');
	}
	const weightError = validateWeight(input.weightKg);
	if (weightError) throw new RuleError(weightError);
	const dimensionError = validateDimensions(input.lengthCm, input.widthCm, input.heightCm);
	if (dimensionError) throw new RuleError(dimensionError);
	const volume = volumeWeightKg(input.lengthCm, input.widthCm, input.heightCm);
	await packages().updateOne(
		{ _id: doc._id },
		{
			$set: {
				status: 'measured',
				weightKg: round2(input.weightKg),
				lengthCm: input.lengthCm,
				widthCm: input.widthCm,
				heightCm: input.heightCm,
				volumeWeightKg: volume,
				events: appendEvent(doc.events, event('Weighed and measured', doc.shelf ?? 'Warehouse')),
				updatedAt: nowIso()
			}
		}
	);
}

export async function storePackage(id: string, zoneId: string, shelf: string): Promise<void> {
	const doc = await requirePackage(id);
	if (doc.status !== 'measured' && doc.status !== 'stored') {
		throw new RuleError('Measure the package before putting it on a shelf');
	}
	const zone = await requireOpenZone(zoneId);
	const shelfError = validateText('Shelf', shelf, 20);
	if (shelfError) throw new RuleError(shelfError);
	const now = nowIso();
	await packages().updateOne(
		{ _id: doc._id },
		{
			$set: {
				status: 'stored',
				zoneId: zone.id,
				shelf: shelf.trim(),
				storedAt: doc.storedAt ?? now,
				events: appendEvent(doc.events, event(`Stored at ${zone.name} / ${shelf.trim()}`, zone.name)),
				updatedAt: now
			}
		}
	);
}

export async function flagMismatch(id: string, note: string): Promise<void> {
	const doc = await requirePackage(id);
	const noteError = validateText('Mismatch note', note, 200);
	if (noteError) throw new RuleError(noteError);
	await packages().updateOne(
		{ _id: doc._id },
		{
			$set: {
				mismatchNote: note.trim(),
				furtherAction: 'Declaration does not match the parcel',
				events: appendEvent(doc.events, event('Declaration mismatch flagged', 'Warehouse')),
				updatedAt: nowIso()
			}
		}
	);
	if (doc.customerId) {
		await notifyOnce(
			doc.customerId,
			`mismatch:${doc._id.toString()}`,
			`Parcel ${doc.trackingNumber} needs your attention: the declaration does not match the parcel.`,
			`/app/packages/${doc._id.toString()}`
		);
	}
}

export async function markReturn(id: string): Promise<void> {
	const doc = await requirePackage(id);
	if (doc.status !== 'stored') throw new RuleError('Only stored parcels can be marked for return');
	await packages().updateOne(
		{ _id: doc._id },
		{
			$set: {
				status: 'returned',
				furtherAction: 'Returned after a long stay',
				events: appendEvent(doc.events, event('Marked for return', doc.shelf ?? 'Warehouse')),
				updatedAt: nowIso()
			}
		}
	);
	if (doc.customerId) {
		await notifyOnce(
			doc.customerId,
			`return:${doc._id.toString()}`,
			`Parcel ${doc.trackingNumber} was marked for return.`,
			`/app/packages/${doc._id.toString()}`
		);
	}
}

async function toConsolidation(doc: ConsolidationDoc, deliveryStatus: string | null): Promise<ConsolidationView> {
	const docs = await packages().find({ _id: { $in: doc.packageIds.map((id) => new ObjectId(id)) } }).toArray();
	const byId = new Map(docs.map((pkg) => [pkg._id.toString(), pkg]));
	const ordered = doc.packageIds.map((id) => byId.get(id)).filter((pkg): pkg is PackageDoc => Boolean(pkg));
	const presented = await presentPackages(ordered);
	return {
		id: doc._id.toString(),
		customerId: doc.customerId,
		memberCode: doc.memberCode,
		packageIds: doc.packageIds,
		packages: presented,
		address: {
			id: doc.address._id?.toString() ?? '',
			label: doc.address.label?.trim() || 'Delivery',
			selected: true,
			recipient: doc.address.recipient,
			phone: doc.address.phone,
			line1: doc.address.line1,
			line2: doc.address.line2,
			city: doc.address.city,
			country: doc.address.country,
			verifiedAt: doc.address.verifiedAt
		},
		method: doc.method,
		status: doc.status,
		chargeableWeight: doc.chargeableWeight,
		fee: doc.fee,
		verificationNote: doc.verificationNote,
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt,
		canCancel: canCancelConsolidation(doc.status, deliveryStatus)
	};
}

async function deliveryStatusFor(ids: string[]): Promise<Map<string, string>> {
	const docs = await deliveries().find({ consolidationId: { $in: ids } }).toArray();
	return new Map(docs.map((doc) => [String(doc.consolidationId), String(doc.status)]));
}

export async function listCustomerConsolidations(userId: string): Promise<ConsolidationView[]> {
	const docs = await consolidations().find({ customerId: userId }).sort({ createdAt: -1 }).toArray();
	const statuses = await deliveryStatusFor(docs.map((doc) => doc._id.toString()));
	return Promise.all(docs.map((doc) => toConsolidation(doc, statuses.get(doc._id.toString()) ?? null)));
}

export async function getConsolidation(id: string, customerId?: string): Promise<ConsolidationView> {
	const filter: Filter<ConsolidationDoc> = { _id: parseId(id, 'Consolidation') };
	if (customerId) filter.customerId = customerId;
	const doc = await consolidations().findOne(filter);
	if (!doc) throw new RuleError('Consolidation not found');
	const delivery = await deliveries().findOne({ consolidationId: doc._id.toString() });
	return toConsolidation(doc, delivery ? String(delivery.status) : null);
}

export async function listSubmittedConsolidations(): Promise<ConsolidationView[]> {
	const docs = await consolidations().find({ status: 'submitted' }).sort({ createdAt: 1 }).toArray();
	return Promise.all(docs.map((doc) => toConsolidation(doc, null)));
}

export async function submitConsolidation(user: Actor, packageIds: string[], method: string): Promise<string> {
	if (!isShippingMethod(method)) throw new RuleError('Choose a shipping method');
	const unique = [...new Set(packageIds)];
	if (unique.length < 2) throw new RuleError('Choose at least two stored packages');
	const saved = await loadAddresses(user.id);
	const address = saved.find((item) => item.selected) ?? null;
	if (!address?.verifiedAt) throw new RuleError('Choose a delivery address for Hong Kong, Taiwan, or Macau');
	const docs = await packages()
		.find({ _id: { $in: unique.map((id) => parseId(id, 'Package')) }, customerId: user.id, status: 'stored' })
		.toArray();
	if (docs.length !== unique.length) throw new RuleError('Only your stored packages can be consolidated');
	const now = nowIso();
	const inserted = await consolidations().insertOne({
		_id: new ObjectId(),
		customerId: user.id,
		memberCode: user.memberCode,
		packageIds: unique,
		address,
		method,
		status: 'submitted',
		chargeableWeight: null,
		fee: null,
		verificationNote: null,
		createdAt: now,
		updatedAt: now
	});
	const consolidationId = inserted.insertedId.toString();
	for (const doc of docs) {
		await packages().updateOne(
			{ _id: doc._id },
			{
				$set: {
					status: 'in_consolidation',
					consolidationId,
					events: appendEvent(doc.events, event('Added to a consolidation', doc.shelf ?? 'Warehouse')),
					updatedAt: now
				}
			}
		);
	}
	return consolidationId;
}

export async function verifyConsolidation(id: string, approve: boolean, note: string): Promise<void> {
	const doc = await consolidations().findOne({ _id: parseId(id, 'Consolidation') });
	if (!doc || doc.status !== 'submitted') throw new RuleError('This consolidation is not waiting for verification');
	const trimmed = note.trim();
	if (trimmed) {
		const noteError = validateText('Note', trimmed, 200);
		if (noteError) throw new RuleError(noteError);
	}
	const docs = await packages().find({ _id: { $in: doc.packageIds.map((pkgId) => new ObjectId(pkgId)) } }).toArray();
	const now = nowIso();
	if (!approve) {
		await consolidations().updateOne(
			{ _id: doc._id },
			{ $set: { status: 'rejected', verificationNote: trimmed || 'Rejected', updatedAt: now } }
		);
		for (const pkg of docs) {
			await packages().updateOne(
				{ _id: pkg._id },
				{
					$set: {
						status: 'stored',
						consolidationId: null,
						events: appendEvent(pkg.events, event('Consolidation rejected', pkg.shelf ?? 'Warehouse')),
						updatedAt: now
					}
				}
			);
		}
		return;
	}
	let chargeable = 0;
	let handling = 0;
	for (const pkg of docs) {
		if (pkg.weightKg == null || pkg.volumeWeightKg == null || !pkg.shelf || !pkg.zoneId) {
			throw new RuleError(`Parcel ${pkg.trackingNumber} still needs weight and a shelf`);
		}
		chargeable += chargeableKg(pkg.weightKg, pkg.volumeWeightKg);
		handling += pkg.deliveryFee ?? 0;
	}
	const fee = quote(doc.method, round2(chargeable), handling);
	await consolidations().updateOne(
		{ _id: doc._id },
		{
			$set: {
				status: 'awaiting_payment',
				chargeableWeight: round2(chargeable),
				fee,
				verificationNote: trimmed || 'Verified',
				updatedAt: now
			}
		}
	);
}

export async function payConsolidation(userId: string, id: string, cardNumber: string): Promise<void> {
	const doc = await consolidations().findOne({ _id: parseId(id, 'Consolidation'), customerId: userId });
	if (!doc) throw new RuleError('Consolidation not found');
	if (doc.status !== 'awaiting_payment' || !doc.fee) throw new RuleError('This shipment is not awaiting payment');
	const result = chargeCard(cardNumber, doc.fee.total);
	const now = nowIso();
	if (!result.ok) {
		await payments().insertOne({
			consolidationId: doc._id.toString(),
			customerId: userId,
			amount: doc.fee.total,
			currency: 'USD',
			status: 'declined',
			gatewayRef: result.gatewayRef || 'gw_declined',
			createdAt: now
		});
		throw new RuleError('Payment was declined');
	}
	const names = await zoneNameMap();
	const docs = await packages().find({ _id: { $in: doc.packageIds.map((pkgId) => new ObjectId(pkgId)) } }).toArray();
	const pickupLines = docs.map((pkg) => {
		const zone = pkg.zoneId ? names.get(pkg.zoneId)?.name : 'Warehouse';
		return `${zone ?? 'Warehouse'} / ${pkg.shelf ?? 'unassigned'}`;
	});
	const session = client.startSession();
	try {
		await session.withTransaction(async () => {
			const fresh = await consolidations().findOne({ _id: doc._id }, { session });
			if (!fresh || fresh.status !== 'awaiting_payment') throw new RuleError('This shipment is not awaiting payment');
			await payments().insertOne(
				{
					consolidationId: doc._id.toString(),
					customerId: userId,
					amount: doc.fee!.total,
					currency: 'USD',
					status: 'paid',
					gatewayRef: result.gatewayRef,
					createdAt: now
				},
				{ session }
			);
			await consolidations().updateOne({ _id: doc._id }, { $set: { status: 'paid', updatedAt: now } }, { session });
			await deliveries().insertOne(
				{
					consolidationId: doc._id.toString(),
					memberCode: doc.memberCode,
					pickupLines,
					destination: {
						recipient: doc.address.recipient,
						line1: doc.address.line1,
						line2: doc.address.line2,
						city: doc.address.city,
						country: doc.address.country
					},
					status: 'ready',
					departureAt: null,
					deliveredAt: null,
					createdAt: now
				},
				{ session }
			);
		});
	} finally {
		await session.endSession();
	}
}

export async function cancelConsolidation(userId: string, id: string): Promise<void> {
	const doc = await consolidations().findOne({ _id: parseId(id, 'Consolidation'), customerId: userId });
	if (!doc) throw new RuleError('Consolidation not found');
	const delivery = await deliveries().findOne({ consolidationId: doc._id.toString() });
	if (!canCancelConsolidation(doc.status, delivery ? String(delivery.status) : null)) {
		throw new RuleError('This shipment can no longer be cancelled');
	}
	const now = nowIso();
	const session = client.startSession();
	try {
		await session.withTransaction(async () => {
			await consolidations().updateOne(
				{ _id: doc._id },
				{ $set: { status: 'cancelled', updatedAt: now } },
				{ session }
			);
			await packages().updateMany(
				{ consolidationId: doc._id.toString() },
				{ $set: { status: 'stored', consolidationId: null, updatedAt: now } },
				{ session }
			);
			if (delivery && delivery.status === 'ready') {
				await deliveries().updateOne({ _id: delivery._id }, { $set: { status: 'cancelled' } }, { session });
			}
		});
	} finally {
		await session.endSession();
	}
}

export async function listCustomerClaims(userId: string): Promise<ClaimView[]> {
	const docs = await claims().find({ customerId: userId }).sort({ createdAt: -1 }).toArray();
	return docs.map(toClaim);
}

export async function listOpenClaims(): Promise<ClaimView[]> {
	const docs = await claims().find({}).sort({ createdAt: -1 }).limit(100).toArray();
	return docs.map(toClaim);
}

function toClaim(doc: Record<string, unknown>): ClaimView {
	return {
		id: String(doc._id),
		packageId: String(doc.packageId),
		trackingNumber: String(doc.trackingNumber),
		memberCode: doc.memberCode ? String(doc.memberCode) : null,
		type: String(doc.type),
		description: String(doc.description),
		status: doc.status as ClaimView['status'],
		resolution: doc.resolution ? String(doc.resolution) : null,
		createdAt: String(doc.createdAt),
		updatedAt: String(doc.updatedAt)
	};
}

export async function openClaim(user: Actor, packageId: string, type: string, description: string): Promise<void> {
	if (!isClaimType(type)) throw new RuleError('Choose a claim type');
	const descriptionError = validateText('Description', description, 400);
	if (descriptionError) throw new RuleError(descriptionError);
	const doc = await requirePackage(packageId, user.id);
	const now = nowIso();
	await claims().insertOne({
		packageId: doc._id.toString(),
		customerId: user.id,
		memberCode: user.memberCode,
		trackingNumber: doc.trackingNumber,
		type: type as ClaimType,
		description: description.trim(),
		status: 'open',
		resolution: null,
		createdAt: now,
		updatedAt: now
	});
	await packages().updateOne(
		{ _id: doc._id },
		{
			$set: {
				events: appendEvent(doc.events, event(`Claim opened (${type})`, 'Customer service')),
				updatedAt: now
			}
		}
	);
}

export async function getClaim(id: string): Promise<ClaimView> {
	const doc = await claims().findOne({ _id: parseId(id, 'Claim') });
	if (!doc) throw new RuleError('Claim not found');
	return toClaim(doc as unknown as Record<string, unknown>);
}

export async function resolveClaim(id: string, decision: 'resolved' | 'rejected', resolution: string): Promise<void> {
	const doc = await claims().findOne({ _id: parseId(id, 'Claim') });
	if (!doc || doc.status !== 'open') throw new RuleError('This claim is not open');
	const resolutionError = validateText('Resolution', resolution, 400);
	if (resolutionError) throw new RuleError(resolutionError);
	const now = nowIso();
	await claims().updateOne(
		{ _id: doc._id },
		{ $set: { status: decision, resolution: resolution.trim(), updatedAt: now } }
	);
	const pkg = await packages().findOne({ _id: new ObjectId(String(doc.packageId)) });
	if (pkg) {
		await packages().updateOne(
			{ _id: pkg._id },
			{
				$set: {
					events: appendEvent(pkg.events, event(`Claim ${decision}`, 'Customer service')),
					updatedAt: now
				}
			}
		);
	}
	if (doc.customerId) {
		await notifyOnce(
			String(doc.customerId),
			`claim:${String(doc._id)}:${decision}`,
			`Your claim for ${doc.trackingNumber} was ${decision}.`,
			'/app/claims'
		);
	}
}

export async function listAbnormal(): Promise<PackageView[]> {
	const docs = await packages().find({ status: 'abnormal' }).sort({ updatedAt: -1 }).toArray();
	return presentPackages(docs);
}

export async function assignAbnormal(packageId: string, memberCode: string): Promise<void> {
	const codeError = validateText('Member code', memberCode, 20);
	if (codeError) throw new RuleError(codeError);
	const doc = await requirePackage(packageId);
	if (doc.status !== 'abnormal' || doc.customerId) throw new RuleError('This parcel is not an unknown arrival');
	const owner = await users().findOne({ memberCode: memberCode.trim(), role: 'customer', disabled: { $ne: true } });
	if (!owner) throw new RuleError('No customer has that member code');
	const now = nowIso();
	await packages().updateOne(
		{ _id: doc._id },
		{
			$set: {
				customerId: String(owner._id),
				memberCode: memberCode.trim(),
				status: 'arrived',
				events: appendEvent(doc.events, event(`Assigned to ${memberCode.trim()}`, 'Customer service')),
				updatedAt: now
			}
		}
	);
	await notifyOnce(
		String(owner._id),
		`arrived:${doc._id.toString()}`,
		`Parcel ${doc.trackingNumber} arrived at the warehouse and was assigned to your member code.`,
		`/app/packages/${doc._id.toString()}`
	);
}

export async function listDeliveries(): Promise<DeliveryView[]> {
	const docs = await deliveries().find({ status: { $ne: 'cancelled' } }).sort({ createdAt: -1 }).limit(100).toArray();
	return docs.map(toDelivery);
}

export async function getDelivery(id: string): Promise<DeliveryView> {
	const doc = await deliveries().findOne({ _id: parseId(id, 'Delivery') });
	if (!doc || doc.status === 'cancelled') throw new RuleError('Delivery not found');
	return toDelivery(doc);
}

function toDelivery(doc: Record<string, unknown>): DeliveryView {
	const destination = (doc.destination ?? {}) as DeliveryView['destination'];
	return {
		id: String(doc._id),
		consolidationId: String(doc.consolidationId),
		memberCode: doc.memberCode ? String(doc.memberCode) : null,
		pickupLines: Array.isArray(doc.pickupLines) ? doc.pickupLines.map(String) : [],
		destination: {
			recipient: destination.recipient ?? '',
			line1: destination.line1 ?? '',
			line2: destination.line2 ?? '',
			city: destination.city ?? '',
			country: destination.country ?? ''
		},
		status: doc.status as DeliveryView['status'],
		departureAt: doc.departureAt ? String(doc.departureAt) : null,
		deliveredAt: doc.deliveredAt ? String(doc.deliveredAt) : null,
		createdAt: String(doc.createdAt)
	};
}

export async function pickupDelivery(id: string, departureAt: string): Promise<void> {
	const doc = await deliveries().findOne({ _id: parseId(id, 'Delivery') });
	if (!doc || doc.status !== 'ready') throw new RuleError('This delivery is not ready for pickup');
	const departure = toIso(departureAt, 'Departure time');
	const now = nowIso();
	const pkgs = await packages().find({ consolidationId: String(doc.consolidationId) }).toArray();
	await deliveries().updateOne({ _id: doc._id }, { $set: { status: 'picked_up', departureAt: departure } });
	await consolidations().updateOne(
		{ _id: new ObjectId(String(doc.consolidationId)) },
		{ $set: { status: 'out_for_delivery', updatedAt: now } }
	);
	for (const pkg of pkgs) {
		await packages().updateOne(
			{ _id: pkg._id },
			{
				$set: {
					status: 'out_for_delivery',
					events: appendEvent(pkg.events, event('Picked up for delivery', pkg.shelf ?? 'Warehouse', departure)),
					updatedAt: now
				}
			}
		);
	}
}

export async function completeDelivery(id: string, deliveredAt: string): Promise<void> {
	const doc = await deliveries().findOne({ _id: parseId(id, 'Delivery') });
	if (!doc || doc.status !== 'picked_up') throw new RuleError('Record pickup before proof of delivery');
	const delivered = toIso(deliveredAt, 'Delivery time');
	const now = nowIso();
	const pkgs = await packages().find({ consolidationId: String(doc.consolidationId) }).toArray();
	await deliveries().updateOne({ _id: doc._id }, { $set: { status: 'delivered', deliveredAt: delivered } });
	await consolidations().updateOne(
		{ _id: new ObjectId(String(doc.consolidationId)) },
		{ $set: { status: 'delivered', updatedAt: now } }
	);
	for (const pkg of pkgs) {
		await packages().updateOne(
			{ _id: pkg._id },
			{
				$set: {
					status: 'delivered',
					events: appendEvent(pkg.events, {
						at: delivered,
						location: 'Destination',
						description: 'Delivered',
						source: 'system'
					}),
					updatedAt: now
				}
			}
		);
	}
}

export async function listNotifications(userId: string): Promise<NotificationView[]> {
	const docs = await notifications().find({ userId }).sort({ createdAt: -1 }).limit(50).toArray();
	return docs.map((doc) => ({
		id: String(doc._id),
		message: String(doc.message),
		href: String(doc.href),
		readAt: doc.readAt ? String(doc.readAt) : null,
		createdAt: String(doc.createdAt)
	}));
}

export async function unreadCount(userId: string): Promise<number> {
	return notifications().countDocuments({ userId, readAt: null });
}

export async function markNotificationsRead(userId: string): Promise<void> {
	await notifications().updateMany({ userId, readAt: null }, { $set: { readAt: nowIso() } });
}

export async function analytics(): Promise<AnalyticsView> {
	const statuses: PackageStatus[] = [
		'pre_registered',
		'arrived',
		'measured',
		'stored',
		'in_consolidation',
		'out_for_delivery',
		'delivered',
		'abnormal',
		'returned'
	];
	const chain = await Promise.all(
		statuses.map(async (status) => ({ status, count: await packages().countDocuments({ status }) }))
	);
	const zoneDocs = await zones().find().sort({ name: 1 }).toArray();
	const zoneViews: ZoneView[] = await Promise.all(
		zoneDocs.map(async (zone) => ({
			id: zone._id.toString(),
			name: zone.name,
			open: zone.open,
			storedCount: await packages().countDocuments({ zoneId: zone._id.toString(), status: 'stored' })
		}))
	);
	const flow = new Map<string, number>();
	for (let offset = 13; offset >= 0; offset -= 1) {
		const day = new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);
		flow.set(day, 0);
	}
	const recent = await packages().find({}, { projection: { events: 1 } }).toArray();
	for (const doc of recent) {
		for (const event of doc.events ?? []) {
			const day = String(event.at).slice(0, 10);
			if (flow.has(day)) flow.set(day, (flow.get(day) ?? 0) + 1);
		}
	}
	return {
		chain,
		openClaims: await claims().countDocuments({ status: 'open' }),
		paidPayments: await payments().countDocuments({ status: 'paid' }),
		zones: zoneViews,
		flow: [...flow.entries()].map(([day, count]) => ({ day, count }))
	};
}

export async function analyticsCsv(): Promise<string> {
	const report = await analytics();
	const lines = ['section,name,value'];
	for (const row of report.chain) lines.push(`chain,${row.status},${row.count}`);
	lines.push(`claims,open,${report.openClaims}`);
	lines.push(`payments,paid,${report.paidPayments}`);
	for (const zone of report.zones) {
		lines.push(`zone,${csvCell(zone.name)} stored,${zone.storedCount}`);
		lines.push(`zone,${csvCell(zone.name)} open,${zone.open ? 'yes' : 'no'}`);
	}
	return lines.join('\n') + '\n';
}

function csvCell(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

export async function setZoneOpen(id: string, open: boolean): Promise<void> {
	const result = await zones().updateOne({ _id: parseId(id, 'Zone') }, { $set: { open } });
	if (result.matchedCount === 0) throw new RuleError('Zone not found');
}

export async function addZone(name: string): Promise<void> {
	const error = validateText('Zone name', name, 40);
	if (error) throw new RuleError(error);
	const trimmed = name.trim();
	const existing = await zones().findOne({ name: { $regex: `^${escapeRegex(trimmed)}$`, $options: 'i' } });
	if (existing) throw new RuleError('A zone with this name already exists');
	await zones().insertOne({ name: trimmed, open: true });
}

export async function dropZone(id: string): Promise<void> {
	const zoneId = parseId(id, 'Zone');
	const used = await packages().countDocuments({ zoneId: zoneId.toString() });
	if (used > 0) throw new RuleError('Move the parcels out of this zone before dropping it');
	const result = await zones().deleteOne({ _id: zoneId });
	if (result.deletedCount === 0) throw new RuleError('Zone not found');
}

export function staffRole(value: string): Role {
	if (!isRole(value) || value === 'customer') throw new RuleError('Choose a staff role');
	return value;
}
