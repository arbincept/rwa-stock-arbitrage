import test from "node:test";
import assert from "node:assert/strict";
import { calculateExecutionFriction } from "../src/engine/friction-model.ts";

test("calculateExecutionFriction - baseline BSC gas calculation", () => {
	// Baseline: 1000 USD trade, 142k gas @ 3 gwei, BNB @ $760
	const friction = calculateExecutionFriction({
		tradeSizeUsd: 1000,
		dexFeePct: 0.25,
		slippageBufferPct: 0.30,
		bnbPriceUsd: 760,
		gasUnits: BigInt(142000),
		gasPriceGwei: BigInt(3),
	});

	// Gas math: 142,000 * 3 * 10^9 = 426,000,000,000,000 wei = 0.000426 BNB
	// 0.000426 * 760 = $0.32376 gas cost
	assert.equal(friction.gasCostBnb, 0.000426);
	assert.ok(Math.abs(friction.gasCostUsd - 0.3238) < 0.001);
	
	// DEX fee: 0.25% of 1000 = $2.50
	assert.equal(friction.dexFeeUsd, 2.5);

	// Slippage buffer: 0.30% of 1000 = $3.00
	assert.equal(friction.slippageUsd, 3.0);

	// Gas friction %: 0.3238 / 1000 = 0.0324%
	assert.ok(friction.gasFrictionPct > 0.03 && friction.gasFrictionPct < 0.04);

	// Total friction %: 0.25 + 0.30 + 0.0324 = ~0.5824%
	assert.ok(friction.totalFrictionPct > 0.58 && friction.totalFrictionPct < 0.59);
	assert.equal(friction.breakevenSpreadPct, friction.totalFrictionPct);
});

test("calculateExecutionFriction - sensitivity to trade size", () => {
	const smallTrade = calculateExecutionFriction({ tradeSizeUsd: 100 });
	const mediumTrade = calculateExecutionFriction({ tradeSizeUsd: 1000 });
	const largeTrade = calculateExecutionFriction({ tradeSizeUsd: 10000 });

	// Gas cost in USD should be identical across trade sizes (same transaction overhead)
	assert.equal(smallTrade.gasCostUsd, mediumTrade.gasCostUsd);
	assert.equal(mediumTrade.gasCostUsd, largeTrade.gasCostUsd);

	// Gas friction % must drastically decrease as trade size increases
	assert.ok(smallTrade.gasFrictionPct > mediumTrade.gasFrictionPct);
	assert.ok(mediumTrade.gasFrictionPct > largeTrade.gasFrictionPct);

	// For a $100 trade, gas is ~0.32% of capital; for a $10,000 trade, gas is ~0.0032%
	assert.ok(smallTrade.gasFrictionPct > 0.3);
	assert.ok(largeTrade.gasFrictionPct < 0.01);
});

test("calculateExecutionFriction - zero/default fallbacks", () => {
	const friction = calculateExecutionFriction();
	assert.equal(friction.tradeSizeUsd, 1000);
	assert.equal(friction.dexFeePct, 0.25);
	assert.equal(friction.slippagePct, 0.30);
	assert.ok(friction.totalFrictionUsd > 0);
	assert.ok(friction.totalFrictionPct > 0);
});
