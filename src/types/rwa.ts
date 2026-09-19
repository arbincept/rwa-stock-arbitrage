export type RwaPlatform = "Ondo" | "BStock" | "xStock";

export type StockMarketStatus = "OPEN" | "CLOSED" | "AFTER_HOURS" | "WEEKEND_24_7";

export interface TokenizedStock {
	symbol: string;
	name: string;
	address: `0x${string}`;
	underlyingTicker: string;
	platform: RwaPlatform;
	category: "Tech" | "Semiconductor" | "EV" | "Index ETF" | "Commodity" | "Finance";
	decimals: number;
	referencePriceSource: "NYSE" | "NASDAQ" | "CME";
	underlyingCompanyName: string;
}

export interface StockPriceData {
	stock: TokenizedStock;
	onChainPriceUsd: number;
	tradFiRefPriceUsd: number;
	spreadPct: number; // ((onChain - tradFi) / tradFi) * 100
	spreadUsd: number;
	volume24hUsd: number;
	liquidityDepthUsd: number;
	marketStatus: StockMarketStatus;
	nextMarketOpenUtc?: string;
	lastUpdated: number;
}

export interface MarketHoursArbitrageOpportunity {
	stock: TokenizedStock;
	direction: "BUY_ONCHAIN_DISCOUNT" | "SELL_ONCHAIN_PREMIUM";
	onChainPriceUsd: number;
	tradFiRefPriceUsd: number;
	grossSpreadPct: number;
	netProfitPct: number; // after dynamic slippage & gas friction
	estimatedGasCostUsd: number;
	recommendedTradeUsd: number;
	isActionable: boolean;
	rationale: string;
}

export interface CrossProtocolArbitrageOpportunity {
	underlyingTicker: string;
	primaryStock: TokenizedStock; // e.g. Ondo NVDAon
	secondaryStock: TokenizedStock; // e.g. bStock bNVDA
	primaryPriceUsd: number;
	secondaryPriceUsd: number;
	spreadPct: number; // ((primary - secondary) / secondary) * 100
	spreadUsd: number;
	cheaperVenue: RwaPlatform;
	expensiveVenue: RwaPlatform;
	netProfitPct: number;
	estimatedGasCostUsd: number;
	isActionable: boolean;
	strategy: string;
}

export interface RwaSwapQuoteRequest {
	fromToken: `0x${string}`;
	toToken: `0x${string}`;
	amountIn: string;
	decimalsIn?: number;
	decimalsOut?: number;
	slippagePct?: number;
	takerAddress?: `0x${string}`;
}

export interface RwaSwapQuoteResponse {
	routeType: "SWAP" | "RFQ";
	fromToken: `0x${string}`;
	toToken: `0x${string}`;
	amountIn: string;
	expectedAmountOut: string;
	minAmountOut: string;
	priceImpactPct: number;
	estimatedGasUsd: number;
	providerVenue: string;
	toRouterAddress: `0x${string}`;
}

export interface SimulationResult {
	success: boolean;
	gasUsed: bigint;
	estimatedGasCostBnb: string;
	estimatedGasCostUsd: number;
	simulatedAmountOut: string;
	minAmountOutGuaranteed: string;
	isSlippageProtected: boolean;
	simulationTrace: string;
	simulatedTimestamp: number;
}
