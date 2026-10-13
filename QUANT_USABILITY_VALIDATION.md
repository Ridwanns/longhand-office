# Same-page Quant and expanded stock coverage — 13 October 2026

The subsequent [data reliability audit](DATA_RELIABILITY_AUDIT.md) expands verification to 175 automated checks and every rendered market instrument, adds availability/failure recovery, and explains remaining legitimate unavailable data. The initial usability evidence below is retained as a historical release record.

The user requested simpler stock selection, results below the controls, an explanation of seed, and working major US/IDX coverage including ADRO. This update preserves model formulas, immutable runs, records, linked research and the architectural design. It supersedes preceding documentation that described a new result tab and a 20-instrument publication.

## Concrete changes

- Only market, ticker and scenario horizon are primary controls. Date, basis and seed remain available under Advanced settings. Previous analyses are collapsed.
- Run, retry, rerun, Markets actions and saved research links remain in the same tab. Controls stay above the result. Each run retains a persistent UUID URL and exact original settings.
- Six popular shortcuts, ticker/company search and a complete searchable coverage list replace the long row of buttons. Unknown tickers disable Run instead of substituting another dataset.
- The default universe is 45 US equities/ETFs and 49 IDX names, including ADRO/AADI/ANTM/BBCA/BBRI/BMRI/TLKM/ASII. All are explicitly listed in `pages/stock-universe.js`.
- Source status shows company, tested cutoff, available history and a recent average close × volume estimate. Manual dates remain retained and clearly differ from the tested date. Market actions use an explicitly labelled eligible model date.
- Seed help explains the repeatable simulation draws. Same data/config/seed produced identical result hashes. A different seed changed simulated paths while AR/Ridge forecasts remained identical.

## Verified fixes

An input blur formerly rebuilt the stock-button list, so the subsequent click could disappear. The picker now preserves its DOM during ticker edits, maintains the open search/filter and updates selected state. Regression checks type an unsupported ticker, then click TSLA and run the deliberately selected date.

The previous Market action could request today's date despite a source gap and an earlier model-ready date. It now labels and submits the tested source cutoff; ADRO completes from Markets without another tab. No missing prices are filled.

Saved-run hydration restores controls once per run and does not overwrite edits during polling. Async archive failures are guarded against an obsolete route. The form rechecks publication availability after submission settles, so an unsupported next ticker cannot become enabled accidentally.

## Completed checks

| Verification | Result |
| --- | --- |
| Core accounting/models/contracts/storage/provider tests | 160 passed |
| Every source history: raw/adjusted × 5/20-session horizons; strict retained-analysis validation | 376 passed across 94 instruments |
| Actual browser Workers, Web Crypto validation and IndexedDB, all default US/IDX histories | 94 completed, each at least 350 observations |
| Published quote entries through the browser market adapter | 105 passed |
| New same-page/search/seed/reload/Back/Markets workflow | 21 passed |
| Full paper-portfolio/thesis/decision/reviews/valuation/export/isolated restoration workflow | 22 passed |
| Browser persistence/races/cancellation/corrupted-backup/privacy/responsive/keyboard/motion suite | 51 passed |
| Local server token/rejection/retry/editor-race/restore/layout audit | 40 passed |
| All five Markets categories, each at 1440/390/320 px | 15 passed |

Quant additionally fits 1440/768/390/320 px. Advanced settings open with keyboard Enter; reduced motion suppresses room animations. Wide numerical tables scroll within their own containers. No browser JavaScript exceptions were observed. Tests use fresh isolated browser contexts and TEST ONLY ledgers; no restoration replaces ordinary user records. JSON receipts and screenshots remain in ignored `validation/`.

The final local source snapshot was published at 10:18:58 UTC on 13 October. ADRO and other IDX names have a visible tested 9 October cutoff because a missing later source close breaks continuity; ADRO and BBCA retain 361 observations. AAPL retains 1,254. Subsequent scheduled publications are independently checked again, so these counts and dates are evidence for this snapshot, not perpetual guarantees.

## Limits

Coverage is curated for practical research, not a verified current LQ45/S&P membership list or market-cap ranking. This feed does not supply capitalization; none is invented. Close × volume is an estimated trading value, not actual exchange turnover, spread/depth or an execution/liquidity guarantee. All 94 published instruments were checked; arbitrary unlisted equities are not promised.

Prices remain dated snapshots, published roughly every six hours; they are not streaming. Bonds means the selected bond ETFs, commodities means the selected futures, and Macro/Indices shows source index levels. Individual bond yields and numerical macro releases remain unconnected. Fewer than 20 forecast evaluation errors still suppress empirical intervals.

Personal records and runs remain in the browser profile; no account sync or authenticated server vault was introduced. Export linked analyses with your records before changing devices or clearing storage. New data publications do not rewrite saved runs. Forecasts/scenarios remain statistical studies rather than investment instructions or validated probabilities.
