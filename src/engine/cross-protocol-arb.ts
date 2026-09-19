import type { CrossProtocolArbitrageOpportunity, StockPriceData } from "../types/rwa.ts";
import { calculateExecutionFriction, type FrictionModelOptions } from "./friction-model.ts";

export interface CrossProtocolArbOptions extends FrictionModelOptions {
	minNetProfitPct?: number; // default 0.40%
}

/**
 * Identifies cross-protocol pricing disparities on BSC between different wrappers
 * of the same underlying asset (e.g., Ondo NVDAon vs bStocks bNVDA).
 * Directly addresses Hackathon Wishlist Idea #2.
 */
export function scanCrossProtocolOpportunities(
	stockDataList: StockPriceData[],
	options: CrossProtocolArbOptions = {},
): CrossProtocolArbitrageOpportunity[] {
	const minNetProfitPct = options.minNetProfitPct ?? 0.40;
	const tradeSizeUsd = options.tradeSizeUsd ?? 1000;

	// Group stocks by underlying ticker
	const grouped = new Map<string, StockPriceData[]>();
	for (const item of stockDataList) {
		const ticker = item.stock.underlyingTicker;
		if (!grouped.has(ticker)) {
			grouped.set(ticker, []);
		}
		grouped.get(ticker)!.push(item);
	}

	const opportunities: CrossProtocolArbitrageOpportunity[] = [];

	// Evaluate pairs of representations for the same underlying asset
	for (const [ticker, items] of grouped.entries()) {
		if (items.length < 2) continue;

		for (let i = 0; i < items.length; i++) {
			for (let j = i + 1; j < items.length; j++) {
				const a = items[i];
				const b = items[j];

				if (a.stock.platform === b.stock.platform) continue;

				// Determine cheaper and more expensive leg
				const [cheaper, expensive] = a.onChainPriceUsd <= b.onChainPriceUsd ? [a, b] : [b, a];
				const spreadUsd = parseFloat((expensive.onChainPriceUsd - cheaper.onChainPriceUsd).toFixed(4));
				const grossSpreadPct = parseFloat(((spreadUsd / cheaper.onChainPriceUsd) * 100).toFixed(4));

				// Two-leg execution friction (buying on cheaper venue, selling on expensive venue)
				const legFriction = calculateExecutionFriction({
					...options,
					tradeSizeUsd,
				});
				const totalFrictionPct = legFriction.totalFrictionPct * 1.6; // account for two-leg swap execution
				const netProfitPct = parseFloat((grossSpreadPct - totalFrictionPct).toFixed(4));
				const isActionable = netProfitPct >= minNetProfitPct;

				const strategy = `Buy ${cheaper.stock.symbol} on ${cheaper.stock.platform} at $${cheaper.onChainPriceUsd.toFixed(2)} and sell ${expensive.stock.symbol} on ${expensive.stock.platform} at $${expensive.onChainPriceUsd.toFixed(2)}. Gross gap: ${grossSpreadPct.toFixed(2)}% | Net edge: +${Math.max(0, netProfitPct).toFixed(2)}%.`;

				opportunities.push({
					underlyingTicker: ticker,
					primaryStock: cheaper.stock,
					secondaryStock: expensive.stock,
					primaryPriceUsd: cheaper.onChainPriceUsd,
					secondaryPriceUsd: expensive.onChainPriceUsd,
					spreadPct: grossSpreadPct,
					spreadUsd,
					cheaperVenue: cheaper.stock.platform,
					expensiveVenue: expensive.stock.platform,
					netProfitPct: Math.max(0, netProfitPct),
					estimatedGasCostUsd: legFriction.gasCostUsd * 2,
					isActionable,
					strategy,
				});
			}
		}
	}

	return opportunities.sort((a, b) => b.netProfitPct - a.netProfitPct);
}
