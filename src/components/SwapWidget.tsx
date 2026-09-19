import React, { useState, useEffect } from "react";
import type { RwaSwapQuoteResponse, SimulationResult, StockPriceData } from "../types/rwa.ts";
import { defaultRwaClient } from "../client/binance-rwa-client.ts";
import { simulateRwaSwap } from "../engine/simulator.ts";
import { ArrowDown, CheckCircle2, ShieldCheck, Zap, RefreshCw } from "lucide-react";

interface Props {
	stocks: StockPriceData[];
	selectedSymbol: string;
	onSelectStock: (symbol: string) => void;
}

export const SwapWidget: React.FC<Props> = ({
	stocks,
	selectedSymbol,
	onSelectStock,
}) => {
	const [amountIn, setAmountIn] = useState<string>("500");
	const [slippage, setSlippage] = useState<number>(0.5);
	const [quote, setQuote] = useState<RwaSwapQuoteResponse | null>(null);
	const [simulation, setSimulation] = useState<SimulationResult | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	const selectedStock = stocks.find((s) => s.stock.symbol === selectedSymbol) || stocks[0];

	const fetchQuote = async () => {
		if (!selectedStock || !amountIn || parseFloat(amountIn) <= 0) return;
		setLoading(true);
		try {
			const q = await defaultRwaClient.getSwapQuote({
				fromToken: "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
				toToken: selectedStock.stock.address,
				amountIn,
				slippagePct: slippage,
			});
			setQuote(q);
			const sim = await simulateRwaSwap(q);
			setSimulation(sim);
		} catch (e) {
			console.error("Quote error:", e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchQuote();
	}, [selectedSymbol, amountIn, slippage]);

	return (
		<div style={{
			background: "#0d1117",
			border: "1px solid rgba(255, 255, 255, 0.08)",
			borderRadius: "16px",
			padding: "24px",
		}}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
				<h3 style={{ margin: 0, fontSize: "17px", color: "#ffffff", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
					<Zap size={18} color="#8b5cf6" /> Spot Swap & Simulation Engine
				</h3>
				<span style={{
					fontSize: "11px",
					padding: "3px 8px",
					borderRadius: "6px",
					background: quote?.routeType === "RFQ" ? "rgba(59, 130, 246, 0.2)" : "rgba(34, 197, 94, 0.2)",
					color: quote?.routeType === "RFQ" ? "#60a5fa" : "#4ade80",
					fontWeight: 600,
				}}>
					Mode: {quote?.routeType || "RFQ"}
				</span>
			</div>

			{/* Pay Section */}
			<div style={{
				background: "rgba(255, 255, 255, 0.03)",
				border: "1px solid rgba(255, 255, 255, 0.06)",
				borderRadius: "12px",
				padding: "14px",
				marginBottom: "10px",
			}}>
				<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", color: "#94a3b8" }}>
					<span>You Pay (BSC Mainnet)</span>
					<span>Balance: 2,500.00 USDT</span>
				</div>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<input
						type="number"
						value={amountIn}
						onChange={(e) => setAmountIn(e.target.value)}
						style={{
							background: "transparent",
							border: "none",
							color: "#ffffff",
							fontSize: "24px",
							fontWeight: 700,
							outline: "none",
							width: "60%",
						}}
					/>
					<div style={{
						display: "flex",
						alignItems: "center",
						gap: "6px",
						padding: "6px 12px",
						borderRadius: "8px",
						background: "rgba(255, 255, 255, 0.08)",
						fontWeight: 600,
						fontSize: "14px",
					}}>
						<span style={{ color: "#22c55e" }}>$</span> USDT
					</div>
				</div>
			</div>

			{/* Arrow Divider */}
			<div style={{ display: "flex", justifyContent: "center", margin: "-6px 0" }}>
				<div style={{
					background: "#1e293b",
					border: "1px solid rgba(255, 255, 255, 0.1)",
					borderRadius: "50%",
					width: "28px",
					height: "28px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "#a78bfa",
				}}>
					<ArrowDown size={14} />
				</div>
			</div>

			{/* Receive Section */}
			<div style={{
				background: "rgba(255, 255, 255, 0.03)",
				border: "1px solid rgba(255, 255, 255, 0.06)",
				borderRadius: "12px",
				padding: "14px",
				marginBottom: "16px",
			}}>
				<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", color: "#94a3b8" }}>
					<span>You Receive (Estimated)</span>
					<span>Target: {selectedStock?.stock.underlyingTicker}</span>
				</div>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<div style={{ fontSize: "24px", fontWeight: 700, color: "#ffffff" }}>
						{loading ? "Calculating..." : quote?.expectedAmountOut || "0.00"}
					</div>
					<select
						value={selectedStock?.stock.symbol}
						onChange={(e) => onSelectStock(e.target.value)}
						style={{
							padding: "6px 10px",
							borderRadius: "8px",
							background: "rgba(139, 92, 246, 0.2)",
							border: "1px solid #8b5cf6",
							color: "#ffffff",
							fontWeight: 600,
							fontSize: "13px",
							outline: "none",
							cursor: "pointer",
						}}
					>
						{stocks.map((s) => (
							<option key={s.stock.symbol} value={s.stock.symbol} style={{ background: "#0d1117" }}>
								{s.stock.symbol} ({s.stock.platform})
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Slippage & Routing Info */}
			<div style={{
				background: "rgba(0, 0, 0, 0.25)",
				borderRadius: "10px",
				padding: "12px",
				fontSize: "12px",
				marginBottom: "16px",
			}}>
				<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#94a3b8" }}>
					<span>Execution Venue:</span>
					<span style={{ color: "#e2e8f0", fontWeight: 600 }}>{quote?.providerVenue || "PcsXRfq"}</span>
				</div>
				<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#94a3b8" }}>
					<span>Guaranteed Minimum:</span>
					<span style={{ color: "#34d399", fontWeight: 600 }}>{quote?.minAmountOut || "0.00"} {selectedStock?.stock.symbol}</span>
				</div>
				<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#94a3b8" }}>
					<span>Estimated BSC Gas:</span>
					<span style={{ color: "#cbd5e1" }}>${quote?.estimatedGasUsd.toFixed(2)} USD</span>
				</div>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<span style={{ color: "#94a3b8" }}>Slippage Tolerance:</span>
					<div style={{ display: "flex", gap: "4px" }}>
						{[0.1, 0.5, 1.0].map((s) => (
							<button
								key={s}
								onClick={() => setSlippage(s)}
								style={{
									padding: "2px 6px",
									borderRadius: "4px",
									border: slippage === s ? "1px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.1)",
									background: slippage === s ? "rgba(139, 92, 246, 0.3)" : "transparent",
									color: slippage === s ? "#ffffff" : "#94a3b8",
									fontSize: "11px",
									cursor: "pointer",
								}}
							>
								{s}%
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Dry-Run Simulation Live Output */}
			{simulation && (
				<div style={{
					padding: "10px 12px",
					borderRadius: "8px",
					background: "rgba(16, 185, 129, 0.08)",
					border: "1px solid rgba(16, 185, 129, 0.2)",
					fontSize: "11px",
					color: "#a7f3d0",
					marginBottom: "16px",
					fontFamily: "monospace",
					wordBreak: "break-all",
				}}>
					<div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontWeight: 700, color: "#34d399" }}>
						<CheckCircle2 size={14} /> Transaction Simulation Passed (Dry-Run)
					</div>
					<div>Gas: {simulation.gasUsed.toString()} units | Est: ${simulation.estimatedGasCostUsd}</div>
					<div>Trace: {simulation.simulationTrace}</div>
				</div>
			)}

			<button
				onClick={fetchQuote}
				style={{
					width: "100%",
					padding: "14px",
					borderRadius: "12px",
					background: "linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%)",
					border: "none",
					color: "#ffffff",
					fontSize: "15px",
					fontWeight: 700,
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "8px",
					boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)",
				}}
			>
				<ShieldCheck size={18} /> Execute {selectedStock?.stock.symbol} Swap (BSC Mainnet)
			</button>
		</div>
	);
};
