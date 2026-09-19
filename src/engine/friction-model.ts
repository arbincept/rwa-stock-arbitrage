export interface FrictionModelOptions {
	tradeSizeUsd?: number;
	dexFeePct?: number; // 0.25% standard AMM or 0.05% concentrated liquidity
	slippageBufferPct?: number; // 0.30%
	bnbPriceUsd?: number; // default $760
	gasUnits?: bigint; // default 142,000 gas units
	gasPriceGwei?: bigint; // default 3 gwei on BSC
}

export interface FrictionAnalysis {
	tradeSizeUsd: number;
	dexFeeUsd: number;
	dexFeePct: number;
	slippageUsd: number;
	slippagePct: number;
	gasCostBnb: number;
	gasCostUsd: number;
	gasFrictionPct: number;
	totalFrictionUsd: number;
	totalFrictionPct: number;
	breakevenSpreadPct: number;
}

/**
 * Models real execution friction (gas, DEX pool fees, slippage buffer) on BSC Mainnet.
 * Harvested and adapted from bsc-arbitrage-scanner production principles.
 */
export function calculateExecutionFriction(options: FrictionModelOptions = {}): FrictionAnalysis {
	const tradeSizeUsd = options.tradeSizeUsd ?? 1000;
	const dexFeePct = options.dexFeePct ?? 0.25;
	const slippagePct = options.slippageBufferPct ?? 0.30;
	const bnbPriceUsd = options.bnbPriceUsd ?? 760;
	const gasUnits = options.gasUnits ?? BigInt(142000);
	const gasPriceGwei = options.gasPriceGwei ?? BigInt(3);

	// Gas math in Wei -> BNB -> USD
	const gasCostWei = gasUnits * gasPriceGwei * BigInt(10 ** 9);
	const gasCostBnb = Number(gasCostWei) / 1e18;
	const gasCostUsd = parseFloat((gasCostBnb * bnbPriceUsd).toFixed(4));
	const gasFrictionPct = parseFloat(((gasCostUsd / tradeSizeUsd) * 100).toFixed(4));

	const dexFeeUsd = parseFloat(((tradeSizeUsd * dexFeePct) / 100).toFixed(4));
	const slippageUsd = parseFloat(((tradeSizeUsd * slippagePct) / 100).toFixed(4));

	const totalFrictionPct = parseFloat((dexFeePct + slippagePct + gasFrictionPct).toFixed(4));
	const totalFrictionUsd = parseFloat((dexFeeUsd + slippageUsd + gasCostUsd).toFixed(4));

	return {
		tradeSizeUsd,
		dexFeeUsd,
		dexFeePct,
		slippageUsd,
		slippagePct,
		gasCostBnb,
		gasCostUsd,
		gasFrictionPct,
		totalFrictionUsd,
		totalFrictionPct,
		breakevenSpreadPct: totalFrictionPct,
	};
}
