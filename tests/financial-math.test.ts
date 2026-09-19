import test from "node:test";
import assert from "node:assert/strict";
import { auditContractBytecode, calculateNetArbitrageProfit, evaluateTaxRisk } from "../src/engine/friction-model.ts";

test("evaluateTaxRisk - rejects tax above the configured threshold", () => {
	const result = evaluateTaxRisk(0.5, 8.1);

	assert.equal(result.isHighTax, true);
	assert.equal(result.taxKnown, true);
	assert.equal(result.status, "HIGH_RISK_TAX");
});

test("auditContractBytecode - identifies a standard ERC-1167 RWA proxy", () => {
	const implementation = "a9ee28c80f960b889dfbd1902055218cba016f75";
	const bytecode = `0x363d3d373d3d3d363d73${implementation}5af43d82803e903d91602b57fd5bf3`;
	const result = auditContractBytecode(bytecode);

	assert.equal(result.type, "STANDARD_PROXY");
	assert.equal(result.isProxy, true);
	assert.equal(result.isStandard, true);
});

test("calculateNetArbitrageProfit - blocks high-tax execution", () => {
	const result = calculateNetArbitrageProfit(1000, 2, 0.32, 0.3, 0, 9);

	assert.equal(result.executable, false);
	assert.equal(result.netProfitUsd, 0);
	assert.equal(result.reason, "High Transfer Tax Rejected");
});

test("calculateNetArbitrageProfit - returns friction breakdown for acceptable tax", () => {
	const result = calculateNetArbitrageProfit(1000, 2, 0.32, 0.3, 0.1, 0.1);

	assert.equal(result.executable, true);
	assert.ok(result.netProfitUsd > 0);
	assert.equal(result.breakdown?.gasUsd, 0.32);
});
