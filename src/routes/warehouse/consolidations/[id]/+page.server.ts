import { rejected } from '#lib/server/http';
import { RuleError } from '#lib/server/errors';
import { getConsolidation, verifyConsolidation } from '#lib/server/logistics';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		return { row: await getConsolidation(params.id) };
	} catch (err) {
		if (err instanceof RuleError) error(404, err.message);
		throw err;
	}
};

export const actions: Actions = {
	verify: async ({ request, params }) => {
		const form = await request.formData();
		try {
			await verifyConsolidation(params.id, form.get('decision') === 'approve', String(form.get('note') ?? ''));
		} catch (err) {
			return rejected(err);
		}
		redirect(303, '/warehouse/consolidations?notice=Verification+saved');
	}
};
