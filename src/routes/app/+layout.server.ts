import { unreadCount } from '#lib/server/logistics';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return { unread: locals.user ? await unreadCount(locals.user.id) : 0 };
};
