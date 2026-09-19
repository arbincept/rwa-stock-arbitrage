import readline from "readline";
import { RwaStockArbitrageSkill } from "./wallet-skill.ts";

/**
 * Model Context Protocol (MCP) Server for Binance Web3 Tokenized Stocks Arbitrage.
 * Enables Cursor, Claude Code, Antigravity, and BNB Agent Studio to invoke tools via stdio.
 */
const skill = new RwaStockArbitrageSkill();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false,
});

function sendResponse(id: any, result: any, error?: any) {
	const res = {
		jsonrpc: "2.0",
		id,
		...(error ? { error } : { result }),
	};
	process.stdout.write(JSON.stringify(res) + "\n");
}

rl.on("line", async (line) => {
	if (!line.trim()) return;
	try {
		const msg = JSON.parse(line);
		const { id, method, params } = msg;

		if (method === "tools/list") {
			sendResponse(id, { tools: skill.getTools() });
			return;
		}

		if (method === "tools/call") {
			const { name, arguments: args } = params;
			if (name === "scan_market_hours_gaps") {
				const res = await skill.scanMarketHoursGaps(args?.minNetProfitPct, args?.tradeSizeUsd);
				sendResponse(id, { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] });
				return;
			}
			if (name === "scan_cross_protocol_gaps") {
				const res = await skill.scanCrossProtocolGaps(args?.minNetProfitPct);
				sendResponse(id, { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] });
				return;
			}
			if (name === "simulate_stock_swap") {
				const res = await skill.simulateStockSwap(args?.symbol, args?.amountInUsd);
				sendResponse(id, { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] });
				return;
			}
			sendResponse(id, null, { code: -32601, message: `Tool not found: ${name}` });
			return;
		}

		sendResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
	} catch (e: any) {
		sendResponse(null, null, { code: -32700, message: `Parse error: ${e.message}` });
	}
});

if (process.env.DEBUG_MCP) {
	console.error("[MCP Server] RWA Stock Arbitrage MCP Server listening on stdio.");
}
