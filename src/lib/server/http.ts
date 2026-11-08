import { fail } from '@sveltejs/kit';
import { errorMessage } from './errors';

export function rejected(error: unknown) {
	return fail(400, { message: errorMessage(error) });
}
