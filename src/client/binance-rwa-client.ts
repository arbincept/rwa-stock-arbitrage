import type {
	RwaSwapQuoteRequest,
	RwaSwapQuoteResponse,
	StockMarketStatus,
	StockPriceData,
	TokenizedStock,
} from "../types/rwa.ts";
import {
	fetchLiveBnbPrice,
	fetchLiveTradFiBenchmarks,
	fetchLiveBscGasPriceGwei,
	FALLBACK_TRADFI_BENCHMARKS,
} from "./live-market-feed.ts";

export const VERIFIED_BSC_STOCKS: TokenizedStock[] = [
	{
		symbol: "NVDAON",
		name: "Nvidia Tokenized Stock (Ondo/BSC)",
		address: "0xa9ee28c80f960b889dfbd1902055218cba016f75",
		underlyingTicker: "NVDA",
		platform: "Ondo",
		category: "Semiconductor",
		decimals: 18,
		referencePriceSource: "NASDAQ",
		underlyingCompanyName: "NVIDIA Corporation",
	},
	{
		symbol: "NVDAB",
		name: "Nvidia Tokenized Stock (Binance bStock)",
		address: "0x02fca66c1d1afb4e2a7884261eb00f63598a7436",
		underlyingTicker: "NVDA",
		platform: "BStock",
		category: "Semiconductor",
		decimals: 18,
		referencePriceSource: "NASDAQ",
		underlyingCompanyName: "NVIDIA Corporation",
	},
	{
		symbol: "TSLAON",
		name: "Tesla Tokenized Stock (Ondo/BSC)",
		address: "0x2494b603319d4d9f9715c9f4496d9e0364b59d93",
		underlyingTicker: "TSLA",
		platform: "Ondo",
		category: "EV",
		decimals: 18,
		referencePriceSource: "NASDAQ",
		underlyingCompanyName: "Tesla, Inc.",
	},
	{
		symbol: "TSLAB",
		name: "Tesla Tokenized Stock (Binance bStock)",
		address: "0x5b1910eaad6450e50f816082aa078c41f10c292f",
		underlyingTicker: "TSLA",
		platform: "BStock",
		category: "EV",
		decimals: 18,
		referencePriceSource: "NASDAQ",
		underlyingCompanyName: "Tesla, Inc.",
	},
	{
		symbol: "AAPLON",
		name: "Apple Tokenized Stock (Ondo/BSC)",
		address: "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4",
		underlyingTicker: "AAPL",
		platform: "Ondo",
		category: "Tech",
		decimals: 18,
		referencePriceSource: "NASDAQ",
		underlyingCompanyName: "Apple Inc.",
	},
	{
		symbol: "AAPLB",
		name: "Apple Tokenized Stock (Binance bStock)",
		address: "0x431a3bee82e2ca41e49895cbece5bb0f76a89b7a",
		underlyingTicker: "AAPL",
		platform: "BStock",
		category: "Tech",
		decimals: 18,
		referencePriceSource: "NASDAQ",
		underlyingCompanyName: "Apple Inc.",
	},
	{
		symbol: "SPYON",
		name: "SPDR S&P 500 ETF Tokenized (Ondo)",
		address: "0x6a708ead771238919d85930b5a0f10454e1c331a",
		underlyingTicker: "SPY",
		platform: "Ondo",
		category: "Index ETF",
		decimals: 18,
		referencePriceSource: "NYSE",
		underlyingCompanyName: "SPDR S&P 500 ETF",
	},
	{
		symbol: "SPYB",
		name: "SPDR S&P 500 ETF Tokenized (Binance bStock)",
		address: "0x7138b48df7d98d7e3cc221bfe7192d0a178182d8",
		underlyingTicker: "SPY",
		platform: "BStock",
		category: "Index ETF",
		decimals: 18,
		referencePriceSource: "NYSE",
		underlyingCompanyName: "SPDR S&P 500 ETF",
	},
	{
		symbol: "COINON",
		name: "Coinbase Global Tokenized Stock (Ondo/BSC)",
		address: "0xf8589b526fdd65f7f301c605a6e04f0f1b4b3620",
		underlyingTicker: "COIN",
		platform: "Ondo",
		category: "Finance",
		decimals: 18,
		referencePriceSource: "NASDAQ",
		underlyingCompanyName: "Coinbase Global, Inc.",
	},
	{
		symbol: "COINB",
		name: "Coinbase Global Tokenized Stock (Binance bStock)",
		address: "0x585bde7c54abb5ccd7791f923d6c2187635f3952",
		underlyingTicker: "COIN",
		platform: "BStock",
		category: "Finance",
		decimals: 18,
		referencePriceSource: "NASDAQ",
		underlyingCompanyName: "Coinbase Global, Inc.",
	},
	{
		symbol: "MSFTON",
		name: "Microsoft Tokenized Stock (Ondo/BSC)",
		address: "0x6bfe75d1ad432050ea973c3a3dcd88f02e2444c3",
		underlyingTicker: "MSFT",
		platform: "Ondo",
		category: "Tech",
		decimals: 18,
		referencePriceSource: "NASDAQ",
		underlyingCompanyName: "Microsoft Corporation",
	},
	{
		symbol: "MSFTB",
		name: "Microsoft Tokenized Stock (Binance bStock)",
		address: "0x80106cb3ead06659a5ad19df39d9b4733863b9b0",
		underlyingTicker: "MSFT",
		platform: "BStock",
		category: "Tech",
		decimals: 18,
		referencePriceSource: "NASDAQ",
		underlyingCompanyName: "Microsoft Corporation",
	},
];

