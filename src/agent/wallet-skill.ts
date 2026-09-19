import "dotenv/config";
import { BinanceRwaClient } from "../client/binance-rwa-client.ts";
import { scanMarketHoursOpportunities } from "../engine/market-hours-arb.ts";
import { scanCrossProtocolOpportunities } from "../engine/cross-protocol-arb.ts";
import { simulateRwaSwap } from "../engine/simulator.ts";

/**
 * Binance Wallet Skill: RwaStockArbitrageSkill
 * Compliant with @binance/wallet-skills & Agentic Wallet specifications.
 * Allows autonomous agents to detect weekend spread opportunities and dry-run rebalancing.
 */
export class RwaStockArbitrageSkill {
	public name = "rwa_stock_arbitrage";
	public description = "Scans tokenized equities on BSC for market-hours and cross-protocol arbitrage spreads against TradFi benchmarks.";
	private client: BinanceRwaClient;

	constructor(apiKey?: string) {
		this.client = new BinanceRwaClient(apiKey);
	}

	public getTools() {
		return [
			{
				name: "scan_market_hours_gaps",
				description: "Scans all tokenized stocks on BSC for weekend/after-hours spread deviations vs TradFi close prices.",
				parameters: {
					type: "object",
					properties: {
						minNetProfitPct: { type: "number", description: "Minimum net edge required (default 0.35%)" },
						tradeSizeUsd: { type: "number", description: "Simulated trade volume in USD (default 1000)" },
					},
				},
			},
			{
				name: "scan_cross_protocol_gaps",
				description: "Scans for price disparities between different protocols (e.g. Ondo vs bStocks) for the same underlying asset.",
				parameters: {
					type: "object",
					properties: {
						minNetProfitPct: { type: "number", description: "Minimum net edge required (default 0.40%)" },
					},
				},
			},
			{
				name: "simulate_stock_swap",
				description: "Simulates an on-chain spot swap for a tokenized stock on BSC without committing real funds.",
				parameters: {
					type: "object",
					required: ["symbol", "amountInUsd"],
					properties: {
						symbol: { type: "string", description: "Stock symbol (e.g. NVDAon, TSLAB)" },
						amountInUsd: { type: "number", description: "Input amount in USD" },
					},
				},
			},
		];
	}

	public async scanMarketHoursGaps(minNetProfitPct = 0.35, tradeSizeUsd = 1000) {
		const stockPrices = await this.client.getStockPrices();
		const opps = scanMarketHoursOpportunities(stockPrices, { minNetProfitPct, tradeSizeUsd });
		const marketStatus = this.client.getMarketStatus();

		return {
			marketStatus,
			totalScanned: stockPrices.length,
			actionableCount: opps.filter((o) => o.isActionable).length,
			opportunities: opps,
		};
	}

	public async scanCrossProtocolGaps(minNetProfitPct = 0.40) {
		const stockPrices = await this.client.getStockPrices();
		const opps = scanCrossProtocolOpportunities(stockPrices, { minNetProfitPct });

		return {
			totalScanned: stockPrices.length,
			actionableCount: opps.filter((o) => o.isActionable).length,
			opportunities: opps,
		};
	}

	public async simulateStockSwap(symbol: string, amountInUsd: number) {
		const stockPrices = await this.client.getStockPrices();
		const target = stockPrices.find((s) => s.stock.symbol.toUpperCase() === symbol.toUpperCase());

		if (!target) {
			throw new Error(`Stock symbol "${symbol}" not found in verified BSC catalog.`);
		}

		const quote = await this.client.getSwapQuote({
			fromToken: "0x55d398326f99059fF775485246999027B3197955", // USDT on BSC
			toToken: target.stock.address,
			amountIn: amountInUsd.toString(),
			slippagePct: 0.5,
		});

		const simulation = await simulateRwaSwap(quote);
		return { quote, simulation };
	}
}

// Autonomous CLI Demonstration Runner
if (import.meta.url === `file://${process.argv[1]}`) {
	(async () => {
		console.log("🤖 [Binance Agentic Wallet Skill] Initializing RWA Stock Arbitrage Skill...\n");
		const skill = new RwaStockArbitrageSkill();

		console.log("📊 1. Scanning market-hours arbitrage (weekend/TradFi gap)...");
		const marketHours = await skill.scanMarketHoursGaps(0.20, 1000);
		console.log(`   Market status: ${marketHours.marketStatus.status} (next open: ${marketHours.marketStatus.nextOpen})`);
		console.log(`   Found ${marketHours.opportunities.length} opportunities (${marketHours.actionableCount} actionable):`);
		for (const opp of marketHours.opportunities.slice(0, 3)) {
			console.log(`   • ${opp.stock.symbol}: Spread ${opp.grossSpreadPct}% | Net Edge +${opp.netProfitPct}% [${opp.direction}]`);
		}

		console.log("\n⚡ 2. Scanning cross-protocol arbitrage (Ondo vs bStocks)...");
		const cross = await skill.scanCrossProtocolGaps(0.20);
		console.log(`   Found ${cross.opportunities.length} cross-protocol pairs:`);
		for (const c of cross.opportunities) {
			console.log(`   • ${c.underlyingTicker}: ${c.strategy}`);
		}

		console.log("\n🧪 3. Building a live Kyber quote...");
		const sim = await skill.simulateStockSwap("NVDAON", 500);
		console.log(`   Result: ${sim.simulation.simulationTrace}`);
		console.log("\n✅ [Binance Agentic Wallet Skill] Live execution-path check passed with 0 errors.");
	})();
}
