# Global Macro data desk

Implementation and source audit, 18 October 2026. This extends the existing Office; it does not rebuild it or reproduce Arthara's product.

## What was verified before implementation

The Arthara reference exposes regional macro monitoring, a growth/inflation framework, rates and currency context, liquidity, an economy scorecard and source detail. Its authenticated browser session was inspected with the owner's authorization. Its illustrative figures, weekly writing, forecasts, proprietary scores, positioning labels and backtests were not used as Office data or models. No Arthara visual asset or application code was imported.

Office already had a geographic atlas, twenty GDP/CPI series, a reviewed Indonesian release snapshot, a Treasury par-yield publication, native market-history charts and research-note preparation. Those capabilities remain. The new data desk adds independently acquired context and fills additional geographic coverage without changing the existing GDP/CPI transformations.

## What is implemented

- The existing atlas now supports supplementary annual country observations. Monthly and quarterly series retain their existing source, period and method; annual context does not overwrite them. Policy observations show their measurement basis, including effective fed funds versus a Federal Reserve target range.
- A country desk offers six annual indicators, long-history charts, exact observations, a country scorecard and a comparison of all 46 economies. Missing values remain unavailable.
- An annual growth/inflation trajectory describes changes in the two annual rates for matching consecutive years. It is a historical description, not a forecast, probability, investment posture or a replica of Arthara's regime model.
- Policy/rates observations, JISDOR, US constant-maturity yields, the broad trade-weighted dollar index, a same-date 10Y–2Y spread and a transparent Fed balance-sheet liquidity proxy are available within Office.
- US monthly/weekly activity indicators and a separately labelled official BLS release calendar are accessible. Calendar coverage is BLS only; no consensus or future financial result is supplied.
- A public-data source ledger retains identifiers, units, cadence, observation periods, acquisition times, source-response hashes, methods and a separate public JSON download. This download is not a personal-record backup.

Country coverage comprises 44 countries/territories and two aggregates. Countries/territories are Indonesia, United States, China, Japan, Malaysia, Singapore, Thailand, Philippines, Vietnam, United Kingdom, Germany, France, Italy, Spain, Netherlands, Switzerland, Sweden, Norway, Denmark, Poland, Canada, Australia, New Zealand, South Korea, India, Hong Kong SAR (China), Brazil, Mexico, Argentina, Chile, Colombia, Peru, South Africa, Egypt, Nigeria, Saudi Arabia, United Arab Emirates, Türkiye, Russia, Brunei Darussalam, Cambodia, Lao PDR, Myanmar and Timor-Leste. World and euro area are explicitly separate aggregates; no own ASEAN aggregate is calculated.

## Source ledger and scope

