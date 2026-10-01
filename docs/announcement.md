# Technical announcement — draft

Publication status: draft for the maintainer; not posted.

## Explore tokenized-stock price gaps on BNB Chain

I built **RWA Stock Arbitrage Suite** to investigate how on-chain tokenized-stock prices compare with equity benchmarks and with other wrappers of the same underlying stock.

The open-source dashboard brings together market-hours gaps, cross-protocol spreads, and estimates of how trade size, gas, and slippage affect the edge. It uses React, TypeScript, Vite, and viem, with market data from Binance Web3 RWA endpoints and DexScreener.

KyberSwap simulation requests a route and builds calldata without signing or submitting a transaction. The dashboard also supports real Buy/Sell spot swaps, which are a separate wallet action requiring the user to review approvals and signatures. A spread is a research signal; liquidity, timing, and execution costs can change the result.

For developers, `npm run agent:scan` runs the CLI scans and a dry-run swap simulation. The experimental stdio adapter exposes three tools through `tools/list` and `tools/call`, but does not implement the MCP initialization handshake. Full MCP-client compatibility and hosted Binance Agentic Wallet integration remain unverified.

The project was built for **BNB Hack: Tokenized Stocks Edition**. The developer-experience report remains a draft; its performance and integration claims need supporting evidence.

Try the [dashboard](https://rwa-stock-arbitrage.vercel.app), explore or [star the repository](https://github.com/arbincept/rwa-stock-arbitrage), and [follow me, Luca Celebrano (@Lukecele)](https://github.com/Lukecele), for more independent builds from [Arbitrage Inception](https://github.com/arbincept).

Reproducible bug reports and focused contributions are welcome.
