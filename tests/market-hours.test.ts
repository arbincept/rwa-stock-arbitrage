import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMarketHoursOpportunity, scanMarketHoursOpportunities } from "../src/engine/market-hours-arb.ts";
import type { TokenizedStock, StockPriceData } from "../src/types/rwa.ts";

const mockStock: TokenizedStock = {
	address: "0x1111111111111111111111111111111111111111",
	symbol: "NVDAon",
	name: "Nvidia Corp (Ondo)",
	underlyingTicker: "NVDA",
	platform: "Ondo Finance",
	decimals: 18,
	referencePriceSource: "NASDAQ:NVDA (Close)",
};

test("evaluateMarketHoursOpportunity - detects on-chain premium over TradFi close", () => {
	// TradFi closed at $120, on BSC trades at $123.50 (+2.9167% premium)
	const opp = evaluateMarketHoursOpportunity(mockStock, 123.50, 120.00, {
		tradeSizeUsd: 1000,
		minNetProfitPct: 0.35,
	});

	assert.equal(opp.direction, "SELL_ONCHAIN_PREMIUM");
	assert.ok(opp.grossSpreadPct > 2.9 && opp.grossSpreadPct < 2.92);
	assert.ok(opp.netProfitPct > 2.3); // Gross spread minus ~0.58% friction
	assert.equal(opp.isActionable, true);
	assert.ok(opp.rationale.includes("premium"));
});

test("evaluateMarketHoursOpportunity - detects on-chain discount under TradFi close", () => {
	// TradFi closed at $120, on BSC trades at $117.00 (-2.50% discount)
	const opp = evaluateMarketHoursOpportunity(mockStock, 117.00, 120.00, {
		tradeSizeUsd: 1000,
		minNetProfitPct: 0.35,
	});

	assert.equal(opp.direction, "BUY_ONCHAIN_DISCOUNT");
	assert.ok(opp.grossSpreadPct < -2.4 && opp.grossSpreadPct > -2.6);
	assert.ok(opp.netProfitPct > 1.9); // 2.50% - 0.58% friction
	assert.equal(opp.isActionable, true);
	assert.ok(opp.rationale.includes("discount"));
});

test("evaluateMarketHoursOpportunity - spread below friction threshold is marked non-actionable", () => {
	// TradFi closed at $120, on BSC trades at $120.10 (+0.083% spread, below ~0.58% friction)
	const opp = evaluateMarketHoursOpportunity(mockStock, 120.10, 120.00, {
		tradeSizeUsd: 1000,
		minNetProfitPct: 0.35,
	});

	assert.equal(opp.isActionable, false);
	assert.equal(opp.netProfitPct, 0); // floor at 0
});

test("evaluateMarketHoursOpportunity - throws on invalid reference price", () => {
	assert.throws(() => {
		evaluateMarketHoursOpportunity(mockStock, 120.00, 0);
	}, /Reference price must be positive/);

	assert.throws(() => {
		evaluateMarketHoursOpportunity(mockStock, 120.00, -10);
	}, /Reference price must be positive/);
});

test("scanMarketHoursOpportunities - sorts opportunities by net profit descending", () => {
	const stockList: StockPriceData[] = [
		{
			stock: { ...mockStock, symbol: "AAPLon", underlyingTicker: "AAPL" },
			onChainPriceUsd: 228.00,
			tradFiRefPriceUsd: 227.50, // spread ~ +0.22% (tight)
			marketStatus: "WEEKEND_24_7",
			timestamp: Date.now(),
		},
		{
			stock: { ...mockStock, symbol: "NVDAon", underlyingTicker: "NVDA" },
			onChainPriceUsd: 125.00,
			tradFiRefPriceUsd: 120.00, // spread ~ +4.16% (high)
			marketStatus: "WEEKEND_24_7",
			timestamp: Date.now(),
		},
		{
			stock: { ...mockStock, symbol: "SPYon", underlyingTicker: "SPY" },
			onChainPriceUsd: 550.00,
			tradFiRefPriceUsd: 560.00, // spread ~ -1.78% (medium)
			marketStatus: "WEEKEND_24_7",
			timestamp: Date.now(),
		},
	];

	const results = scanMarketHoursOpportunities(stockList, { tradeSizeUsd: 1000 });
	assert.equal(results.length, 3);
	// 1st should be NVDA (highest net profit)
	assert.equal(results[0].stock.symbol, "NVDAon");
	assert.ok(results[0].netProfitPct > results[1].netProfitPct);
	assert.ok(results[1].netProfitPct >= results[2].netProfitPct);
});
