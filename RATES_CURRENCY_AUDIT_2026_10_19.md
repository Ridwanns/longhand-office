# Rates and currency continuation

19 October 2026. Local changes only, on `codex/market-workspace-clarity`. This continues the previous Macro visual refinement; it does not claim complete global macro coverage.

## Implemented

- Rates has a country-specific heading, a compact control row on desktop, consistent native chart presentation and one collapsed Sources and instrument details section. Original alternative histories, instrument definitions, hashes and source links remain accessible inside it.
- The release calendar now uses a constrained reading width, compact rows and readable month names. Its full 45-day table and source information remain available. Coverage is explicitly US BLS, not a fabricated global calendar.
- The repeated snapshot footer is shorter. Observation dates, stale-data warnings and missing-data explanations remain visible in their relevant views.
- Currency history and the official Treasury curve are grouped together, with two keyboard-accessible tabs showing one workspace at a time. They no longer stack two full chart workspaces. Treasury curve labels now retain a readable screen size on desktop and mobile; maturity geometry, yield calculations and source values are unchanged.
- USD/IDR and EUR/USD now have native Office history charts. Previously those selections existed but had no history mapping. The new separate public snapshot uses the existing Yahoo provider, without modifying the original stock, bond, commodity or macro-index history feed.
- Both currency pairs contain 2,608 supplied dates from 19 October 2016 through 16 October 2026. Provider nulls are retained; dates without observations are not filled. Current partial source days are excluded. These are Yahoo currency observations, not JISDOR, an executable FX rate or a verified real-time feed.
- Quote direction is explicit: IDR per USD and USD per EUR. No inversion, derived exchange rate or portfolio conversion is performed. FX readouts allow four decimal places; exact source precision remains in the observation table. Other Macro charts retain their existing default formatting and calculations.
- Daily, weekly, monthly and range controls use only supplied observations. Keyboard inspection uses the same native chart system as Macro. A legacy styling rule that overrode responsive FX axis text sizing was narrowed to exclude native Macro charts.
- Failed FX acquisition preserves a previously valid public history, its original retrieval date, source hash and observations, with a visible refresh-failure status. An unavailable instrument without a prior valid history stays unavailable.
- The local Node edition acquires FX history on access at most once per 15 minutes and shares concurrent acquisition requests. Its read endpoint enforces the existing local origin/method protections. The browser rechecks its FX snapshot cache after five minutes when requested. The Pages collection workflow includes the new collector, but no workflow was dispatched or deployment performed in this task.

## Verification

- Node tests: 554 passed, no failures or skips.
- Local API integration: seven passed, including the FX endpoint, read-only methods, origin restrictions and public snapshot validation.
- Four isolated browser suites: Rates/FX refinement (71 checks), extended country coverage (134), direct Macro monitor (33), historical charts (42). All passed without uncaught browser errors.
- Six additional local Node browser checks passed: updated heading, native currency load, precision metadata, mobile width, readable labels and absence of page errors.
- The FX browser suite checks exact date/value preservation for both pairs across all four history ranges and three frequency choices; keyboard inspection; source disclosures; calendar dates/titles; light/dark layouts at 1440, 1024, 768, 390 and 320 pixels; unchanged Macro source arrays; and a synthetic storage sentinel through refresh.
- A separate .NET/PowerShell projection of freshly retrieved raw Yahoo responses independently matched all 5,216 stored FX date/value rows, including source timezone conversion. Raw responses and the reconciliation result are retained under ignored `validation/` files. This is not a price-quality or real-time certification by Yahoo.
- Unit tests reject incorrect instrument/currency identities, duplicate/future timestamps, invalid prices, wrong quote direction and malformed snapshots. A simulated HTTP 429 verifies retention of original records and a visible failure flag.
- The browser artifact builds successfully and includes the validated public FX snapshot. No database, personal records, backend scripts or validation artifacts are included.

## Remaining data gaps

The existing GEM feed has no quarterly GDP series for Brunei, Cambodia, Laos, Myanmar and Timor-Leste. Their available annual context is not relabelled as quarterly data. GEM's missing Australia/New Zealand/Argentina CPI series do not imply absent country CPI: separate connected sources already provide the dated readings tested by the extended coverage suite. World/Euro-area WDI current-account aggregates and world reserves remain missing in their original source series. No country sum or inferred aggregate has been inserted.

The BLS calendar remains US-only. BI fixing history remains a separately labelled short official archive. Yahoo currency history can be delayed, revised or unavailable; it is not a substitute for official fixing definitions. Source histories are separate from private valuations and model inputs.

## Files touched in this continuation

`macro-extended-ui.js`, `macro-context-ui.js`, `macro-context.css`, `macro-ui.js`, `macro-navigation.js`, `macro-chart.js`, `official-rates.js`, `market-view.js`, `market-data.css`, `fx-history-contract.js`, `scripts/fx-history-data.mjs`, `scripts/build-pages.mjs`, `scripts/serve.mjs`, `scripts/pages-asset-version.mjs`, `.github/workflows/pages.yml`, `tests/fx-history.test.mjs`, `tests/macro-chart.test.mjs`, `tests/macro-extended-browser.mjs`, `tests/rates-refinement-browser.mjs`, `tests/local-api.integration.mjs`, and this report.

Changes from the previous turn remain preserved. No personal investment records were read or edited. No storage schemas, backup formats, model hashes, investment calculations or saved study inputs changed. No merge, commit, push or deployment was performed.
