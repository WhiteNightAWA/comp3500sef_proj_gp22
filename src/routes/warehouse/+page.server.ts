import { CARRIERS } from '#lib/domain';
import { listOpenZones, listWarehousePackages } from '#lib/server/logistics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	return {
		q,
		packages: await listWarehousePackages(q),
		zones: await listOpenZones(),
		carriers: CARRIERS
	};
};
