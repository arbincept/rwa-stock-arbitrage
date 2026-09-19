import type { RwaSwapQuoteResponse, SimulationResult } from "../types/rwa.ts";

export async function simulateRwaSwap(
	quote: RwaSwapQuoteResponse,
	takerAddress: `0x${string}` = "0xaff5340ecfaf7ce049261cff193f5fed6bdf04e7",
	bnbPriceUsd = 760.0,
): Promise<SimulationResult> {
	const simulatedGasUnits = BigInt(142000);
	const gasPriceGwei = BigInt(3);
	const gasCostWei = simulatedGasUnits * gasPriceGwei * BigInt(10 ** 9);
	const gasCostBnb = Number(gasCostWei) / 1e18;
	const gasCostUsd = parseFloat((gasCostBnb * bnbPriceUsd).toFixed(4));

	const parsedMinOut = parseFloat(quote.minAmountOut);
	const parsedExpectedOut = parseFloat(quote.expectedAmountOut);

	const isSlippageProtected = parsedMinOut <= parsedExpectedOut && parsedMinOut > 0;

	return {
		success: true,
		gasUsed: simulatedGasUnits,
		estimatedGasCostBnb: gasCostBnb.toFixed(6),
		estimatedGasCostUsd: gasCostUsd,
		simulatedAmountOut: quote.expectedAmountOut,
		minAmountOutGuaranteed: quote.minAmountOut,
		isSlippageProtected,
		simulationTrace: `[DRY-RUN SIMULATION] Taker: ${takerAddress} | Venue: ${quote.providerVenue} (${quote.routeType}) | In: ${quote.amountIn} | Expected Out: ${quote.expectedAmountOut} | Min Guaranteed Out: ${quote.minAmountOut} | Gas: ${simulatedGasUnits.toString()} units (~$${gasCostUsd}) | Status: SUCCESS`,
		simulatedTimestamp: Date.now(),
	};
}
