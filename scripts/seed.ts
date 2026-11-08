import { ObjectId } from 'mongodb';
import { volumeWeightKg, type TrackingEvent } from '../src/lib/domain.ts';
import { createAuth } from '../src/lib/server/auth-core.ts';
import { carrierTimeline } from '../src/lib/server/tracking.ts';
import { MongoClient } from 'mongodb';

process.env.AUTH_RATE_LIMIT = 'off';
process.env.BETTER_AUTH_URL ||= 'http://localhost:5173';

const url = process.env.DB_URL;
if (!url) throw new Error('DB_URL is not set');
if (!process.env.BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET is not set');

const people = [
	{ name: 'Demo Customer', email: 'customer@demo.test', role: 'customer' },
	{ name: 'Demo Warehouse', email: 'warehouse@demo.test', role: 'warehouse' },
	{ name: 'Demo Support', email: 'support@demo.test', role: 'support' },
	{ name: 'Demo Delivery', email: 'delivery@demo.test', role: 'delivery' },
	{ name: 'Demo Manager', email: 'manager@demo.test', role: 'management' },
	{ name: 'Demo Admin', email: 'admin@demo.test', role: 'admin' }
] as const;

const password = 'demo-pass-1';
const client = new MongoClient(url);
await client.connect();
const db = client.db('comp3500sef');
const auth = createAuth(db, client);

for (const person of people) {
	const existing = await db.collection('user').findOne({ email: person.email });
	if (!existing) {
		await auth.api.signUpEmail({
			body: { name: person.name, email: person.email, password },
			headers: new Headers({ origin: process.env.BETTER_AUTH_URL })
		});
	}
	if (person.role === 'customer') {
		const user = await db.collection('user').findOne({ email: person.email });
		if (user && !user.memberCode) {
			await db.collection('user').updateOne({ _id: user._id }, { $set: { memberCode: 'SF1001', role: 'customer' } });
		}
	} else {
		await db.collection('user').updateOne(
			{ email: person.email },
			{ $set: { role: person.role }, $unset: { memberCode: '' } }
		);
	}
	console.log(`account ready: ${person.role}`);
}

await db.collection('packages').createIndex({ trackingNumber: 1 }, { unique: true });
await db.collection('packages').createIndex({ customerId: 1 });
await db.collection('packages').createIndex({ status: 1 });
await db.collection('notifications').createIndex({ userId: 1, kind: 1 }, { unique: true });

if ((await db.collection('zones').countDocuments()) === 0) {
	await db.collection('zones').insertMany([
		{ name: 'Zone A', open: true },
		{ name: 'Zone B', open: true },
		{ name: 'Zone C', open: false }
	]);
}

const customer = await db.collection('user').findOne({ email: 'customer@demo.test' });
if (!customer?.memberCode) throw new Error('Customer member code missing');
const customerId = String(customer._id);
const memberCode = String(customer.memberCode);

await db.collection('addresses').updateOne(
	{ userId: customerId, city: 'Hong Kong' },
	{
		$set: {
			userId: customerId,
			recipient: 'Ada Customer',
			phone: '+85255550100',
			line1: '18 Harbour Road',
			line2: '',
			city: 'Hong Kong',
			country: 'HK',
			label: 'Harbour Road',
			selected: true,
			verifiedAt: new Date().toISOString()
		}
	},
	{ upsert: true }
);
await db.collection('addresses').updateOne(
	{ userId: customerId, city: 'Taipei' },
	{
		$set: {
			userId: customerId,
			label: 'Taipei flat',
			recipient: 'Ada Customer',
			phone: '+886912345678',
			line1: '88 Zhongxiao East Road',
			line2: '',
			city: 'Taipei',
			country: 'TW',
			selected: false,
			verifiedAt: new Date().toISOString()
		}
	},
	{ upsert: true }
);

await db.collection('packages').updateMany(
	{ carrier: { $in: ['UPS', 'FedEx', 'DHL', 'USPS', 'Other'] } },
	{ $set: { carrier: 'SF Express 顺丰' } }
);

const existingPackages = await db.collection('packages').countDocuments({ customerId });
if (existingPackages === 0) {
	const zoneA = await db.collection('zones').findOne({ name: 'Zone A' });
	const zoneB = await db.collection('zones').findOne({ name: 'Zone B' });
	if (!zoneA || !zoneB) throw new Error('Zones missing');
	const now = new Date().toISOString();
	const longStay = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

	const make = (
		trackingNumber: string,
		status: string,
		extra: Record<string, unknown> = {}
	) => {
		const timeline = carrierTimeline(trackingNumber);
		const id = new ObjectId();
		return {
			_id: id,
			customerId,
			memberCode,
			trackingNumber,
			carrier: 'SF Express 顺丰',
			description: String(extra.description ?? 'Parcel'),
			status,
			arrivalAt: status === 'pre_registered' ? null : now,
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
			events: timeline.events as TrackingEvent[],
			eta: timeline.eta,
			storedAt: null,
			consolidationId: null,
			createdAt: now,
			updatedAt: now,
			...extra,
			_idKeep: id
		};
	};

	const pre = make('TRK1001', 'pre_registered', { description: 'Phone case', carrier: 'YTO Express 圆通' });
	const storedA = measured('TRK1002', 'Books', zoneA._id.toString(), 'A-01', 1.2, 20, 15, 10, now);
	const storedB = measured('TRK1003', 'Shoes', zoneA._id.toString(), 'A-02', 2, 40, 30, 20, now);
	const old = measured('TRK1004', 'Mug', zoneB._id.toString(), 'B-03', 0.8, 15, 15, 12, longStay);
	const shipA = measured('TRK1006', 'Kettle', zoneA._id.toString(), 'A-04', 1.5, 30, 20, 15, now);
	const shipB = measured('TRK1007', 'Lamp', zoneA._id.toString(), 'A-05', 2.4, 45, 25, 20, now);
	const unknownId = new ObjectId();

	function measured(
		trackingNumber: string,
		description: string,
		zoneId: string,
		shelf: string,
		weightKg: number,
		lengthCm: number,
		widthCm: number,
		heightCm: number,
		storedAt: string
	) {
		return make(trackingNumber, 'stored', {
			description,
			carrier: 'SF Express 顺丰',
			zoneId,
			shelf,
			weightKg,
			lengthCm,
			widthCm,
			heightCm,
			volumeWeightKg: volumeWeightKg(lengthCm, widthCm, heightCm),
			storedAt,
			arrivalAt: storedAt
		});
	}

	const consolidationId = new ObjectId();
	shipA.status = 'in_consolidation';
	shipB.status = 'in_consolidation';
	shipA.consolidationId = consolidationId.toString();
	shipB.consolidationId = consolidationId.toString();

	const docs = [pre, storedA, storedB, old, shipA, shipB].map(({ _idKeep: _ignored, ...doc }) => doc);
	await db.collection('packages').insertMany(docs);
	await db.collection('packages').insertOne({
		_id: unknownId,
		customerId: null,
		memberCode: null,
		trackingNumber: 'TRK1005',
		carrier: 'Cainiao 菜鸟',
		description: 'Unlabeled carton',
		status: 'abnormal',
		arrivalAt: now,
		estimatedDeparture: null,
		zoneId: zoneB._id.toString(),
		shelf: null,
		weightKg: null,
		lengthCm: null,
		widthCm: null,
		heightCm: null,
		volumeWeightKg: null,
		deliveryFee: 0,
		furtherAction: 'Unknown owner',
		mismatchNote: null,
		events: [{ at: now, location: 'Zone B', description: 'Registered at warehouse', source: 'warehouse' }],
		eta: null,
		storedAt: null,
		consolidationId: null,
		createdAt: now,
		updatedAt: now
	});

	await db.collection('consolidations').insertOne({
		_id: consolidationId,
		customerId,
		memberCode,
		packageIds: [shipA._id.toString(), shipB._id.toString()],
		address: {
			userId: customerId,
			recipient: 'Ada Customer',
			phone: '+85255550100',
			line1: '18 Harbour Road',
			line2: '',
			city: 'Hong Kong',
			country: 'HK',
			verifiedAt: now
		},
		method: 'air',
		status: 'paid',
		chargeableWeight: 6.3,
		fee: { shipping: 50.4, service: 6, handling: 0, total: 56.4 },
		verificationNote: 'Verified',
		createdAt: now,
		updatedAt: now
	});
	await db.collection('deliveries').insertOne({
		consolidationId: consolidationId.toString(),
		memberCode,
		pickupLines: ['Zone A / A-04', 'Zone A / A-05'],
		destination: {
			recipient: 'Ada Customer',
			line1: '18 Harbour Road',
			line2: '',
			city: 'Hong Kong',
			country: 'HK'
		},
		status: 'ready',
		departureAt: null,
		deliveredAt: null,
		createdAt: now
	});
	await db.collection('payments').insertOne({
		consolidationId: consolidationId.toString(),
		customerId,
		amount: 56.4,
		currency: 'USD',
		status: 'paid',
		gatewayRef: 'gw_seeddemo0001',
		createdAt: now
	});
	await db.collection('claims').insertOne({
		packageId: old._id.toString(),
		customerId,
		memberCode,
		trackingNumber: 'TRK1004',
		type: 'damaged',
		description: 'The mug arrived with a cracked handle.',
		status: 'open',
		resolution: null,
		createdAt: now,
		updatedAt: now
	});
	console.log(`seeded parcels for ${memberCode}`);
} else {
	console.log('parcels already present');
}

await db.collection('addresses').updateOne(
	{ userId: customerId, city: 'Macau' },
	{
		$set: {
			userId: customerId,
			label: 'Macau shop',
			recipient: 'Ada Customer',
			phone: '+85366123456',
			line1: '12 Avenida de Almeida Ribeiro',
			line2: '',
			city: 'Macau',
			country: 'MO',
			selected: false,
			verifiedAt: new Date().toISOString()
		}
	},
	{ upsert: true }
);

const now = new Date().toISOString();
for (const note of [
	{
		kind: 'demo:arrival',
		message: 'Parcel TRK2001 was registered at the warehouse.',
		href: '/app'
	},
	{
		kind: 'demo:claim',
		message: 'Your claim for TRK1004 was updated.',
		href: '/app/claims'
	}
]) {
	await db.collection('notifications').updateOne(
		{ userId: customerId, kind: note.kind },
		{ $setOnInsert: { userId: customerId, ...note, createdAt: now, readAt: null } },
		{ upsert: true }
	);
}

const pkg1005 = await db.collection('packages').findOne({ trackingNumber: 'TRK1005' });
if (pkg1005 && (await db.collection('claims').countDocuments({ packageId: pkg1005._id.toString(), status: 'open' })) === 0) {
	await db.collection('claims').insertOne({
		packageId: pkg1005._id.toString(),
		customerId,
		memberCode,
		trackingNumber: 'TRK1005',
		type: 'missing',
		description: 'The carton label did not match the contents.',
		status: 'open',
		resolution: null,
		createdAt: now,
		updatedAt: now
	});
}

if ((await db.collection('consolidations').countDocuments({ status: 'submitted' })) === 0) {
	const zoneA = await db.collection('zones').findOne({ name: 'Zone A' });
	if (zoneA) {
		const samples = ['TRK9001', 'TRK9002'];
		const ids: string[] = [];
		for (const [index, trackingNumber] of samples.entries()) {
			const existing = await db.collection('packages').findOne({ trackingNumber });
			if (existing) {
				ids.push(existing._id.toString());
				continue;
			}
			const inserted = await db.collection('packages').insertOne({
				customerId,
				memberCode,
				trackingNumber,
				carrier: 'ZTO Express 中通',
				description: index === 0 ? 'Tea set' : 'Charger',
				status: 'stored',
				arrivalAt: now,
				estimatedDeparture: null,
				zoneId: zoneA._id.toString(),
				shelf: index === 0 ? 'A-21' : 'A-22',
				weightKg: 1,
				lengthCm: 20,
				widthCm: 15,
				heightCm: 10,
				volumeWeightKg: 0.6,
				deliveryFee: 0,
				furtherAction: null,
				mismatchNote: null,
				events: [{ at: now, location: 'Zone A', description: 'Stored', source: 'warehouse' }],
				eta: null,
				storedAt: now,
				consolidationId: null,
				createdAt: now,
				updatedAt: now
			});
			ids.push(inserted.insertedId.toString());
		}
		if (ids.length === 2) {
			const consolidationId = new ObjectId();
			await db.collection('consolidations').insertOne({
				_id: consolidationId,
				customerId,
				memberCode,
				packageIds: ids,
				address: {
					userId: customerId,
					recipient: 'Ada Customer',
					phone: '+85366123456',
					line1: '12 Avenida de Almeida Ribeiro',
					line2: '',
					city: 'Macau',
					country: 'MO',
					verifiedAt: now
				},
				method: 'sea',
				status: 'submitted',
				chargeableWeight: null,
				fee: null,
				verificationNote: null,
				createdAt: now,
				updatedAt: now
			});
			await db.collection('packages').updateMany(
				{ trackingNumber: { $in: samples } },
				{ $set: { status: 'in_consolidation', consolidationId: consolidationId.toString() } }
			);
		}
	}
}

if (!(await db.collection('packages').findOne({ trackingNumber: 'EX1101' }))) {
	const zoneA = await db.collection('zones').findOne({ name: 'Zone A' });
	const zoneB = await db.collection('zones').findOne({ name: 'Zone B' });
	const goods = ['Scarf', 'Kettle', 'Lamp', 'Notebook', 'Shoes', 'Mug', 'Tea', 'Charger', 'Coat', 'Toy', 'Camera', 'Speaker', 'Pillow', 'Pan', 'Vase', 'Helmet', 'Jacket', 'Cable', 'Lens', 'Fan'];
	const carriers = ['SF Express 顺丰', 'ZTO Express 中通', 'YTO Express 圆通', 'JD Logistics 京东物流', 'Cainiao 菜鸟', 'China Post EMS 中国邮政'];
	const statuses = [
		...Array(8).fill('pre_registered'),
		...Array(5).fill('arrived'),
		...Array(4).fill('measured'),
		...Array(8).fill('stored'),
		...Array(4).fill('delivered'),
		...Array(3).fill('out_for_delivery'),
		...Array(3).fill('abnormal'),
		...Array(2).fill('returned')
	];
	const docs = statuses.map((status, index) => {
		const trackingNumber = `EX${1101 + index}`;
		const placed = !['pre_registered', 'abnormal'].includes(status);
		const zone = placed ? (index % 2 === 0 ? zoneA : zoneB) : index % 2 === 0 ? zoneB : null;
		const picked = new Date(Date.now() - (index % 14) * 86_400_000).toISOString();
		const moved = new Date(Date.now() - (index % 7) * 86_400_000).toISOString();
		return {
			customerId: status === 'abnormal' ? null : customerId,
			memberCode: status === 'abnormal' ? null : memberCode,
			trackingNumber,
			carrier: carriers[index % carriers.length],
			description: goods[index % goods.length],
			status,
			arrivalAt: status === 'pre_registered' ? null : picked,
			estimatedDeparture: null,
			zoneId: zone?._id.toString() ?? null,
			shelf: placed ? `${index % 2 === 0 ? 'A' : 'B'}-${30 + index}` : null,
			weightKg: placed ? 0.4 + (index % 5) * 0.3 : null,
			lengthCm: placed ? 20 : null,
			widthCm: placed ? 15 : null,
			heightCm: placed ? 10 : null,
			volumeWeightKg: placed ? 0.6 : null,
			deliveryFee: 0,
			furtherAction: null,
			mismatchNote: null,
			events: [
				{ at: picked, location: 'Shenzhen', description: 'Picked up by carrier', source: 'carrier' },
				{ at: moved, location: 'Guangzhou', description: 'Departed origin facility', source: 'carrier' }
			],
			eta: new Date(Date.now() + 2 * 86_400_000).toISOString(),
			storedAt: status === 'stored' ? moved : null,
			consolidationId: null,
			createdAt: picked,
			updatedAt: moved
		};
	});
	await db.collection('packages').insertMany(docs);
	const claimSources = docs.filter((doc) => doc.customerId).slice(0, 8);
	await db.collection('claims').insertMany(
		claimSources.map((doc, index) => ({
			packageId: '',
			customerId,
			memberCode,
			trackingNumber: doc.trackingNumber,
			type: ['damaged', 'missing', 'wrong_item', 'other'][index % 4],
			description: ['Cracked corner', 'Contents short by one item', 'Wrong colour received', 'Outer box was wet'][index % 4],
			status: index < 5 ? 'open' : 'resolved',
			resolution: index < 5 ? null : 'Replacement arranged',
			createdAt: doc.createdAt,
			updatedAt: doc.updatedAt
		}))
	);
	const inserted = await db.collection('packages').find({ trackingNumber: { $in: claimSources.map((doc) => doc.trackingNumber) } }).toArray();
	for (const doc of inserted) {
		await db.collection('claims').updateMany({ trackingNumber: doc.trackingNumber, packageId: '' }, { $set: { packageId: doc._id.toString() } });
	}
	for (const [index, message] of [
		'A parcel was registered at the warehouse.',
		'A stored parcel has stayed longer than 14 days.',
		'A claim was updated.',
		'A consolidation is waiting for payment.',
		'A delivery departed the warehouse.',
		'An address was verified for shipping.'
	].entries()) {
		await db.collection('notifications').updateOne(
			{ userId: customerId, kind: `example:${index}` },
			{
				$setOnInsert: {
					userId: customerId,
					kind: `example:${index}`,
					message,
					href: '/app',
					createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
					readAt: null
				}
			},
			{ upsert: true }
		);
	}
	for (const address of [
		{ label: 'Kowloon office', phone: '+85255550188', line1: '88 Nathan Road', city: 'Kowloon', country: 'HK' },
		{ label: 'Kaohsiung home', phone: '+886912300111', line1: '16 Zhongshan Road', city: 'Kaohsiung', country: 'TW' },
		{ label: 'Taipa flat', phone: '+85366120018', line1: '5 Rua de Coimbra', city: 'Taipa', country: 'MO' }
	]) {
		await db.collection('addresses').updateOne(
			{ userId: customerId, city: address.city },
			{ $set: { userId: customerId, recipient: 'Ada Customer', line2: '', selected: false, verifiedAt: now, ...address } },
			{ upsert: true }
		);
	}
	console.log('added example parcels');
}

await db.collection('packages').updateMany({ description: 'Demo tea set' }, { $set: { description: 'Tea set' } });
await db.collection('packages').updateMany({ description: 'Demo charger' }, { $set: { description: 'Charger' } });
await db.collection('claims').updateMany(
	{ description: 'Demo: the carton label did not match the contents.' },
	{ $set: { description: 'The carton label did not match the contents.' } }
);

await client.close();
console.log('seed complete');
