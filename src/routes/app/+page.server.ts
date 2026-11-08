import { CARRIERS } from '#lib/domain';
import { rejected } from '#lib/server/http';
import { listCustomerPackages, preRegister } from '#lib/server/logistics';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) redirect(303, '/login');
	return {
		packages: await listCustomerPackages(user.id),
		memberCode: user.memberCode,
		carriers: CARRIERS
	};
};

export const actions: Actions = {
	preRegister: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		try {
			await preRegister(locals.user, {
				trackingNumber: String(form.get('trackingNumber') ?? ''),
				carrier: String(form.get('carrier') ?? ''),
				description: String(form.get('description') ?? '')
			});
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/app?notice=Parcel+pre-registered');
	}
};