export { FALLBACK_TRADFI_BENCHMARKS as TRADFI_BENCHMARKS } from "./live-market-feed.ts";

const BSC_MARKET_TICKERS: Record<string, string> = {
	NVDAB: "NVDABUSDT",
	TSLAB: "TSLABUSDT",
	AAPLB: "AAPLBUSDT",
	SPYB: "SPYBUSDT",
	COINB: "COINBUSDT",
	MSFTB: "MSFTBUSDT",
};

const _STATIC_BENCHMARKS: Record<string, { refPrice: number; prevClose: number }> = {
	NVDA: { refPrice: 222.27, prevClose: 219.34 },
	TSLA: { refPrice: 364.27, prevClose: 366.20 },
	AAPL: { refPrice: 228.40, prevClose: 226.90 },
	SPY: { refPrice: 563.80, prevClose: 561.20 },
	COIN: { refPrice: 168.90, prevClose: 165.40 },
	MSFT: { refPrice: 435.10, prevClose: 432.50 },
};

export class BinanceRwaClient {
	private baseUrl: string;

	constructor(_apiKey?: string, _secretKey?: string, baseUrl = "https://web3.binance.com") {
		this.baseUrl = baseUrl;
	}

	public getMarketStatus(date: Date = new Date()): { status: StockMarketStatus; nextOpen: string } {
		const utcDay = date.getUTCDay();
		const utcHours = date.getUTCHours();
		const utcMinutes = date.getUTCMinutes();
		const currentMinute = utcHours * 60 + utcMinutes;

		if (utcDay === 6 || utcDay === 0 || (utcDay === 5 && currentMinute >= 1260) || (utcDay === 1 && currentMinute < 810)) {
			const daysUntilMonday = (8 - utcDay) % 7 || 7;
			const nextMonday = new Date(date);
			nextMonday.setUTCDate(date.getUTCDate() + (utcDay === 1 ? 0 : daysUntilMonday));
			nextMonday.setUTCHours(13, 30, 0, 0);

			return { status: "WEEKEND_24_7", nextOpen: nextMonday.toISOString() };
		}

		if (currentMinute >= 810 && currentMinute <= 1200) {
			return { status: "OPEN", nextOpen: "Currently Open (NYSE/NASDAQ Regular Hours)" };
		}

		return { status: "AFTER_HOURS", nextOpen: "Pre-Market opens at 13:30 UTC" };
	}

	public async getStockPrices(): Promise<StockPriceData[]> {
		const marketInfo = this.getMarketStatus();
		const now = Date.now();

		const [liveBenchmarks, liveBnbPrice] = await Promise.all([
			fetchLiveTradFiBenchmarks(),
			fetchLiveBnbPrice(),
		]);

		const officialRwaData: Record<string, { tokenPrice?: number; stockPrice?: number }> = {};
		const dexData: Record<string, { liquidityUsd: number; volume24hUsd: number }> = {};
		await Promise.allSettled(
			VERIFIED_BSC_STOCKS.map(async (stock) => {
				const path = `/bapi/defi/v2/public/wallet-direct/buw/wallet/market/token/rwa/dynamic/ai?chainId=56&contractAddress=${stock.address}`;
				try {
					const res = await fetch(`${this.baseUrl}${path}`, {
						headers: { Accept: "application/json", "Accept-Encoding": "identity", "User-Agent": "binance-web3/1.1 (Skill)" },
						signal: AbortSignal.timeout(3000),
					});
					if (!res.ok) return;
					const json = (await res.json()) as {
						code?: string;
						data?: { tokenInfo?: { price?: string }; stockInfo?: { price?: string } };
					};
					const tokenPrice = Number(json.data?.tokenInfo?.price);
					const stockPrice = Number(json.data?.stockInfo?.price);
					officialRwaData[stock.symbol] = {
						tokenPrice: Number.isFinite(tokenPrice) && tokenPrice > 0 ? tokenPrice : undefined,
						stockPrice: Number.isFinite(stockPrice) && stockPrice > 0 ? stockPrice : undefined,
					};
				} catch {
					// Public Binance RWA data is unavailable; retain the secondary feed.
				}
			}),
		);

		await Promise.allSettled(
			VERIFIED_BSC_STOCKS.map(async (stock) => {
				try {
					const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${stock.address}`, {
						signal: AbortSignal.timeout(3000),
					});
					if (!res.ok) return;
					const json = (await res.json()) as {
						pairs?: Array<{ chainId?: string; liquidity?: { usd?: number }; volume?: { h24?: number } }>;
					};
					const bscPairs = (json.pairs ?? []).filter((pair) => pair.chainId === "bsc");
					dexData[stock.symbol] = {
						liquidityUsd: bscPairs.reduce((total, pair) => total + (Number(pair.liquidity?.usd) || 0), 0),
						volume24hUsd: bscPairs.reduce((total, pair) => total + (Number(pair.volume?.h24) || 0), 0),
					};
				} catch {
					// DEX liquidity data is optional; do not fabricate a value when unavailable.
				}
			}),
		);

		// Fallback storico per ticker di mercato
		const apiPrices: Record<string, number> = {};
		const tickerChecks = await Promise.allSettled(
			Object.entries(BSC_MARKET_TICKERS).map(async ([symbol, ticker]) => {
				try {
					const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${ticker}`, {
						signal: AbortSignal.timeout(3000),
					});
					if (!res.ok) return;
					const json = (await res.json()) as { price?: string };
					const price = Number(json.price);
					if (Number.isFinite(price) && price > 0) {
						apiPrices[symbol] = price;
					}
				} catch { }
			}),
		);
		
