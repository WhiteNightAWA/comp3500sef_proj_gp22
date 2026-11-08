import { isRole, ROLE_HOME, type Role } from '#lib/domain';
import { building } from '$app/env';
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { auth } from '#lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { ensureReady, findAccount } from '#lib/server/logistics';

const GUARDS: { prefix: string; roles: Role[] }[] = [
	{ prefix: '/app', roles: ['customer'] },
	{ prefix: '/warehouse', roles: ['warehouse'] },
	{ prefix: '/support', roles: ['support'] },
	{ prefix: '/delivery', roles: ['delivery'] },
	{ prefix: '/manage', roles: ['management'] },
	{ prefix: '/admin', roles: ['admin'] }
];

export const handle: Handle = async ({ event, resolve }) => {
	if (building) return svelteKitHandler({ event, resolve, auth, building });

	await ensureReady();
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session) {
		event.locals.user = null;
	} else {
		const account = await findAccount(session.user.id);
		if (!account || account.disabled) {
			await auth.api.signOut({ headers: event.request.headers }).catch(() => undefined);
			event.locals.user = null;
		} else {
			const role = isRole(account.role) ? account.role : 'customer';
			event.locals.user = {
				id: account.id,
				name: account.name,
				email: account.email,
				role,
				memberCode: account.memberCode,
				disabled: false
			};
		}
	}

	const path = event.url.pathname;
	const guard = GUARDS.find((item) => path === item.prefix || path.startsWith(`${item.prefix}/`));
	if (guard) {
		if (!event.locals.user) redirect(303, '/login');
		if (!guard.roles.includes(event.locals.user.role)) redirect(303, ROLE_HOME[event.locals.user.role]);
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
