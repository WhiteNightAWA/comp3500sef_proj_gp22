import { CLAIM_TYPES } from '#lib/domain';
import { rejected } from '#lib/server/http';
import { listCustomerClaims, listCustomerPackages, openClaim } from '#lib/server/logistics';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	return {
		claims: await listCustomerClaims(locals.user.id),
		packages: await listCustomerPackages(locals.user.id),
		types: CLAIM_TYPES
	};
};

export const actions: Actions = {
	open: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		try {
			await openClaim(
				locals.user,
				String(form.get('packageId') ?? ''),
				String(form.get('type') ?? ''),
				String(form.get('description') ?? '')
			);
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/app/claims?notice=Claim+opened');
	}
};
