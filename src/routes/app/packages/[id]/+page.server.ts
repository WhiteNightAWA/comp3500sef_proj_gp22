import { rejected } from '#lib/server/http';
import { RuleError } from '#lib/server/errors';
import { getCustomerPackage, refreshTracking } from '#lib/server/logistics';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(303, '/login');
	try {
		return { pkg: await getCustomerPackage(locals.user.id, params.id) };
	} catch (err) {
		if (err instanceof RuleError) error(404, err.message);
		throw err;
	}
};

export const actions: Actions = {
	refresh: async ({ locals, params }) => {
		if (!locals.user) redirect(303, '/login');
		try {
			await refreshTracking(params.id, locals.user.id);
		} catch (err) {
			return rejected(err);
		}
		redirect(303, `/app/packages/${params.id}?notice=Tracking+refreshed`);
	}
};
