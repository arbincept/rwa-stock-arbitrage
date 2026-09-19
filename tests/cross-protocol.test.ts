import test from "node:test";
import assert from "node:assert/strict";
import { scanCrossProtocolOpportunities } from "../src/engine/cross-protocol-arb.ts";
import type { StockPriceData } from "../src/types/rwa.ts";

test("scanCrossProtocolOpportunities - detects and calculates Ondo vs bStocks arbitrage", () => {
	const stockData: StockPriceData[] = [
		{
			stock: {
				address: "0xa9ee28c80f960b889dfbd1902055218cba016f75",
				symbol: "NVDAON",
				name: "Nvidia Corp (Ondo)",
				underlyingTicker: "NVDA",
				platform: "Ondo",
				decimals: 18,
				referencePriceSource: "NASDAQ",
				underlyingCompanyName: "NVIDIA Corporation",
			},
			onChainPriceUsd: 121.50,
			tradFiRefPriceUsd: 120.00,
			volume24hUsd: 100000,
			liquidityDepthUsd: 500000,
			marketStatus: "WEEKEND_24_7",
			lastUpdated: Date.now(),
		},
		{
			stock: {
				address: "0x02fca66c1d1afb4e2a7884261eb00f63598a7436",
				symbol: "NVDAB",
				name: "Binance Wrapped Nvidia",
				underlyingTicker: "NVDA",
				platform: "BStock",
				decimals: 18,
				referencePriceSource: "NASDAQ",
				underlyingCompanyName: "NVIDIA Corporation",
			},
			onChainPriceUsd: 123.80,
			tradFiRefPriceUsd: 120.00,
			volume24hUsd: 100000,
			liquidityDepthUsd: 500000,
			marketStatus: "WEEKEND_24_7",
			lastUpdated: Date.now(),
		},
	];

	const opps = scanCrossProtocolOpportunities(stockData, { tradeSizeUsd: 1000 });
	assert.equal(opps.length, 1);

	const opp = opps[0];
	assert.equal(opp.underlyingTicker, "NVDA");
	assert.equal(opp.cheaperVenue, "Ondo");
	assert.equal(opp.expensiveVenue, "BStock");
	assert.equal(opp.primaryStock.symbol, "NVDAON");
	assert.equal(opp.secondaryStock.symbol, "NVDAB");

	// Spread: (123.80 - 121.50) / 121.50 = 2.30 / 121.50 = ~1.893%
	assert.ok(opp.spreadPct > 1.88 && opp.spreadPct < 1.91);
	assert.equal(opp.spreadUsd, 2.30);

	// Two-leg friction is subtracted, net edge should still be positive and actionable
	assert.ok(opp.netProfitPct > 0.8);
	assert.equal(opp.isActionable, true);
	assert.ok(opp.strategy.includes("Buy NVDAON on Ondo"));
	assert.ok(opp.strategy.includes("sell NVDAB on BStock"));
});

test("scanCrossProtocolOpportunities - ignores assets with single platform wrapper", () => {
	const stockData: StockPriceData[] = [
		{
			stock: {
				address: "0x6bfe75d1ad432050ea973c3a3dcd88f02e2444c3",
				symbol: "MSFTON",
				name: "Microsoft Corp (Ondo)",
				underlyingTicker: "MSFT",
				platform: "Ondo",
				decimals: 18,
				referencePriceSource: "NASDAQ",
				underlyingCompanyName: "Microsoft Corporation",
			},
			onChainPriceUsd: 430.00,
			tradFiRefPriceUsd: 428.00,
			volume24hUsd: 100000,
			liquidityDepthUsd: 500000,
			marketStatus: "WEEKEND_24_7",
			lastUpdated: Date.now(),
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
				address: "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4",
				symbol: "AAPLON",
				underlyingTicker: "AAPL",
				platform: "Ondo",
				name: "Apple Ondo",
				decimals: 18,
				referencePriceSource: "NASDAQ",
				underlyingCompanyName: "Apple Inc.",
			},
			onChainPriceUsd: 220.00,
			tradFiRefPriceUsd: 220.00,
			volume24hUsd: 100000,
			liquidityDepthUsd: 500000,
			marketStatus: "WEEKEND_24_7",
			lastUpdated: Date.now(),
		},
		{
			stock: {
				address: "0x431a3bee82e2ca41e49895cbece5bb0f76a89b7a",
				symbol: "AAPLB",
				underlyingTicker: "AAPL",
				platform: "BStock",
				name: "Apple bStocks",
				decimals: 18,
				referencePriceSource: "NASDAQ",
				underlyingCompanyName: "Apple Inc.",
			},
			onChainPriceUsd: 220.60,
			tradFiRefPriceUsd: 220.00,
			volume24hUsd: 100000,
			liquidityDepthUsd: 500000,
			marketStatus: "WEEKEND_24_7",
			lastUpdated: Date.now(),
		},
		// Pair 2: SPY with large spread (2.5%)
		{
			stock: {
				address: "0x6a708ead771238919d85930b5a0f10454e1c331a",
				symbol: "SPYON",
				underlyingTicker: "SPY",
				platform: "Ondo",
				name: "SPY Ondo",
				decimals: 18,
				referencePriceSource: "NYSE",
				underlyingCompanyName: "SPDR S&P 500 ETF",
			},
			onChainPriceUsd: 550.00,
			tradFiRefPriceUsd: 550.00,
			volume24hUsd: 100000,
			liquidityDepthUsd: 500000,
			marketStatus: "WEEKEND_24_7",
			lastUpdated: Date.now(),
		},
		{
			stock: {
				address: "0x7138b48df7d98d7e3cc221bfe7192d0a178182d8",
				symbol: "SPYB",
				underlyingTicker: "SPY",
				platform: "BStock",
				name: "SPY bStocks",
				decimals: 18,
				referencePriceSource: "NYSE",
				underlyingCompanyName: "SPDR S&P 500 ETF",
			},
			onChainPriceUsd: 563.75,
			tradFiRefPriceUsd: 550.00,
			volume24hUsd: 100000,
			liquidityDepthUsd: 500000,
			marketStatus: "WEEKEND_24_7",
			lastUpdated: Date.now(),
		},
	];

	const opps = scanCrossProtocolOpportunities(stockData, { tradeSizeUsd: 1000 });
	assert.equal(opps.length, 2);
	// SPY has higher edge than AAPL
	assert.equal(opps[0].underlyingTicker, "SPY");
	assert.equal(opps[1].underlyingTicker, "AAPL");
	assert.ok(opps[0].netProfitPct > opps[1].netProfitPct);
});
