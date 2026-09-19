import React, { useState, useEffect } from "react";
import type { StockPriceData } from "./types/rwa.ts";
import { defaultRwaClient } from "./client/binance-rwa-client.ts";
import { scanMarketHoursOpportunities } from "./engine/market-hours-arb.ts";
import { scanCrossProtocolOpportunities } from "./engine/cross-protocol-arb.ts";
import { MarketStatusBadge } from "./components/MarketStatusBadge.tsx";
import { ArbitrageCard } from "./components/ArbitrageCard.tsx";
import { StockTable } from "./components/StockTable.tsx";
import { SwapWidget } from "./components/SwapWidget.tsx";
import { Layers, Activity, Shield, Terminal, Cpu } from "lucide-react";

// Responsive breakpoint hook
function useIsMobile() {
	const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
	useEffect(() => {
		const handler = () => setIsMobile(window.innerWidth < 768);
		window.addEventListener("resize", handler, { passive: true });
		return () => window.removeEventListener("resize", handler);
	}, []);
	return isMobile;
}

export function App() {
	const [stocks, setStocks] = useState<StockPriceData[]>([]);
	const [selectedSymbol, setSelectedSymbol] = useState<string>("NVDAON");
	const [loading, setLoading] = useState<boolean>(true);
	const isMobile = useIsMobile();

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
		<div style={{ minHeight: "100vh", backgroundColor: "#08090d", color: "#f8fafc", padding: isMobile ? "16px" : "24px 32px" }}>
			{/* Top Header */}
			<header style={{
				display: "flex",
				flexWrap: "wrap",
				justifyContent: "space-between",
				alignItems: isMobile ? "flex-start" : "center",
				gap: "12px",
				paddingBottom: "20px",
				borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
				marginBottom: isMobile ? "20px" : "28px",
			}}>
				<div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
					<div style={{
						width: "38px",
						height: "38px",
						flexShrink: 0,
						borderRadius: "10px",
						background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
					}}>
						<Activity size={20} color="#ffffff" />
					</div>
					<div style={{ minWidth: 0 }}>
						<div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
							<h1 style={{ margin: 0, fontSize: isMobile ? "16px" : "20px", fontWeight: 800, letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>
								Arbitrage Inception <span style={{ color: "#8b5cf6", fontWeight: 400 }}>| RWA Suite</span>
							</h1>
							<span style={{
								fontSize: "10px",
								padding: "2px 7px",
								borderRadius: "6px",
								background: "rgba(234, 179, 8, 0.15)",
								color: "#facc15",
								border: "1px solid rgba(234, 179, 8, 0.3)",
								fontWeight: 700,
								whiteSpace: "nowrap",
							}}>
								BNB Hack 2026
							</span>
						</div>
						{!isMobile && (
							<p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
								Real-Time Market-Hours &amp; Cross-Protocol Arbitrage Engine on BNB Smart Chain
							</p>
						)}
					</div>
				</div>

				<div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
					<MarketStatusBadge status={marketStatus.status} nextOpen={marketStatus.nextOpen} />
					{!isMobile && (
						<div style={{
							display: "flex",
							alignItems: "center",
							gap: "6px",
							padding: "6px 12px",
							borderRadius: "9999px",
							background: "rgba(255, 255, 255, 0.05)",
							border: "1px solid rgba(255, 255, 255, 0.1)",
							fontSize: "11px",
							fontWeight: 600,
							color: "#cbd5e1",
						}}>
							<span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#eab308", flexShrink: 0 }} />
							BSC Mainnet (Chain ID: 56)
						</div>
					)}
				</div>
			</header>

			{/* Loading indicator */}
			{loading && (
				<div style={{ textAlign: "center", padding: "16px", color: "#94a3b8", fontSize: "13px", marginBottom: "16px" }}>
					⟳ Fetching live TradFi & BSC market data...
				</div>
			)}

			{/* Metric Counters Banner */}
			<div style={{
				display: "grid",
				gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
				gap: "12px",
				marginBottom: isMobile ? "20px" : "28px",
			}}>
				<div style={{ background: "#0d1117", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "12px", padding: isMobile ? "12px" : "16px" }}>
					<div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
						<Layers size={13} color="#8b5cf6" /> RWA Equities
					</div>
					<div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800 }}>{stocks.length} Tokens</div>
					<div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>Ondo, bStocks, xStocks</div>
				</div>

				<div style={{ background: "#0d1117", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "12px", padding: isMobile ? "12px" : "16px" }}>
					<div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
						<Activity size={13} color="#34d399" /> Weekend Gaps
					</div>
					<div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: "#34d399" }}>
						{marketHoursOpps.filter((o) => o.isActionable).length} Spreads
					</div>
					<div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>
						Top: +{marketHoursOpps[0]?.netProfitPct.toFixed(2) ?? "0.00"}% edge
					</div>
				</div>

				<div style={{ background: "#0d1117", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "12px", padding: isMobile ? "12px" : "16px" }}>
					<div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
						<Cpu size={13} color="#60a5fa" /> Cross-Protocol
					</div>
					<div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: "#60a5fa" }}>
						{crossProtocolOpps.length} Pairs
					</div>
					<div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>Ondo vs bStocks vs xStock</div>
				</div>

				<div style={{ background: "#0d1117", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "12px", padding: isMobile ? "12px" : "16px" }}>
					<div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
						<Shield size={13} color="#facc15" /> Aggregate Depth
					</div>
					<div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800 }}>${(totalLiquidityUsd / 1000000).toFixed(2)}M</div>
					<div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>PancakeSwap V3 &amp; RFQ</div>
				</div>
			</div>

			{/* Highlight Opportunities */}
			<ArbitrageCard
				marketHoursOpps={marketHoursOpps}
				crossProtocolOpps={crossProtocolOpps}
				onSelectStock={(sym) => setSelectedSymbol(sym)}
			/>

			{/* Main Grid: Stock Table (Left) + Swap Widget (Right) */}
			<div style={{
				display: "grid",
				gridTemplateColumns: isMobile ? "1fr" : "1fr 380px",
				gap: "20px",
			}}>
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

			{/* Footer */}
			<footer style={{
				marginTop: "40px",
				paddingTop: "20px",
				borderTop: "1px solid rgba(255, 255, 255, 0.08)",
				display: "flex",
				flexWrap: "wrap",
				justifyContent: "space-between",
				alignItems: "center",
				gap: "8px",
				fontSize: "11px",
				color: "#64748b",
			}}>
				<div>
					Built for <strong style={{ color: "#cbd5e1" }}>BNB Hack: Tokenized Stocks Edition</strong> by{" "}
					<a href="https://github.com/arbincept" target="_blank" rel="noreferrer" style={{ color: "#8b5cf6", textDecoration: "none" }}>
						Arbitrage Inception
					</a>
				</div>
				<div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
					<span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
						<Terminal size={12} /> Agentic Wallet Skill
					</span>
					<span>•</span>
					<span>Binance Web3 RWA APIs</span>
					<span>•</span>
					<span>17/17 Tests ✓</span>
				</div>
			</footer>
		</div>
	);
}
