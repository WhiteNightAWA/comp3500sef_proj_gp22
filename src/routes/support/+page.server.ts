import { listOpenClaims } from '#lib/server/logistics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const claims = await listOpenClaims();
	return { claims: claims.filter((claim) => claim.status === 'open') };
};
