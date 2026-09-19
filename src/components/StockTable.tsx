import React, { useState } from "react";
import type { StockPriceData } from "../types/rwa.ts";
import { Search, ExternalLink, ArrowUpDown } from "lucide-react";

interface Props {
	stocks: StockPriceData[];
	onSelectStock: (symbol: string) => void;
	selectedSymbol: string;
}

export const StockTable: React.FC<Props> = ({
	stocks,
	onSelectStock,
	selectedSymbol,
}) => {
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<string>("ALL");

	const filtered = stocks.filter((s) => {
		const matchSearch =
			s.stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
			s.stock.underlyingTicker.toLowerCase().includes(search.toLowerCase()) ||
			s.stock.name.toLowerCase().includes(search.toLowerCase());
		const matchCategory = category === "ALL" || s.stock.category === category;
		return matchSearch && matchCategory;
	});

	const categories = ["ALL", "Semiconductor", "Tech", "EV", "Index ETF", "Finance"];

	return (
		<div style={{
			background: "#0d1117",
			border: "1px solid rgba(255, 255, 255, 0.08)",
			borderRadius: "16px",
			padding: "24px",
			marginBottom: "28px",
		}}>
			<div style={{
				display: "flex",
				flexWrap: "wrap",
				justifyContent: "space-between",
				alignItems: "center",
				gap: "14px",
				marginBottom: "20px",
			}}>
				<h2 style={{ margin: 0, fontSize: "18px", color: "#ffffff", fontWeight: 700 }}>
					Verified BSC Tokenized Stocks (Ondo, bStocks, xStocks)
				</h2>

				<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
					<div style={{ position: "relative" }}>
						<Search size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "#64748b" }} />
						<input
							type="text"
							placeholder="Search ticker (NVDA, TSLA...)"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							style={{
								padding: "8px 12px 8px 34px",
								borderRadius: "8px",
								background: "rgba(255, 255, 255, 0.05)",
								border: "1px solid rgba(255, 255, 255, 0.1)",
								color: "#ffffff",
								fontSize: "13px",
								outline: "none",
								width: "210px",
							}}
						/>
					</div>

					<div style={{ display: "flex", gap: "4px" }}>
						{categories.map((c) => (
							<button
								key={c}
								onClick={() => setCategory(c)}
								style={{
									padding: "6px 12px",
									borderRadius: "8px",
									background: category === c ? "rgba(139, 92, 246, 0.25)" : "transparent",
									border: category === c ? "1px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.05)",
									color: category === c ? "#ffffff" : "#94a3b8",
									fontSize: "12px",
									fontWeight: 500,
									cursor: "pointer",
								}}
							>
								{c}
							</button>
						))}
					</div>
				</div>
			</div>

			<div style={{ overflowX: "auto" }}>
				<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
					<thead>
						<tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8", textAlign: "left" }}>
							<th style={{ padding: "12px 14px", fontWeight: 600 }}>Asset</th>
							<th style={{ padding: "12px 14px", fontWeight: 600 }}>Venue</th>
							<th style={{ padding: "12px 14px", fontWeight: 600 }}>BSC On-Chain Price</th>
							<th style={{ padding: "12px 14px", fontWeight: 600 }}>TradFi Reference</th>
							<th style={{ padding: "12px 14px", fontWeight: 600 }}>Spread / Gap</th>
							<th style={{ padding: "12px 14px", fontWeight: 600 }}>Liquidity Depth</th>
							<th style={{ padding: "12px 14px", fontWeight: 600, textAlign: "right" }}>Action</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((item) => {
							const isSelected = item.stock.symbol === selectedSymbol;
							return (
								<tr
									key={item.stock.symbol}
									onClick={() => onSelectStock(item.stock.symbol)}
									style={{
										borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
										background: isSelected ? "rgba(139, 92, 246, 0.12)" : "transparent",
										cursor: "pointer",
										transition: "background 0.15s ease",
									}}
								>
									<td style={{ padding: "14px", fontWeight: 600, color: "#ffffff" }}>
										<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
											<div>
												<div>{item.stock.symbol}</div>
												<div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 400 }}>
													{item.stock.underlyingCompanyName}
												</div>
											</div>
										</div>
									</td>
									<td style={{ padding: "14px" }}>
										<span style={{
											padding: "3px 8px",
											borderRadius: "6px",
											fontSize: "11px",
											fontWeight: 600,
											background:
												item.stock.platform === "Ondo"
													? "rgba(59, 130, 246, 0.15)"
													: item.stock.platform === "BStock"
													? "rgba(245, 158, 11, 0.15)"
													: "rgba(16, 185, 129, 0.15)",
											color:
												item.stock.platform === "Ondo"
													? "#60a5fa"
													: item.stock.platform === "BStock"
													? "#fbbf24"
													: "#34d399",
										}}>
											{item.stock.platform}
										</span>
									</td>
									<td style={{ padding: "14px", fontWeight: 700, color: "#f8fafc" }}>
										${item.onChainPriceUsd.toFixed(2)}
									</td>
									<td style={{ padding: "14px", color: "#cbd5e1" }}>
										${item.tradFiRefPriceUsd.toFixed(2)}
										<span style={{ fontSize: "11px", color: "#64748b", marginLeft: "4px" }}>
											({item.stock.referencePriceSource})
										</span>
									</td>
									<td style={{ padding: "14px" }}>
										<span style={{
											fontWeight: 700,
											padding: "2px 8px",
											borderRadius: "6px",
											background: item.spreadPct >= 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(59, 130, 246, 0.1)",
											color: item.spreadPct >= 0 ? "#4ade80" : "#60a5fa",
										}}>
											{item.spreadPct >= 0 ? `+${item.spreadPct.toFixed(2)}%` : `${item.spreadPct.toFixed(2)}%`}
										</span>
									</td>
									<td style={{ padding: "14px", color: "#94a3b8" }}>
										${(item.liquidityDepthUsd / 1000).toFixed(0)}k
									</td>
									<td style={{ padding: "14px", textAlign: "right" }}>
										<button
											onClick={(e) => {
												e.stopPropagation();
												onSelectStock(item.stock.symbol);
											}}
											style={{
												padding: "6px 14px",
												borderRadius: "8px",
												background: isSelected ? "#8b5cf6" : "rgba(255, 255, 255, 0.08)",
												border: "none",
												color: "#ffffff",
												fontWeight: 600,
												fontSize: "12px",
												cursor: "pointer",
											}}
										>
											{isSelected ? "Selected" : "Trade"}
										</button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
};
