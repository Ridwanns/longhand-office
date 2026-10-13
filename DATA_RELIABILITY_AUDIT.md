# Full data and workflow follow-up — 13 October 2026

The user reported an unavailable market and requested a detailed check of the complete application. Verification includes the actual existing in-app browser, isolated browser contexts, public datasets, Node/SQLite APIs, accounting, analysis, research links and restoration. User records were not replaced or uploaded.

## Findings and fixes

1. The existing user tab was still running the preceding frontend: it showed “Evidence before conviction”, the old 20-instrument picker, and a publication notice from 16:46 WIB. The deployed frontend already contained the new same-page Quant design and 94 histories. A deliberate reload loads the current code; unsaved editors are not automatically reloaded.
2. Markets previously accepted arbitrary tickers although Pages only serves the published universe. An unsupported saved entry became a generic unavailable row. Markets now offers a searchable published stock/company list, normalizes US share classes and IDX `.JK`, and prevents new unpublished additions. Older watchlist entries remain retained, with **Not published** and an explanation. There is no substituted ticker or price.
3. Publication notices were rendered once and could remain stale after refreshing the underlying market file. The notice now updates after market refresh and is not duplicated.
4. A quote previously depended on successful loading of the model manifest. A failed model-list request could hide a valid price. Quote validity is now checked independently: the real price remains visible, the model button is disabled with a precise explanation, and a later refresh recovers model availability.
5. Public quote validation now checks symbol, source, price, currency, instrument type/units, source/acquisition/publication times, exchange date for US/IDX/bond ETFs, duplicate/invalid/future chart dates, and arithmetic against the exact previous available close. The same contract is used in the browser and the prepublication verifier. Invalid source data is rejected before valuation actions are offered.
6. Errors distinguish **Not published**, **Source unavailable**, **Invalid source data**, and model-list/history limitations. Missing price change is **No prior close**, not a failed price. An old source observation is checked against the current clock rather than its frozen retrieval-time age.
7. A missing empirical forecast interval now states **Needs 20 scored errors · N available**. The evidence threshold remains unchanged; a completed forecast is not falsely portrayed as a failed market feed.

## Verification

| Check | Passing result |
| --- | --- |
| Automated accounting, contracts, models, providers, storage and new quote-integrity cases | 175 tests |
| Live isolated Node/SQLite API protections and compatibility | 4 tests |
| All published histories, raw/adjusted × 5/20-session horizons, strict complete-analysis validation | 376 cases / 94 histories |
| Actual browser Workers and IndexedDB, every default US/IDX instrument | 94 completed |
| Public quote adapter, including quote integrity checks | 105 entries |
| Each actual Markets row/detail, price match, unit, provenance and applicable model button | 105 entries |
| New publication/search/normalization/legacy-watchlist/failure/recovery tests | 20 assertions |
| Same-page Quant, seed, evidence threshold, reload, Back, ADRO and Markets actions | 22 assertions |
| Complete browser portfolio/thesis/decision/reviews/valuation/backup/isolated restoration workflow | 22 assertions |
| Same complete workflow in local Node/SQLite edition | 22 assertions |
| Browser race, idempotency, cancellation, malformed backup, privacy, layouts, keyboard and motion | 51 assertions |
| Local token/retry/editor-race/restore/layout audit | 40 assertions |
| Legacy records, retained research IDs, corrupted backup and restore cancellation/races | 11 assertions |
| All five market categories at 1440/390/320 px | 15 assertions |
| Independent Python check of freshly exported browser AAPL analysis | 34 numerical checks / 1,254 observations |
| Independent Python check of freshly exported browser ADRO analysis | 34 numerical checks / 361 observations |
| Live public Longhand Research catalogue refresh | 12 reports, successful refresh, no browser exceptions |

The core ledger example independently reconciles cash 844 USD, six remaining shares, recorded cost 303, trading profit 35, fees 8 and dividends 12. Supplied price 70 gives total value 1,264 and unrealized P/L 117. Invalid oversales/withdrawals do not mutate records; missing/stale/incompatible prices suppress complete valuations and concentration. Currencies remain separate. Both complete workflows restore all records and linked analyses into fresh test environments.

Markets/Quant fit 1440/768/390/320 px. Keyboard opening, focus behavior, table scrolling and reduced motion remain covered. Browser workflows reported no JavaScript exceptions. A clock-advanced isolated check confirmed that a retained source observation becomes labelled over 24 hours old even without a new data publication. Failure tests deliberately inject TEST ONLY unlisted tickers, incompatible currencies, HTTP 503 and model-manifest failures; those synthetic failures are not public source observations.

Receipts, exports used by independent numerical checks and screenshots are stored locally under ignored `validation/`. They are excluded from Git and the published artifact. Tests are Chromium/in-app browser checks, not exhaustive device/screen-reader certification or a guarantee against all future bugs and provider failures.

The [published fix deployment](https://github.com/Ridwanns/longhand-office/actions/runs/38388643214) passed all 175 core tests, acquired 94 histories/105 quotes with zero provider failures, and passed all 376 model cases before deploying. Direct HTTPS rechecks then passed 20 availability/failure/recovery assertions, all 105 rendered Markets instruments, the 22-step records/restore workflow and 22 Quant assertions. The live publication timestamp was 11:12:55 UTC. Test wait predicates now require that the market controls actually exist before reading completion state; this handles slower hosted startup rather than assuming localhost timing.

## Legitimate unavailable features

The source still has an IDX missing-close break; explicit earlier model cutoffs retain usable observations instead of inventing sessions. Some 20-session studies do not have 20 scored errors, so their empirical intervals remain absent. Missing portfolio prices and unknown cash do not become zero. No automatic FX consolidation, TWR/MWR without required boundary valuations, numerical macro feeds or individual bond yields were invented. Bonds represents the selected ETFs; commodities represents the selected futures. Treasury/Governance remain planned.

Prices are scheduled dated snapshots, not streaming. Coverage is curated research coverage, not verified current market-cap/LQ45/S&P ranking or executable liquidity. The public site stores private records/runs in each browser profile; it has no account synchronization or authenticated hosted vault. Preserve complete exports before clearing storage or moving devices.
