import { DELIVERY_REGIONS } from '#lib/domain';
import { rejected } from '#lib/server/http';
import { addAddress, listAddresses, removeAddress, selectAddress } from '#lib/server/logistics';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	return { addresses: await listAddresses(locals.user.id), regions: DELIVERY_REGIONS };
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		try {
			await addAddress(locals.user.id, {
				label: String(form.get('label') ?? ''),
				recipient: String(form.get('recipient') ?? ''),
				phone: String(form.get('phone') ?? ''),
				line1: String(form.get('line1') ?? ''),
				line2: String(form.get('line2') ?? ''),
				city: String(form.get('city') ?? ''),
				country: String(form.get('country') ?? '')
			});
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/app/address?notice=Address+saved');
	},
	select: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		try {
			await selectAddress(locals.user.id, String(form.get('id') ?? ''));
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/app/address?notice=Delivery+address+updated');
	},
	remove: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		try {
			await removeAddress(locals.user.id, String(form.get('id') ?? ''));
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/app/address?notice=Address+removed');
	}
};
