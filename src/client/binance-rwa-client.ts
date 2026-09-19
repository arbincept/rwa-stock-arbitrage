import crypto from "crypto";
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
	private apiKey?: string;
	private secretKey?: string;
	private baseUrl: string;

	constructor(apiKey?: string, secretKey?: string, baseUrl = "https://api.binance.com") {
		this.apiKey = apiKey || (typeof process !== "undefined" ? process.env?.BINANCE_WEB3_API_KEY : undefined);
		this.secretKey = secretKey || (typeof process !== "undefined" ? process.env?.BINANCE_WEB3_SECRET_KEY : undefined);
		this.baseUrl = baseUrl;
	}

	private getAuthHeaders(method: string, path: string, body: string = ""): Record<string, string> {
		if (!this.apiKey || !this.secretKey) return {};
		const timestamp = new Date().toISOString();
		const message = `${timestamp}${method.toUpperCase()}${path}${body}`;
		const signature = crypto.createHmac("sha256", this.secretKey).update(message).digest("base64");
		
		return {
			"Content-Type": "application/json",
			"X-OC-APIKEY": this.apiKey,
			"X-OC-TIMESTAMP": timestamp,
			"X-OC-SIGN": signature,
		};
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

		// [INTEGRAZIONE HACKATHON]: Fetch autenticato Reference Price da Binance Web3 API
		const authenticatedRwaPrices: Record<string, number> = {};
		if (this.apiKey && this.secretKey) {
			await Promise.allSettled(
				VERIFIED_BSC_STOCKS.map(async (stock) => {
					// Assumiamo path standard RWA data, da calibrare se i doc dell'hackathon ne indicano uno specifico
					const path = `/api/v1/market/rwa/price?symbol=${stock.symbol}`;
					try {
						const res = await fetch(`${this.baseUrl}${path}`, {
							method: "GET",
							headers: this.getAuthHeaders("GET", path)
						});
						if (res.ok) {
							const json = await res.json();
							if (json.price) authenticatedRwaPrices[stock.symbol] = Number(json.price);
						}
					} catch (e) {
						// Silenzia l'errore di rete per permettere il fallback
					}
				})
			);
		} else {
			console.warn("[Binance Web3] API Key o Secret assenti. Verrà utilizzato il TradFi fallback.");
		}

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
			
			// Il reference price è ora prioritizzato sulla Web3 API ufficiale
			const tradFiPrice = authenticatedRwaPrices[stock.symbol] ?? fallbackRef.refPrice;

			const realTickerPrice = apiPrices[stock.symbol];
			
			// [TODO STEP 3]: Questo fallback fittizio verrà sostituito dal feed live di Birdeye
			const onChainPrice = realTickerPrice ?? tradFiPrice;

			const spreadUsd = parseFloat((onChainPrice - tradFiPrice).toFixed(2));
			const spreadPct = parseFloat(((spreadUsd / tradFiPrice) * 100).toFixed(2));
			const baseLiquidity = stock.platform === "Ondo" ? 480000 : stock.platform === "BStock" ? 320000 : 190000;

			return {
				stock,
				onChainPriceUsd: onChainPrice,
				tradFiRefPriceUsd: tradFiPrice,
				spreadPct,
				spreadUsd,
				volume24hUsd: Math.round(onChainPrice * 320),
				liquidityDepthUsd: baseLiquidity,
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

		const stock = VERIFIED_BSC_STOCKS.find(
			(s) => s.address.toLowerCase() === req.toToken.toLowerCase() || s.address.toLowerCase() === req.fromToken.toLowerCase(),
		);

		const isBuyingStock = stock && req.toToken.toLowerCase() === stock.address.toLowerCase();
		const stockPrice = (stock && _STATIC_BENCHMARKS[stock.underlyingTicker]?.refPrice) || 100;
		const slippage = req.slippagePct ?? 0.5;

		let expectedOutNum = 0;
		if (isBuyingStock) {
			expectedOutNum = parsedAmountIn / stockPrice;
		} else {
			expectedOutNum = parsedAmountIn * stockPrice;
		}

		const minOutNum = expectedOutNum * (1 - slippage / 100);
		const priceImpact = Math.min(0.08, (parsedAmountIn / 50000) * 100);

		const routeType = stock?.platform === "xStock" ? "SWAP" : "RFQ";
		const venue = stock?.platform === "Ondo" 
			? "PcsXRfq (Ondo 3-Vendor RFQ)" 
			: stock?.platform === "BStock" 
			? "LiquidMesh & PcsXRfq" 
			: "PancakeSwap V3 AMM";

		return {
			routeType,
			fromToken: req.fromToken,
			toToken: req.toToken,
			amountIn: req.amountIn,
			expectedAmountOut: expectedOutNum.toFixed(6),
			minAmountOut: minOutNum.toFixed(6),
			priceImpactPct: parseFloat(priceImpact.toFixed(2)),
			estimatedGasUsd: 0.12,
			providerVenue: venue,
			toRouterAddress: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
		};
	}
}

export const defaultRwaClient = new BinanceRwaClient();
