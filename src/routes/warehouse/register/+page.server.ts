import { CARRIERS } from '#lib/domain';
import { rejected } from '#lib/server/http';
import { listOpenZones, registerArrival } from '#lib/server/logistics';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { zones: await listOpenZones(), carriers: CARRIERS };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		try {
			const id = await registerArrival({
				trackingNumber: String(form.get('trackingNumber') ?? ''),
				carrier: String(form.get('carrier') ?? ''),
				description: String(form.get('description') ?? ''),
				arrivalAt: String(form.get('arrivalAt') ?? ''),
				estimatedDeparture: String(form.get('estimatedDeparture') ?? ''),
				zoneId: String(form.get('zoneId') ?? ''),
				deliveryFee: String(form.get('deliveryFee') ?? ''),
				furtherAction: String(form.get('furtherAction') ?? '')
			});
			redirect(303, `/warehouse/packages/${id}?notice=Arrival+recorded`);
		} catch (error) {
			return rejected(error);
		}
	}
};
