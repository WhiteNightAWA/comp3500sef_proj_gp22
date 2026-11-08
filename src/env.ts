import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DB_URL: {
		description: 'MongoDB connection string',
		schema: (value) => {
			if (!value) throw new Error('DB_URL is not set');
			return value;
		}
	},
	BETTER_AUTH_SECRET: {
		description: 'Secret used to sign sessions',
		schema: (value) => {
			if (!value || value.length < 16) throw new Error('BETTER_AUTH_SECRET must be at least 16 characters');
			return value;
		}
	},
	BETTER_AUTH_URL: {
		description: 'Public origin of the app',
		schema: (value) => value || 'http://localhost:5173'
	}
});
