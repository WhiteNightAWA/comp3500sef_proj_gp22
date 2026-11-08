import { listNotifications, markNotificationsRead } from '#lib/server/logistics';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	const items = await listNotifications(locals.user.id);
	await markNotificationsRead(locals.user.id);
	return { items };
};
