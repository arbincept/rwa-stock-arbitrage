# Technical Architecture & System Specification

**Project:** BNB Chain Tokenized Stocks (RWA) Arbitrage Suite  
**Repository:** `arbincept/rwa-stock-arbitrage`  
**License:** MIT  

---

## 1. System Topology

The system comprises three decoupled layers:

```
┌──────────────────────────────────────────────────────────────┐
│                      DATA & ORACLE LAYER                     │
├──────────────────────────────┬───────────────────────────────┤
│ Binance Web3 API / REST      │ On-chain BSC Contracts (RPC)  │
│ Pyth Benchmark Feeds         │ US Eastern Time State Machine │
└──────────────────────────────┴───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    ARBITRAGE ENGINE LAYER                    │
├──────────────────────────────┬───────────────────────────────┤
│ Market-Hours Spread Engine   │ Cross-Protocol Spread Engine  │
│ (24/7 BSC vs Frozen TradFi)  │ (Ondo PcsXRfq vs bStocks AMM) │
│                              │                               │
│ Execution Friction Model     │ Zero-Risk Swap Simulator      │
│ (Gas, Slippage, Pool Fees)   │ (MinOut Bounds & Gas Audit)   │
└──────────────────────────────┴───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   CONSUMPTION & AGENT LAYER                  │
├──────────────────────────────┬───────────────────────────────┤
│ React 19 Cyberpunk Web UI    │ Binance Wallet Skills SDK     │
│ Vite Production Build        │ Model Context Protocol (MCP)  │
└──────────────────────────────┴───────────────────────────────┘
```

---

## 2. Market-Hours State Machine (`getMarketStatus`)

Traditional equity markets operate under strict schedule boundaries, while BSC decentralized exchanges operate continuously 24/7.

The state machine evaluates market status using **US Eastern Time (ET)**:
- **`WEEKEND_24_7`**: Friday 17:00 ET (21:00 UTC) through Sunday 24:00 ET. TradFi markets are closed. On-chain token prices fluctuate based on crypto market sentiment, breaking macro news, and liquidity rebalancing.
- **`OPEN`**: Monday–Friday 09:30 ET to 16:00 ET (13:30 to 20:00 UTC). Active regular trading hours on NYSE and NASDAQ.
- **`AFTER_HOURS`**: Pre-market (04:00–09:30 ET) and Post-market (16:00–20:00 ET).

### Arbitrage Strategy During `WEEKEND_24_7`:
When on-chain price $P_{\text{BSC}}$ drifts significantly from the Friday closing reference price $P_{\text{TradFiClose}}$:
1. **Premium Deviation ($P_{\text{BSC}} > P_{\text{TradFiClose}}$):**
   - High probability of mean-reversion at Monday cash open.
   - Strategy: `SELL_ONCHAIN_PREMIUM` (take profit on on-chain holdings into USDT).
2. **Discount Deviation ($P_{\text{BSC}} < P_{\text{TradFiClose}}$):**
   - On-chain panic selling creates discounted entry.
   - Strategy: `BUY_ONCHAIN_DISCOUNT` (accumulate discounted equity tokens before TradFi open).

---

## 3. Cross-Protocol Arbitrage Engine

Because tokenized stocks on BSC are issued by multiple independent entities (Ondo Finance, bStocks, xStocks), identical underlying equities have different wrapped contracts with distinct liquidity profiles:

1. **Ondo Finance (`NVDAon`, `AAPLon`, `SPYon`, `MSFTon`):**
   - Primary route: **PancakeSwap X (PcsXRfq)**
   - Pricing: Private market maker RFQ quotes
   - Liquidity: Institutional depth, zero front-running slippage
2. **bStocks (`bNVDA`, `bAAPL`, `bSPY`, `TSLAB`):**
   - Primary route: **PancakeSwap V3 (Concentrated AMM)**
   - Pricing: Deterministic tick curve $(x \cdot y = k)$
   - Liquidity: Open DEX liquidity providers

### Dual-Leg Execution Mechanics:
1. Engine filters stock catalog by `underlyingTicker`.
2. Evaluates all unique platform pairs: $(A_{\text{Ondo}}, B_{\text{bStocks}})$.
3. Identifies $P_{\text{min}} = \min(P_A, P_B)$ and $P_{\text{max}} = \max(P_A, P_B)$.
4. Calculates gross spread:
   $$\text{Spread} = \frac{P_{\text{max}} - P_{\text{min}}}{P_{\text{min}}}$$
5. Deducts two-leg friction ($1.6 \times$ single-leg friction accounting for gas in both legs):
   $$\text{Net Edge} = \text{Spread} - (1.6 \times \text{Friction}_{\text{leg}})$$
6. Flags opportunity as actionable if $\text{Net Edge} \ge 0.40\%$.

---

## 4. Execution Friction Model

The friction model computes realistic on-chain costs:
- **Gas Units:** 142,000 gas units (standard ERC-20 swap via router).
- **Gas Price:** 3 Gwei (standard BSC baseline).
- **BNB Reference:** $760.00 USD.
- **Gas Cost (Wei):** $142,000 \times 3 \times 10^9 = 4.26 \times 10^{14}$ wei = 0.000426 BNB.
- **Gas Cost (USD):** $0.000426 \times 760 = \$0.3238$.
- **DEX AMM Pool Fee:** 0.25% (PancakeSwap v2/v3 default pool tier).
- **Slippage Buffer:** 0.30% defensive protection.

---

## 5. Autonomous Agent & MCP Architecture

To qualify for the **$2,000 Binance Agentic Wallet Bounty**, the system implements both:
1. **Binance Wallet Skills SDK Contract (`RwaStockArbitrageSkill`):**
   - Structured according to the `@binance/wallet-skills` specification.
   - Declarative JSON schema for tool arguments.
2. **Model Context Protocol (MCP) Server (`src/agent/mcp-server.ts`):**
   - Standard JSON-RPC 2.0 communication over stdio.
   - Fully compatible with Cursor AI, Claude Code, and custom autonomous sidecars.
