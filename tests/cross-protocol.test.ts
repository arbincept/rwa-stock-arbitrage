import test from "node:test";
import assert from "node:assert/strict";
import { scanCrossProtocolOpportunities } from "../src/engine/cross-protocol-arb.ts";
import type { StockPriceData } from "../src/types/rwa.ts";

test("scanCrossProtocolOpportunities - detects and calculates Ondo vs bStocks arbitrage", () => {
	const stockData: StockPriceData[] = [
		{
			stock: {
				address: "0x1111111111111111111111111111111111111111",
				symbol: "NVDAon",
				name: "Nvidia Corp (Ondo)",
				underlyingTicker: "NVDA",
				platform: "Ondo Finance",
				decimals: 18,
				referencePriceSource: "NASDAQ:NVDA (Close)",
			},
			onChainPriceUsd: 121.50,
			tradFiRefPriceUsd: 120.00,
			marketStatus: "WEEKEND_24_7",
			timestamp: Date.now(),
		},
		{
			stock: {
				address: "0x2222222222222222222222222222222222222222",
				symbol: "bNVDA",
				name: "Binance Wrapped Nvidia",
				underlyingTicker: "NVDA",
				platform: "bStocks",
				decimals: 18,
				referencePriceSource: "NASDAQ:NVDA (Close)",
			},
			onChainPriceUsd: 123.80, // Trades higher on bStocks
			tradFiRefPriceUsd: 120.00,
			marketStatus: "WEEKEND_24_7",
			timestamp: Date.now(),
		},
	];

	const opps = scanCrossProtocolOpportunities(stockData, { tradeSizeUsd: 1000 });
	assert.equal(opps.length, 1);

	const opp = opps[0];
	assert.equal(opp.underlyingTicker, "NVDA");
	assert.equal(opp.cheaperVenue, "Ondo Finance");
	assert.equal(opp.expensiveVenue, "bStocks");
	assert.equal(opp.primaryStock.symbol, "NVDAon");
	assert.equal(opp.secondaryStock.symbol, "bNVDA");

	// Spread: (123.80 - 121.50) / 121.50 = 2.30 / 121.50 = ~1.893%
	assert.ok(opp.spreadPct > 1.88 && opp.spreadPct < 1.91);
	assert.equal(opp.spreadUsd, 2.30);

	// Two-leg friction is subtracted, net edge should still be positive and actionable
	assert.ok(opp.netProfitPct > 0.8);
	assert.equal(opp.isActionable, true);
	assert.ok(opp.strategy.includes("Buy NVDAon on Ondo Finance"));
	assert.ok(opp.strategy.includes("sell bNVDA on bStocks"));
});

test("scanCrossProtocolOpportunities - ignores assets with single platform wrapper", () => {
	const stockData: StockPriceData[] = [
		{
			stock: {
				address: "0x3333333333333333333333333333333333333333",
				symbol: "MSFTon",
				name: "Microsoft Corp (Ondo)",
				underlyingTicker: "MSFT",
				platform: "Ondo Finance",
				decimals: 18,
				referencePriceSource: "NASDAQ:MSFT (Close)",
			},
			onChainPriceUsd: 430.00,
			tradFiRefPriceUsd: 428.00,
			marketStatus: "WEEKEND_24_7",
			timestamp: Date.now(),
		},
	];

	const opps = scanCrossProtocolOpportunities(stockData);
	assert.equal(opps.length, 0);
});

test("scanCrossProtocolOpportunities - sorts by net edge descending", () => {
	const stockData: StockPriceData[] = [
		// Pair 1: AAPL with small spread (0.3%)
		{
			stock: {
				address: "0x4444444444444444444444444444444444444444",
				symbol: "AAPLon",
				underlyingTicker: "AAPL",
				platform: "Ondo Finance",
				name: "Apple Ondo",
				decimals: 18,
				referencePriceSource: "NASDAQ:AAPL",
			},
			onChainPriceUsd: 220.00,
			tradFiRefPriceUsd: 220.00,
			marketStatus: "WEEKEND_24_7",
			timestamp: Date.now(),
		},
		{
			stock: {
				address: "0x5555555555555555555555555555555555555555",
				symbol: "bAAPL",
				underlyingTicker: "AAPL",
				platform: "bStocks",
				name: "Apple bStocks",
				decimals: 18,
				referencePriceSource: "NASDAQ:AAPL",
			},
			onChainPriceUsd: 220.60, // 0.27% spread
			tradFiRefPriceUsd: 220.00,
			marketStatus: "WEEKEND_24_7",
			timestamp: Date.now(),
		},
		// Pair 2: SPY with large spread (2.5%)
		{
			stock: {
				address: "0x6666666666666666666666666666666666666666",
				symbol: "SPYon",
				underlyingTicker: "SPY",
				platform: "Ondo Finance",
				name: "SPY Ondo",
				decimals: 18,
				referencePriceSource: "NYSE:SPY",
			},
			onChainPriceUsd: 550.00,
			tradFiRefPriceUsd: 550.00,
			marketStatus: "WEEKEND_24_7",
			timestamp: Date.now(),
		},
		{
			stock: {
				address: "0x7777777777777777777777777777777777777777",
				symbol: "bSPY",
				underlyingTicker: "SPY",
				platform: "bStocks",
				name: "SPY bStocks",
				decimals: 18,
				referencePriceSource: "NYSE:SPY",
			},
			onChainPriceUsd: 563.75, // 2.5% spread
			tradFiRefPriceUsd: 550.00,
			marketStatus: "WEEKEND_24_7",
			timestamp: Date.now(),
		},
	];

	const opps = scanCrossProtocolOpportunities(stockData, { tradeSizeUsd: 1000 });
	assert.equal(opps.length, 2);
	// SPY has higher edge than AAPL
	assert.equal(opps[0].underlyingTicker, "SPY");
	assert.equal(opps[1].underlyingTicker, "AAPL");
	assert.ok(opps[0].netProfitPct > opps[1].netProfitPct);
});