		void tickerChecks;
		void liveBnbPrice;

		return VERIFIED_BSC_STOCKS.map((stock) => {
			const liveBenchmark = liveBenchmarks[stock.underlyingTicker];
			const fallbackRef = liveBenchmark
				? { refPrice: liveBenchmark.refPrice, prevClose: liveBenchmark.prevClose }
				: (FALLBACK_TRADFI_BENCHMARKS[stock.underlyingTicker] || { refPrice: 100, prevClose: 100 });
			
			const official = officialRwaData[stock.symbol];
			const tradFiPrice = official?.stockPrice ?? fallbackRef.refPrice;

			const realTickerPrice = apiPrices[stock.symbol];
			
			const onChainPrice = official?.tokenPrice ?? realTickerPrice ?? tradFiPrice;
			const liveDexData = dexData[stock.symbol];

			const spreadUsd = parseFloat((onChainPrice - tradFiPrice).toFixed(2));
			const spreadPct = parseFloat(((spreadUsd / tradFiPrice) * 100).toFixed(2));
			return {
				stock,
				onChainPriceUsd: onChainPrice,
				tradFiRefPriceUsd: tradFiPrice,
				spreadPct,
				spreadUsd,
				volume24hUsd: liveDexData?.volume24hUsd ?? 0,
				liquidityDepthUsd: liveDexData?.liquidityUsd ?? 0,
				marketStatus: marketInfo.status,
				nextMarketOpenUtc: marketInfo.nextOpen,
				lastUpdated: now,
			};
		});
	}

	public async getSwapQuote(req: RwaSwapQuoteRequest): Promise<RwaSwapQuoteResponse> {
		const parsedAmountIn = parseFloat(req.amountIn);
		if (isNaN(parsedAmountIn) || parsedAmountIn <= 0) {
			throw new Error("Invalid input amount for swap quote");
		}

		const slippage = req.slippagePct ?? 0.5;
		const amountInWei = BigInt(Math.floor(parsedAmountIn * 1e18)).toString();
		const routeUrl = `https://aggregator-api.kyberswap.com/bsc/api/v1/routes?tokenIn=${req.fromToken}&tokenOut=${req.toToken}&amountIn=${amountInWei}&saveGas=0&gasInclude=1`;
		const routeResponse = await fetch(routeUrl, { signal: AbortSignal.timeout(5000) });
		if (!routeResponse.ok) {
			throw new Error(`Kyber route request failed with HTTP ${routeResponse.status}`);
		}

		const routePayload = (await routeResponse.json()) as {
			data?: { routeSummary?: { amountOut?: string; gasUsd?: string } };
		};
		const routeSummary = routePayload.data?.routeSummary;
		const expectedAmountOut = Number(routeSummary?.amountOut) / 1e18;
		if (!Number.isFinite(expectedAmountOut) || expectedAmountOut <= 0) {
			throw new Error("Kyber returned no executable route for this asset");
		}

		const minAmountOut = expectedAmountOut * (1 - slippage / 100);

		return {
			routeType: "SWAP",
			fromToken: req.fromToken,
			toToken: req.toToken,
			amountIn: req.amountIn,
			expectedAmountOut: expectedAmountOut.toFixed(6),
			minAmountOut: minAmountOut.toFixed(6),
			priceImpactPct: 0,
			estimatedGasUsd: Number(routeSummary?.gasUsd) || 0,
			providerVenue: "KyberSwap Aggregator",
		};
	}
}

export const defaultRwaClient = new BinanceRwaClient();
