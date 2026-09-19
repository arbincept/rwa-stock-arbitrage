import type { MarketHoursArbitrageOpportunity, StockPriceData, TokenizedStock } from "../types/rwa.ts";
import { calculateExecutionFriction, type FrictionModelOptions } from "./friction-model.ts";

export interface MarketHoursArbOptions extends FrictionModelOptions {
	minNetProfitPct?: number; // default 0.35%
}

export function evaluateMarketHoursOpportunity(
	stock: TokenizedStock,
	onChainPrice: number,
	refPrice: number,
	options: MarketHoursArbOptions = {},
): MarketHoursArbitrageOpportunity {
	const minNetProfitPct = options.minNetProfitPct ?? 0.35;
	const tradeSizeUsd = options.tradeSizeUsd ?? 1000;

	if (refPrice <= 0) {
		throw new Error("Reference price must be positive");
	}

	const spreadUsd = parseFloat((onChainPrice - refPrice).toFixed(4));
	const grossSpreadPct = parseFloat(((spreadUsd / refPrice) * 100).toFixed(4));
	const absSpreadPct = Math.abs(grossSpreadPct);

	const friction = calculateExecutionFriction({
		...options,
		tradeSizeUsd,
	});

	const netProfitPct = parseFloat((absSpreadPct - friction.totalFrictionPct).toFixed(4));
	const isActionable = netProfitPct >= minNetProfitPct;

	let direction: "BUY_ONCHAIN_DISCOUNT" | "SELL_ONCHAIN_PREMIUM";
	let rationale: string;

	if (grossSpreadPct < 0) {
		direction = "BUY_ONCHAIN_DISCOUNT";
		rationale = `${stock.symbol} trades at a ${Math.abs(grossSpreadPct).toFixed(2)}% discount on-chain vs ${stock.referencePriceSource} ($${refPrice.toFixed(2)}). Net edge after friction: +${Math.max(0, netProfitPct).toFixed(2)}%.`;
	} else {
		direction = "SELL_ONCHAIN_PREMIUM";
		rationale = `${stock.symbol} trades at a ${grossSpreadPct.toFixed(2)}% premium on-chain vs ${stock.referencePriceSource} ($${refPrice.toFixed(2)}). Net edge after friction: +${Math.max(0, netProfitPct).toFixed(2)}%.`;
	}

	return {
		stock,
		direction,
		onChainPriceUsd: onChainPrice,
		tradFiRefPriceUsd: refPrice,
		grossSpreadPct,
		netProfitPct: Math.max(0, netProfitPct),
		estimatedGasCostUsd: friction.gasCostUsd,
		recommendedTradeUsd: tradeSizeUsd,
		isActionable,
		rationale,
	};
}

export function scanMarketHoursOpportunities(
	stocks: StockPriceData[],
	options: MarketHoursArbOptions = {},
): MarketHoursArbitrageOpportunity[] {
	return stocks
		.map((s) => evaluateMarketHoursOpportunity(s.stock, s.onChainPriceUsd, s.tradFiRefPriceUsd, options))
		.sort((a, b) => b.netProfitPct - a.netProfitPct);
}
