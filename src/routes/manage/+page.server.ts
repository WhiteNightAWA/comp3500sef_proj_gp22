import { rejected } from '#lib/server/http';
import { addZone, analytics, dropZone, setZoneOpen } from '#lib/server/logistics';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { report: await analytics() };
};

export const actions: Actions = {
	zone: async ({ request }) => {
		const form = await request.formData();
		try {
			await setZoneOpen(String(form.get('zoneId') ?? ''), form.get('open') === 'true');
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/manage?notice=Zone+updated');
	},
	add: async ({ request }) => {
		const form = await request.formData();
		try {
			await addZone(String(form.get('name') ?? ''));
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/manage?notice=Zone+added');
	},
	drop: async ({ request }) => {
		const form = await request.formData();
		try {
			await dropZone(String(form.get('zoneId') ?? ''));
		} catch (error) {
			return rejected(error);
		}
		redirect(303, '/manage?notice=Zone+removed');
	}
};
