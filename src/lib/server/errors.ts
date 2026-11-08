import { isRedirect } from '@sveltejs/kit';

export class RuleError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'RuleError';
	}
}

export function errorMessage(error: unknown): string {
	if (isRedirect(error)) throw error;
	if (error instanceof RuleError) return error.message;
	if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
		const message = error.message.trim();
		if (message) return message;
	}
	return 'Something went wrong';
}
