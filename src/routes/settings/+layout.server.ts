import { unreadCount } from '#lib/server/logistics';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	return {
		unread: locals.user.role === 'customer' ? await unreadCount(locals.user.id) : 0
	};
};
