import { rejected } from '#lib/server/http';
import { RuleError } from '#lib/server/errors';
import {
	flagMismatch,
	getWarehousePackage,
	listOpenZones,
	markReturn,
	measurePackage,
	refreshTracking,
	storePackage
} from '#lib/server/logistics';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		return { pkg: await getWarehousePackage(params.id), zones: await listOpenZones() };
	} catch (err) {
		if (err instanceof RuleError) error(404, err.message);
		throw err;
	}
};

export const actions: Actions = {
	measure: async ({ request, params }) => {
		const form = await request.formData();
		try {
			await measurePackage(params.id, {
				weightKg: Number(form.get('weightKg')),
				lengthCm: Number(form.get('lengthCm')),
				widthCm: Number(form.get('widthCm')),
				heightCm: Number(form.get('heightCm'))
			});
		} catch (err) {
			return rejected(err);
		}
		redirect(303, `/warehouse/packages/${params.id}?notice=Measurements+saved`);
	},
	store: async ({ request, params }) => {
		const form = await request.formData();
		try {
			await storePackage(params.id, String(form.get('zoneId') ?? ''), String(form.get('shelf') ?? ''));
		} catch (err) {
			return rejected(err);
		}
		redirect(303, `/warehouse/packages/${params.id}?notice=Shelf+updated`);
	},
	mismatch: async ({ request, params }) => {
		const form = await request.formData();
		try {
			await flagMismatch(params.id, String(form.get('note') ?? ''));
		} catch (err) {
			return rejected(err);
		}
		redirect(303, `/warehouse/packages/${params.id}?notice=Mismatch+flagged`);
	},
	return: async ({ params }) => {
		try {
			await markReturn(params.id);
		} catch (err) {
			return rejected(err);
		}
		redirect(303, `/warehouse/packages/${params.id}?notice=Marked+for+return`);
	},
	refresh: async ({ params }) => {
		try {
			await refreshTracking(params.id);
		} catch (err) {
			return rejected(err);
		}
		redirect(303, `/warehouse/packages/${params.id}?notice=Tracking+refreshed`);
	}
};
