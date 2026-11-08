import { auth } from '#lib/server/auth';
import { errorMessage } from '#lib/server/errors';
import { updateProfile } from '#lib/server/logistics';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	return {
		profile: {
			name: locals.user.name,
			email: locals.user.email,
			role: locals.user.role,
			memberCode: locals.user.memberCode
		}
	};
};

export const actions: Actions = {
	profile: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		try {
			await updateProfile(locals.user.id, {
				name: String(form.get('name') ?? ''),
				email: String(form.get('email') ?? '')
			});
		} catch (error) {
			return fail(400, { profileMessage: errorMessage(error) });
		}
		redirect(303, '/settings?notice=Profile+updated');
	},
	password: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		const currentPassword = String(form.get('currentPassword') ?? '');
		const newPassword = String(form.get('newPassword') ?? '');
		const confirmPassword = String(form.get('confirmPassword') ?? '');
		if (newPassword.length < 8) {
			return fail(400, { passwordMessage: 'Password must be at least 8 characters' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { passwordMessage: 'New passwords do not match' });
		}
		try {
			await auth.api.changePassword({
				body: {
					currentPassword,
					newPassword,
					revokeOtherSessions: true
				},
				headers: request.headers
			});
		} catch (error) {
			return fail(400, { passwordMessage: errorMessage(error) });
		}
		redirect(303, '/settings?notice=Password+updated');
	}
};
