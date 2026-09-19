import test from "node:test";
import assert from "node:assert/strict";
import { simulateRwaSwap } from "../src/engine/simulator.ts";
import type { RwaSwapQuoteResponse } from "../src/types/rwa.ts";

const sampleQuote: RwaSwapQuoteResponse = {
	fromToken: "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
	toToken: "0x1111111111111111111111111111111111111111", // NVDAon
	amountIn: "1000",
	expectedAmountOut: "8.230452",
	minAmountOut: "8.205761", // 0.3% slippage protection
	priceImpactPct: "0.04",
	providerVenue: "PancakeSwap v3 / Ondo BSC Pool",
	routeType: "SPOT_DIRECT",
	estimatedGasUnits: "142000",
};

test("simulateRwaSwap - simulates swap execution with accurate gas math", async () => {
	const taker = "0xaff5340ecfaf7ce049261cff193f5fed6bdf04e7";
	const result = await simulateRwaSwap(sampleQuote, taker, 760.0);

	assert.equal(result.success, true);
	assert.equal(result.gasUsed, BigInt(142000));
	assert.equal(result.estimatedGasCostBnb, "0.000426");
	assert.ok(Math.abs(result.estimatedGasCostUsd - 0.3238) < 0.001);
	assert.equal(result.isSlippageProtected, true);
	assert.equal(result.simulatedAmountOut, sampleQuote.expectedAmountOut);
	assert.equal(result.minAmountOutGuaranteed, sampleQuote.minAmountOut);
	assert.ok(result.simulationTrace.includes("[DRY-RUN SIMULATION]"));
	assert.ok(result.simulationTrace.includes(taker));
	assert.ok(result.simulationTrace.includes("SUCCESS"));
});

test("simulateRwaSwap - verifies slippage protection check", async () => {
	const invalidQuote: RwaSwapQuoteResponse = {
		...sampleQuote,
		minAmountOut: "10.000000", // minAmountOut exceeds expectedAmountOut (invalid slippage setup)
	};

	const result = await simulateRwaSwap(invalidQuote);
	assert.equal(result.isSlippageProtected, false);
});
