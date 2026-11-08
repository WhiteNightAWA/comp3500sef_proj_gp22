import { rejected } from '#lib/server/http';
import { assignAbnormal, listAbnormal } from '#lib/server/logistics';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { packages: await listAbnormal() };
};

export const actions: Actions = {
	assign: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('packageId') ?? '');
		try {
			await assignAbnormal(id, String(form.get('memberCode') ?? ''));
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/support/abnormal?notice=Parcel+assigned');
	}
};
