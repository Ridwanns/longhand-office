# Broad Yahoo market coverage — 13 October 2026

## Scope and observed publication

The market desk now searches the complete paginated result of the configured Yahoo US exchanges and Jakarta exchange, fetched with yfinance 1.7.0. It no longer searches only the original 45 US and 49 IDX histories. This is Yahoo's returned coverage, not a guarantee that every listed, OTC, delisted or restricted instrument is available.

At the tested publication, `2026-10-13T13:29:27.335Z`:

| Item | Observed count |
| --- | ---: |
| US screener records, across 31 pages | 7,679 |
| Additional retained core US instruments | 7 |
| Searchable US stocks/ETFs | 7,686 |
| Searchable IDX stocks, across 4 pages | 837 |
| Price entries including bond ETF aliases, futures and indices | 8,534 |
| Valid price observations | 8,514 |
| Explicit source failures, no substitute price | 20 |
| Published ticker-specific histories | 1,344 |
| Histories with an eligible model cutoff | 1,315 |
| Short/gapped histories without a model cutoff | 29 |

These counts can change at subsequent publications. The twenty price failures are source records without a compatible supplied currency, mostly warrants. They remain searchable and visibly unavailable. Currency is never guessed. ETFs returned by the source are retained. The source query is stored in the publication manifest.

Historical acquisition covers the source's largest 500 model-compatible US names by supplied capitalization, the retained core instruments, all supported returned IDX names, and explicit workflow additions. Price coverage and model coverage are separate: a price-only stock has a disabled model action with a reason. Models require at least 350 contiguous completed observations at an explicit eligible cutoff. No gaps are filled, histories substituted, or new model formulas introduced by this release.

## Data meaning

- Quotes use the supplied regular-session price, exchange date and source timestamp. No streaming or real-time entitlement is claimed.
- Source capitalization and three-month average share volume are displayed where supplied. They are dated provider estimates, not independently verified exchange rankings or an execution/liquidity guarantee.
- Broad quotes have no invented chart bars. When available, the source previous close is used to calculate absolute/percentage change. Its reference date is explicitly marked as not supplied. Published chart histories use genuine dated source closes.
- Prices and USD/IDR units stay separate. Viewing or refreshing Markets does not write portfolio prices. Valuation requires deliberate confirmation.
- GitHub Actions builds fresh public snapshots approximately every six hours. GitHub/provider delays remain possible. Refresh reads the newest publication, not a direct live quote service.

The collector uses [yfinance pagination](https://ranaroussi.github.io/yfinance/reference/api/yfinance.screen.html), with 250 records per page, duplicate/completeness checks, and no account credentials. Python runs during data preparation; GitHub Pages remains static. TradingView widgets are not used as a raw model-data source: their [official data FAQ](https://www.tradingview.com/widget-docs/faq/data/) does not provide such an API/export.

## Verified changes and checks

- **181 application tests** and **4 local API tests** pass.
- **5,260 model cases** pass shared strict validation: both raw/adjusted bases and both 5/20-session horizons for all 1,315 eligible histories. Core coverage and required category quotes remain publication gates.
- All **8,534 quote entries** were inspected through the actual browser adapter: **8,514 accepted**, **20 explicitly withheld**, **zero unexpected failures**. All supplied quotes also pass Node validation.
- **40 expanded browser checks** cover new US/IDX names, missing-price and insufficient-history cases, bounded search rendering, shared snapshot fetching, reload persistence, PLTR/EMTK browser Worker analyses and 1440/768/390/320 px layouts.
- **20 availability/fault/recovery checks**, **22 same-page Quant checks**, **51 browser safety checks**, and the **22-step complete Investment Lab workflow** pass again. The workflow reconciles independently expected cash/cost/profit, rejects oversales, retains report/thesis/decision/review links, and restores a linked-analysis backup in a fresh context.

CBOE's genuine Yahoo `BTS` exchange code was missing from the adapter whitelist and is now accepted with a regression test. Search renders at most 60 matches and 150 native suggestions while searching the full directory. All ticker requests share one market snapshot per 60-second window; explicit Refresh invalidates it once. This avoids downloading the approximately 9.3 MB uncompressed price file for every ticker.

Tests use fresh contexts and ignored validation files. Existing portfolio records, transactions, manual prices, theses, decisions, backups, SQLite databases and the Research repository were not replaced or uploaded. Historical reports retain their original counts; this report supersedes their market-universe counts.

## Build

```powershell
python -m pip install -r requirements-data.txt
python scripts/yahoo-stock-directory.py
npm run data:pages
node scripts/verify-pages-universe.mjs
npm run build:pages
```

The anonymous Python runtime/cache lives in ignored `.tools/` locally. `.pages-data/`, `dist/`, personal databases and test receipts remain excluded from Git. Only the audited public browser artifact is deployed. Existing storage and backup schemas remain unchanged.
