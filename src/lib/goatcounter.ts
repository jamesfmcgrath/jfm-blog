export function goatcounterCountUrl(code: string | undefined): string | null {
	if (code == null) return null;
	const trimmed = code.trim();
	if (!trimmed) return null;
	return `https://${trimmed}.goatcounter.com/count`;
}
