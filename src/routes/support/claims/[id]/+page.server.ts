import { rejected } from '#lib/server/http';
import { RuleError } from '#lib/server/errors';
import { getClaim, resolveClaim } from '#lib/server/logistics';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		return { claim: await getClaim(params.id) };
	} catch (err) {
		if (err instanceof RuleError) error(404, err.message);
		throw err;
	}
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const form = await request.formData();
		const decision = form.get('decision') === 'rejected' ? 'rejected' : 'resolved';
		try {
			await resolveClaim(params.id, decision, String(form.get('resolution') ?? ''));
		} catch (err) {
			return rejected(err);
		}
		redirect(303, '/support?notice=Claim+updated');
	}
};
