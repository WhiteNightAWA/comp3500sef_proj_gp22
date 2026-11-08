import type { Role } from '#lib/domain';

declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				name: string;
				email: string;
				role: Role;
				memberCode: string | null;
				disabled: boolean;
			} | null;
		}
	}
}

export {};
