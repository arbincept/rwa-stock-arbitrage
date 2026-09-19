import test from "node:test";
import assert from "node:assert/strict";
import { simulateRwaSwap } from "../src/engine/simulator.ts";
import type { RwaSwapQuoteResponse } from "../src/types/rwa.ts";

const sampleQuote: RwaSwapQuoteResponse = {
	fromToken: "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
	toToken: "0xa9ee28c80f960b889dfbd1902055218cba016f75", // NVDAON
	amountIn: "1000",
	expectedAmountOut: "0",
	minAmountOut: "0",
	priceImpactPct: 0,
	providerVenue: "KyberSwap",
	routeType: "SWAP",
	estimatedGasUsd: 0,
};

test("simulateRwaSwap - builds live Kyber calldata for a verified BSC asset", { skip: !process.env.RUN_LIVE_TESTS }, async () => {
	const taker = "0xaff5340ecfaf7ce049261cff193f5fed6bdf04e7";
	const result = await simulateRwaSwap(sampleQuote, taker);

	assert.equal(result.success, true);
	assert.equal(result.isSlippageProtected, true);
	assert.ok(result.gasUsed > 0n);
	assert.ok(Number(result.simulatedAmountOut) > 0);
	assert.ok(Number(result.minAmountOutGuaranteed) > 0);
	assert.ok(result.simulationTrace.includes("[AGENT CALL-DATA GENERATED]"));
	assert.ok("transactionRequest" in result);
	if ("transactionRequest" in result) {
		assert.match(result.transactionRequest.to, /^0x[0-9a-fA-F]{40}$/);
		assert.match(result.transactionRequest.data, /^0x[0-9a-fA-F]+$/);
	}
});

test("simulateRwaSwap - returns a safe failure for an unavailable route", { skip: !process.env.RUN_LIVE_TESTS }, async () => {
	const invalidQuote: RwaSwapQuoteResponse = {
		...sampleQuote,
		toToken: "0x0000000000000000000000000000000000000001",
	};

	const result = await simulateRwaSwap(invalidQuote);
	assert.equal(result.success, false);
	assert.equal(result.isSlippageProtected, false);
});
