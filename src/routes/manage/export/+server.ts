import { analyticsCsv } from '#lib/server/logistics';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (locals.user?.role !== 'management') error(403, 'Forbidden');
	const csv = await analyticsCsv();
	return new Response(csv, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': 'attachment; filename="logistics-usage.csv"'
		}
	});
};
