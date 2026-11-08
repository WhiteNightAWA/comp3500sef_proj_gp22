export const DEMO_PASSWORD = 'demo-pass-1';

export const demoAccounts = [
	{ email: 'customer@demo.test', label: 'Customer', blurb: 'Own parcels, claims, and payment' },
	{ email: 'warehouse@demo.test', label: 'Warehouse', blurb: 'Arrival, measure, shelves, verify' },
	{ email: 'support@demo.test', label: 'Support', blurb: 'Claims and unknown parcels' },
	{ email: 'delivery@demo.test', label: 'Delivery', blurb: 'Pickup and proof of delivery' },
	{ email: 'manager@demo.test', label: 'Management', blurb: 'Usage, zones, and export' },
	{ email: 'admin@demo.test', label: 'Admin', blurb: 'Accounts and staff roles' }
] as const;

export const customerLinks = [
	{ href: '/app', label: 'Packages' },
	{ href: '/app/address', label: 'Addresses' },
	{ href: '/app/consolidations', label: 'Consolidations' },
	{ href: '/app/claims', label: 'Claims' }
];

export const warehouseLinks = [
	{ href: '/warehouse', label: 'Inventory' },
	{ href: '/warehouse/consolidations', label: 'Verify' }
];

export const supportLinks = [
	{ href: '/support', label: 'Claims' },
	{ href: '/support/abnormal', label: 'Unknown parcels' }
];

export const deliveryLinks = [{ href: '/delivery', label: 'Jobs' }];
export const managementLinks = [{ href: '/manage', label: 'Usage' }];
export const adminLinks = [{ href: '/admin', label: 'Accounts' }];
