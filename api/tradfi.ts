import { FALLBACK_TRADFI_BENCHMARKS } from "../src/client/live-market-feed.ts";

export default async function handler(req: any, res: any) {
	// Set permissive CORS headers for Vercel deployment
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=30");

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	const tickers = Object.keys(FALLBACK_TRADFI_BENCHMARKS);
	const results: Record<string, { refPrice: number; prevClose: number; source: string }> = {};

	const promises = tickers.map(async (t) => {
		try {
			const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=1d`, {
				headers: { "User-Agent": "Mozilla/5.0" },
				signal: AbortSignal.timeout(3000),
			});
			if (response.ok) {
				const json = (await response.json()) as any;
				const meta = json?.chart?.result?.[0]?.meta;
				if (meta?.regularMarketPrice) {
					results[t] = {
						refPrice: meta.regularMarketPrice,
						prevClose: meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice,
						source: "Live Yahoo Finance",
					};
				}
			}
		} catch {
			// Fallback handled below
		}
	});

	await Promise.allSettled(promises);

	// Fallback for any ticker that failed
	for (const t of tickers) {
		if (!results[t]) {
			results[t] = {
				refPrice: FALLBACK_TRADFI_BENCHMARKS[t].refPrice,
				prevClose: FALLBACK_TRADFI_BENCHMARKS[t].prevClose,
				source: "Calibrated Benchmark",
			};
		}
	}

	return res.status(200).json(results);
}
