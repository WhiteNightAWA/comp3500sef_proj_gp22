import { MongoClient, ObjectId, type Db } from 'mongodb';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import type { BetterAuthOptions } from 'better-auth';

async function nextMemberCode(db: Db): Promise<string> {
	for (let attempt = 0; attempt < 8; attempt += 1) {
		const code = `SF${Math.floor(1000 + Math.random() * 9000)}`;
		const existing = await db.collection('user').findOne({ memberCode: code });
		if (!existing) return code;
	}
	return `SF${Date.now().toString().slice(-6)}`;
}

export function createAuth(
	db: Db,
	client: MongoClient,
	plugins: NonNullable<BetterAuthOptions['plugins']> = []
) {
	const origin = process.env.BETTER_AUTH_URL || 'http://localhost:5173';
	const trustedOrigins = [origin];
	for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
		if (host) trustedOrigins.push(`https://${host}`);
	}
	return betterAuth({
		secret: process.env.BETTER_AUTH_SECRET,
		baseURL: origin,
		trustedOrigins,
		database: mongodbAdapter(db, { client }),
		emailAndPassword: {
			enabled: true,
			autoSignIn: false,
			minPasswordLength: 8
		},
		rateLimit: {
			enabled: process.env.AUTH_RATE_LIMIT === 'off' ? false : true
		},
		user: {
			additionalFields: {
				role: {
					type: 'string',
					required: false,
					defaultValue: 'customer',
					input: false
				},
				memberCode: {
					type: 'string',
					required: false,
					input: false
				},
				disabled: {
					type: 'boolean',
					required: false,
					defaultValue: false,
					input: false
				}
			}
		},
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						const role = typeof user.role === 'string' ? user.role : 'customer';
						const memberCode = role === 'customer' ? await nextMemberCode(db) : null;
						const id = userIdFilter(user.id);
						await db.collection('user').updateOne(id, {
							$set: {
								role: role === 'customer' ? 'customer' : role,
								disabled: false,
								...(memberCode ? { memberCode } : {})
							}
						});
					}
				}
			},
			session: {
				create: {
					before: async (session) => {
						const record = await db.collection('user').findOne(userIdFilter(String(session.userId)));
						if (record?.disabled) return false;
					}
				}
			}
		},
		plugins
	});
}

export function userIdFilter(id: string): { _id: ObjectId } {
	if (ObjectId.isValid(id) && new ObjectId(id).toHexString() === id) {
		return { _id: new ObjectId(id) };
	}
	throw new Error('Invalid user id');
}

const globalMongo = globalThis as typeof globalThis & { __harbourMongo?: { client: MongoClient; db: Db } };

export function clientFromEnv(): { client: MongoClient; db: Db } {
	if (globalMongo.__harbourMongo) return globalMongo.__harbourMongo;
	const url = process.env.DB_URL;
	if (!url) throw new Error('DB_URL is not set');
	const client = new MongoClient(url);
	const connection = { client, db: client.db('comp3500sef') };
	globalMongo.__harbourMongo = connection;
	return connection;
}
