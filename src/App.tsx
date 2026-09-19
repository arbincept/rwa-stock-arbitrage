import React, { useState, useEffect } from "react";
import type { StockPriceData } from "./types/rwa.ts";
import { defaultRwaClient } from "./client/binance-rwa-client.ts";
import { scanMarketHoursOpportunities } from "./engine/market-hours-arb.ts";
import { scanCrossProtocolOpportunities } from "./engine/cross-protocol-arb.ts";
import { MarketStatusBadge } from "./components/MarketStatusBadge.tsx";
import { ArbitrageCard } from "./components/ArbitrageCard.tsx";
import { StockTable } from "./components/StockTable.tsx";
import { SwapWidget } from "./components/SwapWidget.tsx";
import { Layers, Activity, Shield, Terminal, ArrowUpRight, Cpu } from "lucide-react";

export function App() {
	const [stocks, setStocks] = useState<StockPriceData[]>([]);
	const [selectedSymbol, setSelectedSymbol] = useState<string>("NVDAon");
	const [loading, setLoading] = useState<boolean>(true);

	const loadData = async () => {
		try {
			const data = await defaultRwaClient.getStockPrices();
			setStocks(data);
		} catch (e) {
			console.error("Error loading stock prices:", e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
		const interval = setInterval(loadData, 10000); // 10s auto-refresh
		return () => clearInterval(interval);
	}, []);

	const marketStatus = defaultRwaClient.getMarketStatus();
	const marketHoursOpps = scanMarketHoursOpportunities(stocks);
	const crossProtocolOpps = scanCrossProtocolOpportunities(stocks);

	const totalLiquidityUsd = stocks.reduce((acc, curr) => acc + curr.liquidityDepthUsd, 0);

	return (
		<div style={{ minHeight: "100vh", backgroundColor: "#08090d", color: "#f8fafc", padding: "24px 32px" }}>
			{/* Top Header */}
			<header style={{
				display: "flex",
				flexWrap: "wrap",
				justifyContent: "space-between",
				alignItems: "center",
				gap: "16px",
				paddingBottom: "24px",
				borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
				marginBottom: "28px",
			}}>
				<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
					<div style={{
						width: "40px",
						height: "40px",
						borderRadius: "10px",
						background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
					}}>
						<Activity size={22} color="#ffffff" />
					</div>
					<div>
						<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
							<h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px" }}>
								Arbitrage Inception <span style={{ color: "#8b5cf6", fontWeight: 400 }}>| RWA Suite</span>
							</h1>
							<span style={{
								fontSize: "11px",
								padding: "2px 8px",
								borderRadius: "6px",
								background: "rgba(234, 179, 8, 0.15)",
								color: "#facc15",
								border: "1px solid rgba(234, 179, 8, 0.3)",
								fontWeight: 700,
							}}>
								BNB Hack 2026
							</span>
						</div>
						<p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
							Real-Time Market-Hours & Cross-Protocol Arbitrage Engine on BNB Smart Chain
						</p>
					</div>
				</div>

				<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
					<MarketStatusBadge status={marketStatus.status} nextOpen={marketStatus.nextOpen} />
					<div style={{
						display: "flex",
						alignItems: "center",
						gap: "6px",
						padding: "8px 14px",
						borderRadius: "9999px",
						background: "rgba(255, 255, 255, 0.05)",
						border: "1px solid rgba(255, 255, 255, 0.1)",
						fontSize: "12px",
						fontWeight: 600,
						color: "#cbd5e1",
					}}>
						<span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#eab308" }} />
						BSC Mainnet (Chain ID: 56)
					</div>
				</div>
			</header>

			{/* Metric Counters Banner */}
			<div style={{
				display: "grid",
				gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
				gap: "16px",
				marginBottom: "28px",
			}}>
				<div style={{ background: "#0d1117", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "12px", padding: "16px" }}>
					<div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
						<Layers size={14} color="#8b5cf6" /> Monitored RWA Equities
					</div>
					<div style={{ fontSize: "22px", fontWeight: 800 }}>{stocks.length} Verified Tokens</div>
					<div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Ondo, bStocks, xStocks</div>
				</div>

				<div style={{ background: "#0d1117", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "12px", padding: "16px" }}>
					<div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
						<Activity size={14} color="#34d399" /> Weekend Gap Opportunities
					</div>
					<div style={{ fontSize: "22px", fontWeight: 800, color: "#34d399" }}>
						{marketHoursOpps.filter((o) => o.isActionable).length} Active Spreads
					</div>
					<div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Top: +{marketHoursOpps[0]?.netProfitPct.toFixed(2)}% net edge</div>
				</div>

				<div style={{ background: "#0d1117", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "12px", padding: "16px" }}>
					<div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
						<Cpu size={14} color="#60a5fa" /> Cross-Protocol Spreads
					</div>
					<div style={{ fontSize: "22px", fontWeight: 800, color: "#60a5fa" }}>
						{crossProtocolOpps.length} Dual-Listed Pairs
					</div>
					<div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Ondo vs bStocks vs xStock</div>
				</div>

				<div style={{ background: "#0d1117", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "12px", padding: "16px" }}>
					<div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
						<Shield size={14} color="#facc15" /> Total Aggregate Depth
					</div>
					<div style={{ fontSize: "22px", fontWeight: 800 }}>${(totalLiquidityUsd / 1000000).toFixed(2)}M USD</div>
					<div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>PancakeSwap V3 & RFQ Pools</div>
				</div>
			</div>

			{/* Highlight Opportunities */}
			<ArbitrageCard
				marketHoursOpps={marketHoursOpps}
				crossProtocolOpps={crossProtocolOpps}
				onSelectStock={(sym) => setSelectedSymbol(sym)}
			/>

			{/* Main Grid: Stock Table (Left) + Swap Widget (Right) */}
			<div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px" }}>
				<div>
					<StockTable
						stocks={stocks}
						onSelectStock={(sym) => setSelectedSymbol(sym)}
						selectedSymbol={selectedSymbol}
					/>
				</div>

				<div>
					<SwapWidget
						stocks={stocks}
						selectedSymbol={selectedSymbol}
						onSelectStock={(sym) => setSelectedSymbol(sym)}
					/>
				</div>
			</div>

			{/* Footer / Architecture Bar */}
			<footer style={{
				marginTop: "48px",
				paddingTop: "24px",
				borderTop: "1px solid rgba(255, 255, 255, 0.08)",
				display: "flex",
				flexWrap: "wrap",
				justifyContent: "space-between",
				alignItems: "center",
				fontSize: "12px",
				color: "#64748b",
			}}>
				<div>
					Built for <strong style={{ color: "#cbd5e1" }}>BNB Hack: Tokenized Stocks Edition</strong> by{" "}
					<a href="https://github.com/arbincept" target="_blank" rel="noreferrer" style={{ color: "#8b5cf6", textDecoration: "none" }}>
						Arbitrage Inception
					</a>
				</div>
				<div style={{ display: "flex", gap: "16px" }}>
					<span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
						<Terminal size={14} /> Agentic Wallet Skill: <code>scripts/agent/wallet-skill.ts</code>
					</span>
					<span>•</span>
					<span>Binance Web3 RWA & Trading APIs</span>
				</div>
			</footer>
		</div>
	);
}
