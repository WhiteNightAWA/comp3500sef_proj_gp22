import { rejected } from '#lib/server/http';
import { RuleError } from '#lib/server/errors';
import { completeDelivery, getDelivery, pickupDelivery } from '#lib/server/logistics';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		return { job: await getDelivery(params.id) };
	} catch (err) {
		if (err instanceof RuleError) error(404, err.message);
		throw err;
	}
};

export const actions: Actions = {
	pickup: async ({ request, params }) => {
		const form = await request.formData();
		try {
			await pickupDelivery(params.id, String(form.get('departureAt') ?? ''));
		} catch (err) {
			return rejected(err);
		}
		redirect(303, `/delivery/${params.id}?notice=Pickup+recorded`);
	},
	deliver: async ({ request, params }) => {
		const form = await request.formData();
		try {
			await completeDelivery(params.id, String(form.get('deliveredAt') ?? ''));
		} catch (err) {
			return rejected(err);
		}
		redirect(303, `/delivery/${params.id}?notice=Delivery+recorded`);
	}
};
