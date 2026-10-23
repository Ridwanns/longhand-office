# Data Pasar and simpler portfolios

Release verified 13 October 2026, Asia/Jakarta. This remains a local app; no hosting, broker connection or trading execution was added.

## Navigation

**Data Pasar** is now its own main-navigation section. It contains US, Indonesia, Bonds, Commodities and Makro/Indeks category links. They support direct URLs, keyboard and touch. Price lookups were removed from portfolio lists and detail pages so market browsing and portfolio bookkeeping have distinct places. The original architectural overview is retained.

**Portofolio** now has **Paper** and **Riil** groups. Each group follows three steps: create a portfolio, record purchases/sales, then inspect positions. Paper is simulated; Riil is manual bookkeeping of actual investments supplied by the user. A real-type record does not place an order or connect to an account. Detailed ledger tables and cost explanations are collapsed behind **Detail transaksi & perhitungan biaya**, accessible by keyboard; the main view shows cash, open positions and dated valuation. Currency breakdowns and calculation rules are expandable.

Existing portfolios without a `mode` field remain Paper without modifying the underlying records. Newly created portfolios save `mode: "paper"` or `mode: "real"` according to the selected group. Editing an existing portfolio retains its group. Decisions show Paper/Riil prefixes in the portfolio selector. Export/restore retains both modes and their linked records; unknown mode values are rejected. Both groups use the same validated weighted-average ledger convention, which is not a tax statement or broker reconciliation.

Use the regular workspace at `http://127.0.0.1:4173/#portfolios` for your records. Port 4174 and `?preview=flowless` remain isolated, clearly labelled TEST ONLY environments. Ordinary private browser storage and public Research remain separate.

## Available market data

| Category | Available source/coverage | Meaning |
| --- | --- | --- |
| US | Yahoo regular-session snapshot; free ticker search for US stocks/ETFs | USD per share, actual source timestamp; real-time unverified |
| Indonesia | Owner's local Flowless API | Raw daily closing price in IDR; EOD |
| Bonds | TLT, IEF, LQD via Yahoo | Bond ETF prices in USD per ETF share; individual bonds, yield and Indonesian SBN are not connected |
| Commodities | GC=F, SI=F, CL=F via Yahoo | Futures quotes in USD per troy ounce or barrel; not spot prices, contract series may roll |
| Makro/Indeks | S&P 500, Nasdaq Composite, Dow Jones, IHSG, VIX via Yahoo | Index points, not USD/IDR asset prices; macro releases currently link to BPS, BI and FRED rather than importing numeric values |

No quote is seeded in ordinary records or automatically written to valuation history. Search results show their type, units, source and date/time. Yahoo timestamps are shown in WIB; currency is not converted. Unknown delay stays unknown; source snapshots older than 24 hours receive an age note. Missing or unusable data is unavailable rather than zero. A late asynchronous response cannot overwrite a new category/instrument selection. The categories with special tickers use a fixed allowlist; the server has no arbitrary URL proxy.

Yahoo's HTTP source remains an unofficial integration contract and may change or rate-limit requests. NOFX's Alpaca path still requires the account/API credentials that the user does not have. No StockSharp or NOFX trading runtime is installed or executed. See US_MARKET.md for the repository-source distinction.

Instrument definitions were checked against actual Yahoo metadata, the [TLT issuer page](https://www.ishares.com/us/products/239454/ishares-20-year-treasury-bond-etf), and [CME Gold](https://www.cmegroup.com/markets/metals/precious/gold.contractSpecs.html) / [WTI specifications](https://www.cmegroup.com/markets/energy/crude-oil/light-sweet-crude.contractSpecs.html). These sources establish instrument types/units, not a promise of an execution price.

## Verification

- 95 model/adapter tests pass, including 8 new category/unit tests and 4 new portfolio-mode tests. Coverage includes legacy record preservation, malformed modes, export/restore with linked decisions, identical ledger arithmetic in each mode, category allowlists, futures units, bond ETF identity, and IHSG points without currency conversion.
- 40 browser checks pass for all five categories against real sources, date/time labels, 320/390/768/1440 layouts, macro-feed empty state, retained cash/fees, keyboard disclosure, unchanged record storage and reload. See `validation/market-browser-results.json` and `tests/market-browser.mjs`.
- 13 additional browser checks pass for an initially empty Riil group, a clearly labelled TEST ONLY real-type fixture, recorded cash 799 USD from 1,000 − (2 × 100 + 1), valuation 1,039 USD from 799 + 2 × 120, separated Paper/Riil lists, decision-selector labels, mobile layout, reload and isolated backup restoration. The legacy Paper fixture and the ordinary workspace were unchanged.

All transaction and manual valuation values used in Riil-mode tests are synthetic, clearly labelled and created only in a fresh browser context. They are not the user's actual assets or market observations. Ledger limitations remain: no deposits/withdrawals, dividends, splits, tax reconciliation, FX conversion, derivatives exposure accounting or broker synchronization.
