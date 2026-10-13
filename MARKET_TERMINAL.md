# Markets watchlists, English interface and dark mode

Updated 13 October 2026 (Asia/Jakarta). The existing Markets section now presents several source-backed instruments together, inspired by a financial market watchlist. It retains Longhand Office's ivory/olive/bronze identity and adds a charcoal dark palette.

## Working interface

- Default watchlists: four US stocks, four Indonesian stocks, three bond ETFs, three commodity futures and five indices. They are browsing lists, not portfolio holdings or recommendations. Prices load independently so one unavailable symbol does not hide the other observations.
- Each row shows price/level, units, source date/time, percentage change against the previous available daily close, and a small history chart. Selecting a row opens a larger chart and source details. Source closes are also available as an accessible table.
- US and Indonesian tickers can be added, removed and reset. Lists are capped at 12 tickers. Duplicate symbols select the existing row. Preferences persist locally; live prices are not written to storage.
- Refresh is manual. Up to three requests are made concurrently, with a 60-second in-memory reuse window during navigation. There is no streaming feed or continuous polling.
- On mobile, price and percentage-change columns remain visible; small row charts give way to the larger selected-instrument chart below. The source data remains keyboard and touch accessible.
- Navigation, portfolio labels, forms, errors and market controls are in English. User-authored records and original report/company names are preserved rather than translated.
- The header's **Dark mode / Light mode** button remembers the chosen appearance. Before choosing, the app follows the operating system's preference. Theme updates do not rewrite investment records, and reduced-motion preferences are still respected.

## Price and chart meaning

Charts are drawn from actual source close arrays, not seeded example data or fabricated interpolation. Yahoo supplies a short daily history with the current quote; Flowless supplies up to 20 eligible daily closing observations. A latest daily bar may be in progress. Invalid, zero, null and future observations are omitted without inventing substitute values. A chart can end before a newer price snapshot if the provider omits its latest daily close; that difference is labelled explicitly.

Change is `price − previous available close`; percentage change is `(price / previous available close − 1) × 100`. The reference session date is shown. This is a source-price comparison, not a portfolio performance result. Missing reference history produces unavailable change and does not manufacture a flat graph. Contract rolls and corporate actions can affect comparisons across historical sessions.

Source time and chart dates remain separate from retrieval time. Currencies and index points are not combined or converted. Indonesia continues to use Flowless EOD data. Yahoo observations remain snapshots with unverified real-time status and unknown delay where the source supplies none. Bonds are ETF prices; commodities are futures; numeric macro releases are not connected. No broker or trading execution was added.

## Storage and verification

Portfolio, thesis, decision and valuation storage remains under the existing record keys. Theme preference uses `longhand-office.theme`; US/IDX watchlist preferences use `longhand-office.watchlists.v1`. These interface preferences are outside the investment-record backup format. Source observations are held in memory only. The server stays loopback-only and private records remain separate from public Research.

- **103 model/adapter tests pass**, including eight new tests for actual source-close extraction, missing data, future observations, invalid history shapes and independently calculated positive/negative percentage changes.
- **23 browser checks** passed against actual sources across all five categories: multiple prices and charts, English Paper/Real screens, dark preference persistence, selection, 320/390/768/1440 layouts, no uncaught errors and unchanged record storage. Receipt: `validation/terminal-browser-results.json`.
- **11 additional controls checks** passed: adding and persisting AMZN, duplicate handling, keyboard selection and source-table disclosure, operating-system dark preference, explicit light override, unavailable refresh without stale/zero prices, and untouched records.
- **Seven removal/mobile checks** passed: removing all tickers, preserving an empty list, resetting defaults, chart dates matching available source history, visible mobile price/change columns and reduced-motion architectural overview.

All browser checks used fresh isolated contexts. Ordinary workspace records were never restored or replaced. Source failure was simulated only in a test context. Screenshots are in `validation/`: `watchlist-light-desktop.png`, `watchlist-dark-desktop.png`, `watchlist-dark-mobile.png` and `office-dark.png`.
