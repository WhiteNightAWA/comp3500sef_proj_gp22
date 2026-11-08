import { isRole, ROLE_HOME } from '#lib/domain';
import { auth } from '#lib/server/auth';
import { db } from '#lib/server/db';
import { rejected } from '#lib/server/http';
import { findAccount } from '#lib/server/logistics';
import { redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) redirect(303, ROLE_HOME[locals.user.role]);
	return { disabled: url.searchParams.get('disabled') === '1' };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');
		try {
			const result = await auth.api.signInEmail({
				body: { email, password },
				headers: request.headers
			});
			const account = await findAccount(result.user.id);
			if (!account || account.disabled || !isRole(account.role)) {
				return rejected(new Error('This account is disabled'));
			}
			redirect(303, ROLE_HOME[account.role]);
		} catch (error) {
			const existing = await db.collection('user').findOne({ email: email.trim().toLowerCase() });
			if (existing?.disabled) return rejected(new Error('This account is disabled'));
			return rejected(error);
		}
	}
};
