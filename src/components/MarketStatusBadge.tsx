import React from "react";
import type { StockMarketStatus } from "../types/rwa.ts";
import { Clock, AlertCircle, Sparkles } from "lucide-react";

interface Props {
	status: StockMarketStatus;
	nextOpen?: string;
}

export const MarketStatusBadge: React.FC<Props> = ({ status, nextOpen }) => {
	if (status === "WEEKEND_24_7") {
		return (
			<div style={{
				display: "flex",
				alignItems: "center",
				gap: "10px",
				padding: "8px 16px",
				borderRadius: "9999px",
				background: "linear-gradient(90deg, rgba(234, 179, 8, 0.15) 0%, rgba(34, 197, 94, 0.15) 100%)",
				border: "1px solid rgba(234, 179, 8, 0.3)",
				fontSize: "13px",
				fontWeight: 500,
			}}>
				<span style={{
					display: "inline-block",
					width: "8px",
					height: "8px",
					borderRadius: "50%",
					backgroundColor: "#22c55e",
					boxShadow: "0 0 10px #22c55e",
				}} />
				<span style={{ color: "#facc15" }}>Wall St Closed (Weekend)</span>
				<span style={{ color: "#64748b" }}>•</span>
				<span style={{ color: "#4ade80", display: "flex", alignItems: "center", gap: "4px" }}>
					<Sparkles size={14} /> BSC 24/7 Liquidity Active
				</span>
				{nextOpen && (
					<span style={{ color: "#94a3b8", fontSize: "11px", marginLeft: "6px" }}>
						(Reopens Mon 13:30 UTC)
					</span>
				)}
			</div>
		);
	}

	if (status === "OPEN") {
		return (
			<div style={{
				display: "flex",
				alignItems: "center",
				gap: "8px",
				padding: "6px 14px",
				borderRadius: "9999px",
				background: "rgba(34, 197, 94, 0.1)",
				border: "1px solid rgba(34, 197, 94, 0.3)",
				color: "#4ade80",
				fontSize: "13px",
			}}>
				<span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
				NYSE / NASDAQ Regular Trading Hours
			</div>
		);
	}

	return (
		<div style={{
			display: "flex",
			alignItems: "center",
			gap: "8px",
			padding: "6px 14px",
			borderRadius: "9999px",
			background: "rgba(148, 163, 184, 0.1)",
			border: "1px solid rgba(148, 163, 184, 0.2)",
			color: "#94a3b8",
			fontSize: "13px",
		}}>
			<Clock size={14} />
			After-Hours / Pre-Market Session
		</div>
	);
};
