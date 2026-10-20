# Connected market prices

Market pages now open a provider-rendered price panel independently of the six-hour Office publication pipeline. It appears above the explicitly labelled **Dated research snapshot**. TradingView supplies the public price display; Office does not extract its numbers into model histories, valuations, portfolio records or prediction outcomes.

| Instruments | Display and timing |
| --- | --- |
| US stock watchlist | Verified source listing maps to NASDAQ, NYSE or AMEX; public exchange data is delayed. |
| Indonesian stock watchlist | Verified IDX listing; public data is end of day, marked E. |
| Bond ETFs | All 19 connected funds, grouped into Treasury, inflation-linked, corporate and broad/international exposure. USD per share, delayed; not individual bond prices or yields. |
| Cash indices | IHSG, DAX and Nikkei 225, end of day. |
| US index CFDs | Separate, explicitly labelled FOREX.com CFD instruments. They are not S&P 500, Nasdaq or Dow cash-index levels. |
| Gold | OANDA XAU/USD spot reference in USD per troy ounce. Streaming OTC provider quote; not COMEX futures, Indonesian retail gold, or an execution guarantee. |

The public widget does not provide licensed US cash-index levels or COMEX gold futures in this configuration. No denied instrument is silently replaced by a derivative or a zero. Source observation dates remain attached to the separate Yahoo research snapshots and native history charts.

US/IDX feed lists follow the saved watchlist after source exchange/currency verification. A missing or unrecognised listing is disclosed instead of guessing a venue. Provider errors remain visible inside the frame. An iframe load only means its document opened; the parent deliberately does not certify a live tick or manufacture an observation timestamp.

The provider panel adapts to small screens, reloads for theme changes, and has Pause/Resume and Reconnect controls. It releases the external frame while the tab or panel is hidden. The cross-origin frame receives public instrument identifiers and display options only. Existing model inputs and private records remain separate. The displayed provider attribution and branding are retained.

## Provider boundaries

- [TradingView public data FAQ](https://www.tradingview.com/widget-docs/faq/data/) explains exchange delays, website real-time rights and why a paid personal plan does not change widget entitlements.
- [North America widget coverage](https://www.tradingview.com/widget-docs/markets/north-america/) identifies delayed Cboe One stock data; [Asia-Pacific coverage](https://www.tradingview.com/widget-docs/markets/asia-pacific/) identifies IDX end-of-day stocks/indices.
- [Market Overview widget documentation](https://www.tradingview.com/widget-docs/widgets/watchlists/market-overview/) describes the embedded public display used here. All external code runs in the provider frame, not in the Office origin.
- Yahoo continues to supply separately acquired public research snapshots. Reloading a published JSON file is not presented as a new exchange observation. Direct browser acquisition was checked and the Yahoo response did not permit cross-origin reading; no public CORS proxy was introduced.
- The Pluang connector successfully supplied an authorized market-only read for five US stocks/ETFs in chat. It does not create a public website API or a redistribution entitlement. No connector credential or returned broker quote was committed or published. Existing explicit market-data imports remain available.

## Validation

657 unit tests passed. New browser checks cover verified watchlist additions, exact instrument identities, ETF exposure groups, timing labels, pause/resume/reconnect, theme changes, source-history preservation and 320–1440 px layouts. Additional navigation, Treasury, macro outlook and native chart sizing regressions passed.

Actual public-provider UI checks returned numeric quotes for all 19 bond ETFs across all four tabs, the stock lists and the supported index/CFD groups. Three gold observations ten seconds apart changed without navigation or injected prices. These checks establish observed delivery during testing, not a promise of continuous availability or exchange real-time entitlement. Validation captures remain outside the public build.
