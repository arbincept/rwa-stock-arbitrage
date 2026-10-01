# Sharing assets

## Social preview

- Editable source: [social-preview.svg](social-preview.svg).
- Upload image: [social-preview.png](social-preview.png), 1280 × 640 pixels, below 1 MB.
- Copy: “Explore tokenized-stock price gaps on BNB Chain”, signed “by Lukecele”.
- Artwork is original vector typography and decoration, using the dashboard's dark background and violet/blue palette from `src/App.tsx`. The decoration does not represent market data. No third-party logo or external image is included.
- Text uses DejaVu Sans with Arial/sans-serif fallbacks. Use DejaVu Sans when exporting for consistent layout. The SVG has an opaque background so its contrast does not depend on the surrounding theme.

To export, open the SVG in a browser or vector editor with DejaVu Sans available and export the entire 1280 × 640 canvas to PNG at 1× scale. Check the output dimensions and keep the file below 1 MB.

Upload the PNG in this repository's **Settings → General → Social preview → Edit → Upload an image**. Committing an image or adding it to a README does not configure GitHub's social preview. See [GitHub's social preview documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview).

## Repository discovery copy

Recommended About description:

> Tokenized-stock research on BNB Chain: market-hours gaps, cross-protocol spreads and swap simulation. Experimental MCP adapter. Built by Lukecele.

Homepage: <https://rwa-stock-arbitrage.vercel.app>

Topics:

```text
rwa tokenized-stocks tokenized-equities bnb-chain arbitrage market-hours defi ondo-finance typescript react vite mcp
```

The `mcp` topic describes the experimental adapter only. It currently supports `tools/list` and `tools/call` without the initialization handshake. Hosted Binance Agentic Wallet compatibility remains unverified. Recheck these limitations before changing the copy.

These are recommended settings, not evidence of publication. About, homepage, topics, and social preview are separate settings. GitHub currently permits up to 20 topics, each with no more than 50 characters, using lowercase letters, numbers, and hyphens; see [GitHub's topic guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics).

## Announcement and screenshot

The [technical announcement](announcement.md) is a draft for the maintainer to publish. It distinguishes research signals, simulation, user-signed spot swaps, and experimental tooling.

The README retains the [existing dashboard screenshot](live-dashboard.png), including the benchmark comparison and wrapper prices. It is a historical application capture; its values do not demonstrate a currently executable trade or current market conditions.
