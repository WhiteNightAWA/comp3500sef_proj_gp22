import { auth } from '#lib/server/auth';
import { rejected } from '#lib/server/http';
import { redirect, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');
		try {
			await auth.api.signUpEmail({ body: { name, email, password }, headers: request.headers });
			await auth.api.signInEmail({ body: { email, password }, headers: request.headers });
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/app?notice=Account+created');
	}
};