| Source | Implemented observations | Important distinction |
| --- | --- | --- |
| [World Bank WDI](https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG) and its [documented API](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures) | Annual real GDP growth, CPI inflation, modelled ILO unemployment, current account/GDP, FDI net inflows/GDP, total reserves including gold | Annual context from 2000 where supplied. Reported years may differ. Reserves are not a monthly Bank Indonesia FX-reserve release. World Bank CC BY 4.0 attribution is retained. |
| [Bank Indonesia policy table](https://www.bi.go.id/en/statistik/indikator/bi-rate.aspx) | Latest ten published policy decisions | Actual decision dates, no invented older history or daily filling |
| [Bank Indonesia JISDOR](https://www.bi.go.id/en/statistik/informasi-kurs/jisdor/Default.aspx) | Latest published working-day USD/IDR fixings | Official daily fixing, not live FX; not applied to personal portfolios |
| [FRED](https://fred.stlouisfed.org/) distributing Federal Reserve Board, New York Fed, BLS, BEA, Census, US Department of Labor and ECB series | Policy/overnight rates, Treasury constant-maturity yields, balance-sheet components, broad dollar, US activity, long US GDP/CPI levels | Source identifiers and upstream institution names are retained. The existing US YoY-release monitor and new annual reference series remain separate. |
| [BLS official release calendar](https://www.bls.gov/schedule/news_release/) | Published event dates and titles | US source-calendar dates; no invented time conversion, consensus or results |

Additional source identifiers: DFF, ECBDFR, DGS2, DGS10, WALCL, WDTGAL, RRPONTSYD, DTWEXBGS, UNRATE, PAYEMS, INDPRO, RSAFS, ICSA, GDPC1, CPIAUCSL. World Bank indicator identifiers are retained in the contract and downloaded file.

The acquisition audited locally at `2026-10-17T21:50:08.207Z` contains 293 series, of which 290 have numerical observations. There are 57,943 dated rows including nulls, and 54,152 numerical observations. Three aggregate series have no reported numerical value: euro-area current account, world current account and world reserves. They remain unavailable. The BLS file supplied 313 calendar events; the UI shows only the next 45 days, not all events as future releases.

## Calculation audit

The following are new descriptive context calculations. Existing financial models and portfolio mathematics are unchanged.

1. Liquidity proxy = Fed assets − Treasury General Account − overnight reverse repo, all in USD billions. WALCL and WDTGAL are Wednesday levels in source USD millions, divided by 1,000. RRPONTSYD is already in USD billions. Only exactly matching dates are joined; Treasury weekly averages are not substituted. Synthetic independent example: 7,000 − 800 − 120 = 6,080 USD bn. This is an Office proxy, not an official Fed liquidity measure or evidence of causation.
2. 10Y–2Y spread = (10-year percentage yield − 2-year percentage yield) × 100 basis points. Independent example: (5.10 − 4.77) × 100 = 33 bp. Only matching source dates are used. Existing Treasury par yields remain distinct from the new constant-maturity series.
3. Annual cycle coordinates = current annual GDP-growth rate minus the preceding year's rate, and current annual inflation rate minus the preceding year's rate. Matching consecutive years are required in both series. Example: GDP 4% to 5%, CPI 6% to 3% gives +1 pp growth change and −3 pp inflation change. Gaps break the trajectory.
4. Annual reserve source levels are divided by 1,000,000,000. Rate changes are labelled percentage points, index changes index points, and level changes retain their numerical units. Negative FDI/current-account observations and zero reported observations remain valid; null is distinct from zero.

Daily and weekly chart presentation may sample long histories, preserving interval extremes, endpoints and every reported null. The plot states that reduction. Full source observations remain in the public download; no investment-model inputs are sampled. Line plots explicitly use spacing per plotted observation rather than claiming continuous calendar interpolation. GDP bars keep annual positions and a zero baseline.

## Freshness and failure behavior

Observation dates are not release dates. Acquisition dates do not renew old observations. A newer missing annual year is stated alongside the latest reported year; a missing latest daily fixing is not replaced by an older quote. Retrieval-vintage revisions remain possible; this is not a point-in-time release archive.

Office review thresholds are 10 days daily, 21 weekly, 100 monthly or policy-decision observations, 240 quarterly and 1,100 annual, plus ten days since acquisition. They are review reminders, not official release guarantees. Existing legacy GDP/CPI thresholds are unchanged.

The Pages publication workflow collects this public context on its existing six-hour schedule. Schedules can be delayed or fail. The local edition reads the most recently collected public file. The page's refresh button checks that published file, not every institution. Collection is available through `node scripts/macro-context-data.mjs`; independent re-audit is `node scripts/audit-macro-context.mjs`.

Individual source failures remain explicit and do not become zero. Invalid source identity, cadence, units, duplicate or future observations reject the additional feed. Impossible negative balance-sheet levels, invalid unemployment percentages and off-Wednesday liquidity inputs are rejected. The original release monitor and the independent context desk can remain available separately during an outage. Late responses cannot repaint a different workspace.

## Verified defects corrected

- The native IHSG chart mapping was absent even though its source history was already published. It now resolves to the existing `macro:^JKSE` history.
- A new liquidity figure overflowed the 320 px layout during testing. Narrow layouts now stack the figure and label.
- Existing global CSS reduced native chart labels, and capped chart height could make calculated label size too small. Macro chart geometry and scoped font inheritance now keep labels readable at both desktop and mobile sizes.
- An inherited global header rule added unwanted height and padding to the new desk. The desk header is now locally scoped.
- Expanded comparisons scroll within their own labelled table region instead of making the document excessively long.
- Supplementary-feed and legacy-feed outages are isolated. Old data is never assigned a fresh source timestamp on page refresh. Unchanged files retain the current UI; changed files preserve the selected economy, view, indicator and range. Obsolete resize callbacks and event listeners are cancelled before repaint. Observation-age flags are refreshed when their review state changes.

The legacy Quant-navigation browser harness assumed the always-open sidebar from before Research Lab restructuring. Its checks now open the existing optional precision navigator, follow retained-study view routes and verify the current layout. All 59 updated checks pass; production Quant components and calculations are unchanged.

## Preservation

No portfolio, thesis, decision, review, valuation, saved-study, IndexedDB or SQLite schema was modified. No record migration, storage reset or historical-study rewrite was performed. `app.js`, `model.js`, `quant-math.js`, `quant-contract.js`, `quant-history.js`, `office-storage.js` and `complete-backup.js` remain unchanged. Data acquisition and testing use public sources, isolated browser profiles and synthetic TEST ONLY investment records.

## Validation ledger

Completed locally:

- All 489 Node tests passed, including 31 new macro-context tests and five asset-versioning tests.
- All six local API integration tests passed on isolated port 4174.
- The independent source audit passed 314 checks and compared all 57,943 stored dated observations against fresh public-source projections. It separately checked all aligned liquidity and yield-spread results.
- Macro UI: 150 checks passed over all 46 economy selections, six country indicators, all 25 legacy region/section routes, public export, keyboard, dark mode, reduced motion and widths 320, 390, 768, 1280 and 1440 px.
- Macro source failures and publication refresh: 14 checks passed, including source identity rejection, null fixing, old acquisition, escaping injected source-error text, independent outages, keyboard retry and late-response guards.
- Pluang fund catalogue regression: 22 checks passed.
- Broad US/IDX market and representative retained model runs: 40 checks passed.
- Existing official Treasury interface: 19 checks passed.
- End-to-end investment workflow, original relationships and isolated complete-backup restoration: 53 checks passed.
- Static Pages artifact builds successfully with the public context file and no personal databases or validation artifacts.

The updated Quant precision-navigation harness passed 59 checks. Ten local-edition smoke checks passed, including the native IHSG chart and source history before 2018. Together with six browser checks of the versioned entrypoint, consistent module versions, public data paths and unchanged record addresses, the browser suites passed 373 checks.

Full published-universe verification passed 6,072 model combinations across 1,518 eligible histories, with no missing core instrument or invalid quote. There are 1,547 retained history files and 29 price-only or insufficient-history entries. These remain explicitly gated. This is a rerun against the retained public acquisition, not a claim of live prices or future model accuracy.

GitHub Pages was verified to serve UI files with `Cache-Control: max-age=600`. The build now versions the changed macro dependency graph, entrypoint and styles so a new page does not reuse the previous macro UI from the browser cache. Six browser checks passed with this graph. Ten financial/worker files remain byte-for-byte identical to their source, the manifest code hash matches the compiled mathematical files, and public macro data is unchanged by the versioning step. No page path or storage key changes.

The publication workflow and live site must be checked after push; pre-publication checks do not by themselves establish a deployed release. Those results are recorded in the final delivery and local validation artifacts. Unrun checks are not counted as passing.

## Remaining limits

This is not a real-time macro stream. Country depth is unequal: the expanded international comparison is annual, while more frequent policy, currency and activity coverage is narrower. Historical BI tables currently supply ten observations, not full long-run histories. Three aggregate series are missing as described above. No unsupported current national policy rate, non-US sovereign curve, CDS, institutional flow, nowcast, consensus or economic risk score is inferred. Free official endpoints can be delayed or unavailable, and data can be revised. The audit verifies specific calculations and workflows; it does not establish the absence of every possible bug.

## Exact changed files

UI: `macro-atlas.js`, `macro-ui.js`, `market-view.js`, `index.html`, `macro-context-ui.js`, `macro-context.css`.

Public-data acquisition and calculation: `macro-context-contract.js`, `macro-context-math.js`, `scripts/macro-context-data.mjs`, `scripts/audit-macro-context.mjs`.

Edition/publication wiring: `scripts/serve.mjs`, `scripts/build-pages.mjs`, `scripts/pages-asset-version.mjs`, `.github/workflows/pages.yml`.

Tests: `tests/macro-context.test.mjs`, `tests/macro-context-browser.mjs`, `tests/macro-context-errors-browser.mjs`, `tests/macro-cache-browser.mjs`, `tests/pages-asset-version.test.mjs`, `tests/quant-navigation-browser.mjs`.

This release report: `MACRO_DATA_DESK_RELEASE.md`. Generated public snapshots and validation screenshots are excluded from source commits and personal record stores.
