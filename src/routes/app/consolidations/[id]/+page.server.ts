import { rejected } from '#lib/server/http';
import { RuleError } from '#lib/server/errors';
import { cancelConsolidation, getConsolidation, payConsolidation } from '#lib/server/logistics';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(303, '/login');
	try {
		return { consolidation: await getConsolidation(params.id, locals.user.id) };
	} catch (err) {
		if (err instanceof RuleError) error(404, err.message);
		throw err;
	}
};

export const actions: Actions = {
	pay: async ({ request, locals, params }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		try {
			await payConsolidation(locals.user.id, params.id, String(form.get('card') ?? ''));
		} catch (err) {
			return rejected(err);
		}
		redirect(303, `/app/consolidations/${params.id}?notice=Payment+received`);
	},
	cancel: async ({ locals, params }) => {
		if (!locals.user) redirect(303, '/login');
		try {
			await cancelConsolidation(locals.user.id, params.id);
		} catch (err) {
			return rejected(err);
		}
		redirect(303, `/app/consolidations/${params.id}?notice=Consolidation+cancelled`);
	}
};
