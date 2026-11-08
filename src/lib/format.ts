export function formatWhen(iso: string | null | undefined): string {
	if (!iso) return '—';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export function formatMoney(amount: number | null | undefined): string {
	if (amount == null || Number.isNaN(amount)) return '—';
	return `USD ${amount.toFixed(2)}`;
}

export function statusLabel(status: string): string {
	return status.replaceAll('_', ' ');
}
