import React from "react";
import type { CrossProtocolArbitrageOpportunity, MarketHoursArbitrageOpportunity } from "../types/rwa.ts";
import { TrendingUp, ArrowRightLeft, ShieldCheck, Zap } from "lucide-react";

interface Props {
	marketHoursOpps: MarketHoursArbitrageOpportunity[];
	crossProtocolOpps: CrossProtocolArbitrageOpportunity[];
	onSelectStock: (symbol: string) => void;
}

export const ArbitrageCard: React.FC<Props> = ({
	marketHoursOpps,
	crossProtocolOpps,
	onSelectStock,
}) => {
	const topMarket = marketHoursOpps[0];
	const topCross = crossProtocolOpps[0];

	return (
		<div style={{
			display: "grid",
			gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))",
			gap: "20px",
			marginBottom: "28px",
			minWidth: 0,
		}}>
			{/* Market-Hours Arbitrage Box */}
			<div style={{
				minWidth: 0,
				background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 27, 75, 0.5) 100%)",
				border: "1px solid rgba(139, 92, 246, 0.3)",
				borderRadius: "16px",
				padding: "20px",
				boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
			}}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
					<span style={{
						display: "flex",
						alignItems: "center",
						gap: "6px",
						color: "#a78bfa",
						fontSize: "12px",
						fontWeight: 700,
						textTransform: "uppercase",
						letterSpacing: "0.5px",
					}}>
						<TrendingUp size={16} /> Vector 1: Market-Hours Arbitrage
					</span>
					<span style={{
						padding: "3px 8px",
						borderRadius: "6px",
						background: "rgba(139, 92, 246, 0.2)",
						color: "#c4b5fd",
						fontSize: "11px",
						fontWeight: 600,
					}}>
						Weekend Gap
					</span>
				</div>

				{topMarket ? (
					<div>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
							<h3 style={{ margin: 0, fontSize: "20px", color: "#ffffff", fontWeight: 700 }}>
								{topMarket.stock.symbol} ({topMarket.stock.underlyingTicker})
							</h3>
							<div style={{ textAlign: "right" }}>
								<span style={{
									fontSize: "18px",
									fontWeight: 800,
									color: topMarket.grossSpreadPct >= 0 ? "#4ade80" : "#60a5fa",
								}}>
									{topMarket.grossSpreadPct >= 0 ? `+${topMarket.grossSpreadPct}%` : `${topMarket.grossSpreadPct}%`}
								</span>
								<div style={{ fontSize: "11px", color: "#94a3b8" }}>Gross Spread</div>
							</div>
						</div>

						<p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#cbd5e1", lineHeight: "1.5" }}>
							{topMarket.rationale}
						</p>

						<div style={{
							display: "flex",
							justifyContent: "space-between",
							background: "rgba(0, 0, 0, 0.3)",
							padding: "10px 14px",
							borderRadius: "10px",
							fontSize: "12px",
							marginBottom: "14px",
						}}>
							<div>
								<div style={{ color: "#94a3b8" }}>Net Profit Edge</div>
								<div style={{ color: "#34d399", fontWeight: 700, fontSize: "14px" }}>
									+{topMarket.netProfitPct.toFixed(2)}%
								</div>
							</div>
							<div>
								<div style={{ color: "#94a3b8" }}>BSC Gas Friction</div>
								<div style={{ color: "#e2e8f0", fontWeight: 600 }}>${topMarket.estimatedGasCostUsd.toFixed(2)}</div>
							</div>
							<div>
								<div style={{ color: "#94a3b8" }}>TradFi Benchmark</div>
								<div style={{ color: "#e2e8f0", fontWeight: 600 }}>${topMarket.tradFiRefPriceUsd.toFixed(2)}</div>
							</div>
						</div>

						<button
							onClick={() => onSelectStock(topMarket.stock.symbol)}
							style={{
								width: "100%",
								padding: "10px",
								borderRadius: "10px",
								background: "linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%)",
								border: "none",
								color: "#ffffff",
								fontWeight: 600,
								cursor: "pointer",
								fontSize: "13px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "6px",
							}}
						>
							<Zap size={16} /> Route {topMarket.stock.symbol} Swap
						</button>
					</div>
				) : (
					<p style={{ color: "#94a3b8" }}>Scanning for weekend price drift...</p>
				)}
			</div>

			{/* Cross-Protocol Arbitrage Box */}
			<div style={{
				minWidth: 0,
				background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(6, 78, 59, 0.4) 100%)",
				border: "1px solid rgba(16, 185, 129, 0.3)",
				borderRadius: "16px",
				padding: "20px",
				boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
			}}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
					<span style={{
						display: "flex",
						alignItems: "center",
						gap: "6px",
						color: "#34d399",
						fontSize: "12px",
						fontWeight: 700,
						textTransform: "uppercase",
						letterSpacing: "0.5px",
					}}>
						<ArrowRightLeft size={16} /> Vector 2: Cross-Protocol Arbitrage
					</span>
					<span style={{
						padding: "3px 8px",
						borderRadius: "6px",
						background: "rgba(16, 185, 129, 0.2)",
						color: "#6ee7b7",
						fontSize: "11px",
						fontWeight: 600,
					}}>
						Ondo vs bStocks
					</span>
				</div>

				{topCross ? (
					<div>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
							<h3 style={{ margin: 0, fontSize: "20px", color: "#ffffff", fontWeight: 700 }}>
								{topCross.underlyingTicker} Dual-Listing Spread
							</h3>
							<div style={{ textAlign: "right" }}>
								<span style={{ fontSize: "18px", fontWeight: 800, color: "#34d399" }}>
									+{topCross.spreadPct.toFixed(2)}%
								</span>
								<div style={{ fontSize: "11px", color: "#94a3b8" }}>Venue Disparity</div>
							</div>
						</div>

						<p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#cbd5e1", lineHeight: "1.5" }}>
							{topCross.strategy}
						</p>

						<div style={{
							display: "flex",
							justifyContent: "space-between",
							background: "rgba(0, 0, 0, 0.3)",
							padding: "10px 14px",
							borderRadius: "10px",
							fontSize: "12px",
							marginBottom: "14px",
						}}>
							<div>
								<div style={{ color: "#94a3b8" }}>Cheaper Buy Venue</div>
								<div style={{ color: "#60a5fa", fontWeight: 700 }}>{topCross.cheaperVenue} (${topCross.primaryPriceUsd.toFixed(2)})</div>
							</div>
							<div>
								<div style={{ color: "#94a3b8" }}>Higher Sell Venue</div>
								<div style={{ color: "#f43f5e", fontWeight: 700 }}>{topCross.expensiveVenue} (${topCross.secondaryPriceUsd.toFixed(2)})</div>
							</div>
							<div>
								<div style={{ color: "#94a3b8" }}>Net Profit Edge</div>
								<div style={{ color: "#34d399", fontWeight: 700, fontSize: "14px" }}>+{topCross.netProfitPct.toFixed(2)}%</div>
							</div>
						</div>

						<button
							onClick={() => onSelectStock(topCross.primaryStock.symbol)}
							style={{
								width: "100%",
								padding: "10px",
								borderRadius: "10px",
								background: "linear-gradient(90deg, #059669 0%, #0d9488 100%)",
								border: "none",
								color: "#ffffff",
								fontWeight: 600,
								cursor: "pointer",
								fontSize: "13px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "6px",
							}}
						>
							<ShieldCheck size={16} /> Execute Cross-Venue Arbitrage
						</button>
					</div>
				) : (
					<p style={{ color: "#94a3b8" }}>Scanning cross-protocol pairs...</p>
				)}
			</div>
		</div>
	);
};
