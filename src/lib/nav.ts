import type { Role } from '#lib/domain';

export const DEMO_PASSWORD = 'demo-pass-1';

export const demoAccounts = [
	{ email: 'customer@demo.test', label: 'Customer', blurb: 'Own parcels, claims, and payment' },
	{ email: 'warehouse@demo.test', label: 'Warehouse', blurb: 'Arrival, measure, shelves, verify' },
	{ email: 'support@demo.test', label: 'Support', blurb: 'Claims and unknown parcels' },
	{ email: 'delivery@demo.test', label: 'Delivery', blurb: 'Pickup and proof of delivery' },
	{ email: 'manager@demo.test', label: 'Management', blurb: 'Usage, zones, and export' },
	{ email: 'admin@demo.test', label: 'Admin', blurb: 'Accounts and staff roles' }
] as const;

export type NavLink = { href: string; label: string };

export const customerLinks: NavLink[] = [
	{ href: '/app', label: 'Packages' },
	{ href: '/app/address', label: 'Addresses' },
	{ href: '/app/consolidations', label: 'Consolidations' },
	{ href: '/app/claims', label: 'Claims' }
];

export const warehouseLinks: NavLink[] = [
	{ href: '/warehouse', label: 'Inventory' },
	{ href: '/warehouse/consolidations', label: 'Verify' }
];

export const supportLinks: NavLink[] = [
	{ href: '/support', label: 'Claims' },
	{ href: '/support/abnormal', label: 'Unknown parcels' }
];

export const deliveryLinks: NavLink[] = [{ href: '/delivery', label: 'Jobs' }];
export const managementLinks: NavLink[] = [{ href: '/manage', label: 'Usage' }];
export const adminLinks: NavLink[] = [{ href: '/admin', label: 'Accounts' }];

export function linksForRole(role: Role): NavLink[] {
	switch (role) {
		case 'customer':
			return customerLinks;
		case 'warehouse':
			return warehouseLinks;
		case 'support':
			return supportLinks;
		case 'delivery':
			return deliveryLinks;
		case 'management':
			return managementLinks;
		case 'admin':
			return adminLinks;
	}
}