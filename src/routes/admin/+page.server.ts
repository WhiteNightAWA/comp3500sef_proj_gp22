import { ROLES } from '#lib/domain';
import { rejected } from '#lib/server/http';
import { createStaff, listAccounts, setAccountDisabled } from '#lib/server/logistics';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		accounts: await listAccounts(),
		roles: ROLES.filter((role) => role !== 'customer')
	};
};

export const actions: Actions = {
	disable: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		try {
			await setAccountDisabled(locals.user.id, String(form.get('id') ?? ''), form.get('disabled') === 'true');
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/admin?notice=Account+updated');
	},
	create: async ({ request }) => {
		const form = await request.formData();
		try {
			await createStaff(
				{
					name: String(form.get('name') ?? ''),
					email: String(form.get('email') ?? ''),
					password: String(form.get('password') ?? ''),
					role: String(form.get('role') ?? '')
				},
				request.headers
			);
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/admin?notice=Staff+account+created');
	}
};
