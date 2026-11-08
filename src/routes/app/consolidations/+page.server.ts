import { SHIPPING_METHODS } from '#lib/domain';
import { rejected } from '#lib/server/http';
import { listAddresses, listCustomerConsolidations, listCustomerPackages, submitConsolidation } from '#lib/server/logistics';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	const packages = await listCustomerPackages(locals.user.id);
	const addresses = await listAddresses(locals.user.id);
	return {
		consolidations: await listCustomerConsolidations(locals.user.id),
		stored: packages.filter((pkg) => pkg.status === 'stored'),
		methods: SHIPPING_METHODS,
		delivery: addresses.find((address) => address.selected) ?? null
	};
};

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		try {
			const id = await submitConsolidation(
				locals.user,
				form.getAll('packageId').map(String),
				String(form.get('method') ?? '')
			);
			redirect(303, `/app/consolidations/${id}?notice=Consolidation+submitted`);
		} catch (error) {
			return rejected(error);
		}
	}
};
