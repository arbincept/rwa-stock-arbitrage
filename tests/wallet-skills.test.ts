import test from "node:test";
import assert from "node:assert/strict";
import { RwaStockArbitrageSkill } from "../src/agent/wallet-skill.ts";

test("RwaStockArbitrageSkill - exposes standard tool definitions", () => {
	const skill = new RwaStockArbitrageSkill();
	const tools = skill.getTools();

	assert.equal(skill.name, "rwa_stock_arbitrage");
	assert.ok(skill.description.includes("tokenized equities on BSC"));
	assert.equal(tools.length, 3);

	const names = tools.map((t) => t.name);
	assert.ok(names.includes("scan_market_hours_gaps"));
	assert.ok(names.includes("scan_cross_protocol_gaps"));
	assert.ok(names.includes("simulate_stock_swap"));
});

test("RwaStockArbitrageSkill - executes scanMarketHoursGaps", { skip: !process.env.RUN_LIVE_TESTS }, async () => {
	const skill = new RwaStockArbitrageSkill();
	const result = await skill.scanMarketHoursGaps(0.20, 1000);

	assert.ok(result.totalScanned > 0);
	assert.ok(Array.isArray(result.opportunities));
	assert.ok(result.marketStatus.status.length > 0);
	assert.equal(typeof result.actionableCount, "number");
});

test("RwaStockArbitrageSkill - executes scanCrossProtocolGaps", { skip: !process.env.RUN_LIVE_TESTS }, async () => {
	const skill = new RwaStockArbitrageSkill();
	const result = await skill.scanCrossProtocolGaps(0.10);

	assert.ok(result.totalScanned > 0);
	assert.ok(Array.isArray(result.opportunities));
	// Look for cross-protocol pairs (NVDA, AAPL, SPY)
	const tickers = result.opportunities.map((o) => o.underlyingTicker);
	assert.ok(tickers.includes("NVDA") || tickers.includes("AAPL") || tickers.includes("SPY"));
});

test("RwaStockArbitrageSkill - executes simulateStockSwap for valid and invalid tokens", { skip: !process.env.RUN_LIVE_TESTS }, async () => {
	const skill = new RwaStockArbitrageSkill();
	
	// Valid token
	const res = await skill.simulateStockSwap("NVDAON", 500);
	assert.equal(res.simulation.success, true);
	assert.ok(["RFQ", "SWAP"].includes(res.quote.routeType));
	assert.ok(res.simulation.simulationTrace.includes("[AGENT CALL-DATA GENERATED]"));
	assert.ok(parseFloat(res.quote.expectedAmountOut) > 0);

	// Invalid token throws
	await assert.rejects(async () => {
		await skill.simulateStockSwap("UNKNOWN_STOCK_XYZ", 500);
	}, /Stock symbol "UNKNOWN_STOCK_XYZ" not found/);
});
