# Flowless integration — local IDX closing prices

Verified on 12 October 2026. The existing checkout at `C:\Users\user\OneDrive\Documents\Tools Stocks` has remote `https://github.com/Ridwanns/flowless.git`. The existing owner's API on port 8000 serves daily stock summaries from its DuckDB database. The public GitHub URL returned 404; implementation was inspected in that local checkout.

## Working workflow

For a simple lookup (added 13 October 2026), the portfolio list and detail screens now show **Cek harga saham IDX**. Type a ticker in **Ticker saham** and press **Lihat harga** or Enter. Any supported instrument in Flowless can be checked without recording a transaction or adding it to a portfolio. Search results are temporary and never stored as valuations. The existing valuation-save workflow below remains available for recorded instruments.

1. Run Office with `npm start`; leave the existing Flowless server running on loopback port 8000.
2. Open a paper portfolio containing an IDX stock such as BBCA or BBCA.JK. Choose **Fetch IDX close**.
3. Select the instrument and date, then **Read Flowless price**. Check the displayed closing price, actual market-data date and retrieval time. A weekend request uses the preceding recorded session, not a future session.
4. Choose **Save Flowless closing price** to append a valuation record. Reading or cancelling alone does not save anything. Reload preserves saved prices and their provenance.
5. Export through **Records & continuity**. The existing restore workflow validates the source metadata as well as the transaction ledger. Restore replaces that browser's records only after explicit confirmation; all verification used fresh isolated browser contexts.

The TEST ONLY preview is [available locally](http://127.0.0.1:4174/?preview=flowless#portfolio/flowless-demo-portfolio) after `npm run start:test`. Its dedicated storage key is `longhand-office.v1.flowless-preview`. It seeds one labelled synthetic purchase and no market price; use the source-read workflow to populate a real closing-price observation.

## Calculation and source evidence

Office's bridge fetched BBCA **5,950 IDR, market-data date 2026-10-12**, raw `close`, from `/api/ticker/BBCA`. This matched a separate parameterized, read-only query of `fact_daily` using `scripts/verify-flowless.py`. Volume was 97,965,100. File size and modification time were unchanged by that verification. `adj_close` is deliberately not used because the paper ledger does not adjust quantities for splits.

Synthetic portfolio inputs: opening cash IDR 1,000,000; purchase of 100 shares at supplied price IDR 5,500 with IDR 5,500 fees. These are test inputs, not actual trades or source prices.

| Calculation | Expected IDR |
| --- | ---: |
| Remaining cost: 100 × 5,500 + 5,500 | 555,500 |
| Cash: 1,000,000 − 555,500 | 444,500 |
| Market value: 100 × 5,950 | 595,000 |
| Unrealized profit: 595,000 − 555,500 | 39,500 |
| Total value including cash | 1,039,500 |

Largest position: `595,000 / 1,039,500 × 100 = 57.239057%` displayed. Independent Python Decimal arithmetic is in `scripts/reference-flowless.py`.

## Verification

- `npm test`: 70 passing tests, including 18 new Flowless adapter/provenance tests and the existing ledger/valuation suite. Covers unusable latest closes, missing symbols, request normalization, raw-vs-adjusted price selection, historical dates, provenance validation, stale prices and separate currencies.
- `tests/flowless-browser.mjs`: 28 passing checks against the actual local Flowless API, plus a simulated outage. Verified read/review/save, disabled save before read, historical date selection, date-change invalidation, cancellation, reload, export and field-for-field restoration in a fresh context.
- Existing `tests/valuation-browser.mjs`: 35 regression checks passed after the integration, including linked records, invalid backups, missing/outdated prices and currency separation.
- Responsive checks passed at 320, 390, 768 and 1440 pixels. Keyboard table scrolling, modal focus containment, touch operation and reduced motion passed. No uncaught browser errors. Original Office storage was compared before/after and unchanged.
- API GET/status and GET/price passed; POST rejected 405; cross-origin request and invalid Host rejected 403. The bridge has fixed upstream URLs, normalized ticker inputs, a 15-second timeout, no CORS and no generic proxy route.

Quick lookup verification on 13 October: 15 browser checks passed for real BBRI, TLKM and ASII reads, lowercase `.JK` input, Enter submission, invalid tickers, source failure without stale results, portfolio list visibility, unchanged records, and layouts at 320/390/768/1440 pixels. No uncaught browser errors. Source prices remained dated 12 October 2026; no claim was made that these were real-time. The 70 model/adapter tests also passed after this UI change.

Evidence: `validation/flowless-browser-results.json`, `validation/flowless-valuation-regression.json`, source dialog and mobile/desktop screenshots in `validation/`, plus a TEST ONLY exported backup. None contains ordinary workspace records.

## Boundaries

The integration reads existing daily data. It provides neither intraday nor real-time quotes and does not run ingestion, schedule updates, change Flowless source code, or alter its database. Source availability and coverage depend on the owner's existing service/data. Only four-letter IDX stock symbols and their `.JK` form are supported initially. US market data is not connected here.

Prices older than 30 calendar days retain the existing outdated-price flag. That threshold is a valuation policy, not proof of a complete or freshly synchronized exchange feed. No source-verification claim is made beyond the local data actually retrieved. Missing/invalid closes are rejected without substituting zero or silently falling back to an older close. Retrieval time and market-data date remain separate.

Prices append to the browser's existing `portfolio.valuations`. Source metadata includes `origin`, `sourceSymbol`, `market`, `priceKind`, `retrievedAt` and source text. Transactions, linked theses and decisions are not rewritten. Prices in another currency remain separate; no exchange rate is supplied. The ledger still has no split/dividend processing. Keep manual prices available for instruments outside this source's coverage.

## Other repositories tried

| Repository | Result in this workspace |
| --- | --- |
| Stockbit MCP | Isolated checkout outside OneDrive; locally patched Zod imports to `zod/v3` to compile. 67 selected offline tests passed and audit reported zero vulnerabilities after dependency fixes. No account login or live data test completed. Quote reader lacked an exchange timestamp, so it cannot establish verified real-time freshness. Not wired into Office. |
| StockSharp | Source and exporter inspected. Current LICENSE points to proprietary terms/EULA. Its connectors do not grant free data access. No code copied into Office and no trading engine started. |
| NOFX | Alpaca stock reader inspected: requires API key/secret and requests IEX bars. Full trading terminal was not run. No US connector configured. |
| Dataset-Saham-IDX | Historical daily CSV inspected. BBCA sample ended 21 February 2025; unsuitable for the requested current real-time feed. Not used as today's prices. |
| Your Flowless | Existing local API and raw DB close matched. Read-only Office bridge is working; chosen for IDX daily-close valuation. |
