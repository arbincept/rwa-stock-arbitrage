import type { RwaSwapQuoteResponse } from "../types/rwa.ts";

const KYBER_ROUTE_API = "https://aggregator-api.kyberswap.com/bsc/api/v1/routes";
const KYBER_BUILD_API = "https://aggregator-api.kyberswap.com/bsc/api/v1/route/build";

// Configurazione estratta nativamente da Arb Inc DEX (5 bps per i bot)
const FEE_RECEIVER = "0xafF5340ECFaf7ce049261cff193f5FED6BDF04E7";
const FEE_BPS = 5; 

export async function simulateRwaSwap(quote: RwaSwapQuoteResponse, senderAddress = "0xaff5340ecfaf7ce049261cff193f5fed6bdf04e7") {
	try {
		const amountInWei = BigInt(Math.floor(parseFloat(quote.amountIn) * 1e18)).toString();
		const routeRes = await fetch(`${KYBER_ROUTE_API}?tokenIn=${quote.fromToken}&tokenOut=${quote.toToken}&amountIn=${amountInWei}&saveGas=0&gasInclude=1`);
		const routeData = await routeRes.json();
		const routeSummary = routeData.data?.routeSummary;

		if (!routeSummary) {
			return {
				success: false,
				simulatedAmountOut: "0",
				minAmountOutGuaranteed: "0",
				isSlippageProtected: false,
				simulatedTimestamp: Date.now(),
				gasUsed: 0n,
				estimatedGasCostBnb: "0",
				estimatedGasCostUsd: 0,
				simulationTrace: `[ERROR] Nessuna route trovata per lo swap.`
			};
		}

		const buildRes = await fetch(KYBER_BUILD_API, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				routeSummary,
				sender: senderAddress,
				recipient: senderAddress,
				slippageTolerance: 50,
				feeReceiver: FEE_RECEIVER,
				isInBps: true,
				feeAmount: FEE_BPS
			})
		});

		const buildData = await buildRes.json();
		const txData = buildData.data?.data;
		const routerAddress = buildData.data?.routerAddress;

		if (!txData) {
			return {
				success: false,
				simulatedAmountOut: "0",
				minAmountOutGuaranteed: "0",
				isSlippageProtected: false,
				simulatedTimestamp: Date.now(),
				gasUsed: 0n,
				estimatedGasCostBnb: "0",
				estimatedGasCostUsd: 0,
				simulationTrace: `[ERROR] Fallimento nella generazione del calldata (Anti-Phantom Pool).`
			};
		}

		const expectedOutNum = parseFloat(routeSummary.amountOut) / 1e18;
		const expectedOutStr = expectedOutNum.toFixed(4);
		const minOutStr = (expectedOutNum * 0.995).toFixed(4);

		return {
			success: true,
			simulatedAmountOut: expectedOutStr,
			minAmountOutGuaranteed: minOutStr,
			isSlippageProtected: true,
			simulatedTimestamp: Date.now(),
			gasUsed: BigInt(routeSummary.gas || 250000),
			estimatedGasCostBnb: ((Number(routeSummary.gas || 0) * Number(routeSummary.gasPrice || 0)) / 1e18).toFixed(6),
			estimatedGasCostUsd: Number(buildData.data?.gasUsd || routeSummary.gasUsd || 0),
			simulationTrace: `[AGENT CALL-DATA GENERATED] Transazione Web3 pronta per la firma.
📍 Target Router: ${routerAddress}
💎 Expected Out: ${expectedOutStr} (al netto dello slippage)
⛽ Gas Est: ${routeSummary.gas} units
💼 Fee Receiver (Arb Inc): ${FEE_RECEIVER} (${FEE_BPS} bps)`,
			transactionRequest: {
				to: routerAddress,
				data: txData,
				value: `0x${BigInt(buildData.data?.transactionValue || "0").toString(16)}`,
			}
		};
	} catch (e: any) {
		return {
			success: false,
			simulatedAmountOut: "0",
			minAmountOutGuaranteed: "0",
			isSlippageProtected: false,
			simulatedTimestamp: Date.now(),
			gasUsed: 0n,
			estimatedGasCostBnb: "0",
			estimatedGasCostUsd: 0,
			simulationTrace: `[SIMULATION ERROR] ${e.message}`
		};
	}
}
