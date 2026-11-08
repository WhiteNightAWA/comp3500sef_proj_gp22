import { listDeliveries } from '#lib/server/logistics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { jobs: await listDeliveries() };
};
