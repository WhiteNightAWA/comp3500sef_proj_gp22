import { createHash } from 'node:crypto';

const DECLINE_CARD = '4000000000000002';

export function chargeCard(cardNumber: string, amount: number): { ok: boolean; gatewayRef: string } {
	const digits = cardNumber.replace(/\s+/g, '');
	if (!Number.isFinite(amount) || amount <= 0) return { ok: false, gatewayRef: '' };
	if (!/^\d{16}$/.test(digits)) return { ok: false, gatewayRef: '' };
	if (digits === DECLINE_CARD) return { ok: false, gatewayRef: 'gw_declined' };
	const gatewayRef = `gw_${createHash('sha256').update(`${digits}:${amount}`).digest('hex').slice(0, 12)}`;
	return { ok: true, gatewayRef };
}
