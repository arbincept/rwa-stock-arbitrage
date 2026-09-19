export const POPULAR_SOCIALS_BLACKLIST = [
	"pepecoineth", "shibtoken", "pancakeswap", "binance", "cz_binance",
	"vitalikbuterin", "usdt", "usdc", "uniswap", "jupiterexchange", "raydium"
];

// Implementazioni Proxy Ufficiali RWA (Esempio per Ondo e Binance bTokens)
export const STANDARD_RWA_IMPLS = [
	"0xa9ee28c80f960b889dfbd1902055218cba016f75", // Esempio NVDA Ondo Proxy
	"0x02fca66c1d1afb4e2a7884261eb00f63598a7436"  // Esempio NVDA bToken
];

export interface SecurityAuditResult {
	isHighRisk: boolean;
	taxRisk: { buyTax: number; sellTax: number; status: string };
	proxyRisk: { isProxy: boolean; isStandard: boolean; description: string };
	warning?: string;
}

/**
 * Derivato dal Flap Scanner Security Auditor.
 * Analizza le fee-on-transfer (tasse occulte) del token.
 */
export function evaluateTaxRisk(buyTax: number, sellTax: number, maxThreshold = 8) {
	const isHighTax = buyTax > maxThreshold || sellTax > maxThreshold;
	return {
		buyTax,
		sellTax,
		isHighTax,
		taxKnown: buyTax !== null && buyTax !== undefined,
		status: isHighTax ? "HIGH_RISK_TAX" : "ACCEPTABLE"
	};
}

/**
 * Derivato dal Flap Scanner Security Auditor.
 * Controlla se il contratto on-chain è un ERC-1167 Minimal Proxy e se punta 
 * a un'implementazione RWA ufficiale per evitare i token scam/honeypot.
 */
export function auditContractBytecode(bytecode: string, standardImpls = STANDARD_RWA_IMPLS) {
	if (!bytecode || bytecode === "0x") {
		return { type: "UNKNOWN", isProxy: false, implementation: null, isStandard: false, description: "Bytecode unavailable" };
	}

	const cleanCode = bytecode.toLowerCase();
	// ERC-1167 prefix: 0x363d3d373d3d3d363d73
	if (cleanCode.startsWith("0x363d3d373d3d3d363d73") && cleanCode.length >= 62) {
		const impl = "0x" + cleanCode.slice(22, 62);
		const isStandard = standardImpls.map((i) => i.toLowerCase()).includes(impl);
		return {
			type: isStandard ? "STANDARD_PROXY" : "CUSTOM_PROXY",
			isProxy: true,
			implementation: impl,
			isStandard,
			description: isStandard ? `Standard RWA Proxy` : `Custom Proxy - High Caution`
		};
	}

	return { type: "NATIVE_CONTRACT", isProxy: false, implementation: null, isStandard: false, description: "Native contract" };
}

/**
 * Calcola il profitto netto dell'arbitraggio decurtato di:
 * 1. Buy/Sell Tax (se presenti)
 * 2. Gas fees stimati su BSC
 * 3. Slippage buffer
 */
export function calculateNetArbitrageProfit(
	amountInUsd: number,
	theoreticalGrossPct: number, // Spread % calcolato dal client
	gasUsd: number,
	slippagePct: number,
	buyTaxPct = 0,
	sellTaxPct = 0
) {
	const taxRisk = evaluateTaxRisk(buyTaxPct, sellTaxPct, 8);
	
	if (taxRisk.isHighTax) {
		return { netProfitUsd: 0, netRoiPct: 0, executable: false, reason: "High Transfer Tax Rejected" };
	}

	const grossProfitUsd = amountInUsd * (theoreticalGrossPct / 100);
	
	// Sottrazione frizioni: Tasse di trasferimento (entrata + uscita), slippage atteso e gas
	const taxFrictionUsd = (amountInUsd * (buyTaxPct / 100)) + (amountInUsd * (sellTaxPct / 100));
	const slippageFrictionUsd = amountInUsd * (slippagePct / 100);
	
	const netProfitUsd = grossProfitUsd - taxFrictionUsd - slippageFrictionUsd - gasUsd;
	const netRoiPct = (netProfitUsd / amountInUsd) * 100;

	return {
		netProfitUsd,
		netRoiPct,
		executable: netProfitUsd > 0 && netRoiPct > 0.5, // Eseguibile se ROI > 0.5% netto
		reason: netProfitUsd > 0 ? "Profitable" : "Friction Exceeds Spread",
		breakdown: { grossProfitUsd, taxFrictionUsd, slippageFrictionUsd, gasUsd }
	};
}
