import { BETTER_AUTH_SECRET, BETTER_AUTH_URL, DB_URL } from '$app/env/private';
import { clientFromEnv } from './auth-core';

process.env.DB_URL ??= DB_URL;
process.env.BETTER_AUTH_SECRET ??= BETTER_AUTH_SECRET;
if (process.env.VERCEL && process.env.VERCEL_URL && (!process.env.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL.includes('localhost'))) {
	process.env.BETTER_AUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}`;
}
process.env.BETTER_AUTH_URL ??= BETTER_AUTH_URL;

const connection = clientFromEnv();
export const client = connection.client;
export const db = connection.db;
