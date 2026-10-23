# Macro refinement audit

19 October 2026. Local feature branch `codex/market-workspace-clarity`.

## Scope and verified fixes

- Neutral charcoal surfaces replace the navy monitor. Native line charts and positive bars use a consistent slate palette; negative bars retain a restrained clay colour. Grid lines, inspection markers and cursors are subordinate to the observations.
- Compact monitor inspection updates the persistent date/value readout above the plot. The floating popup no longer covers these small plots. Keyboard inspection, touch selection, Latest, full source precision and exact-observation tables remain available. Other chart views retain their tooltips.
- Repeated source links below the four readings and long acquisition paragraphs beneath each chart are consolidated into one collapsed Sources and methods section. Separate headline/history series still have an explicit visible warning. Missing, provisional and outdated readings retain their visible status.
- Evidence moves from the primary Macro tabs into More → Sources and methods. Its original deep link remains intact. No source ledger, download or analytical view was deleted.
- The repeated map economy dropdown is hidden in favour of the shared selector above the workspace. Its DOM ID and event listeners remain intact. Final browser checks confirm the shared selector updates Indonesia, US and France map selections and routes.
- Selected and hovered countries have crisp outlines without drop-shadow filters. Map magnitudes and thresholds are unchanged.
- France's selection locator previously used the centre of its multipolygon bounding box, placing the marker offshore. Locator coverage now uses the documented Natural Earth label coordinates for countries beyond the original ten locators. Existing ten coordinates and country boundary paths are preserved. The downloaded Natural Earth response SHA-256 matches the pre-existing documented hash `6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f`.

## Public data refresh and reconciliation

Five existing collectors ran in an isolated staging directory. Their output passed the existing schema validators before promotion into `.pages-data`. Collection completed on 19 October at approximately 02:45 WIB. No new provider was introduced.

| Snapshot | Registered series | Series with numeric observations | Source acquisition errors |
| --- | ---: | ---: | ---: |
| Macro monitor | 20 | 20 | 0 |
| Macro context | 293 | 290 | 0 |
| Regional releases | 124 | 116 | 0 |
| Extended rates and prices | 123 | 123 | 0 |

The Treasury snapshot contains 199 dated curve observations. Schema validation passed. Treasury rows were not included in the three independent reconciliation totals below.

Independent source reconciliation completed without discrepancies:

- Context: 293 series, 68,983 observations; 314 checks passed. Includes independent date-aligned liquidity and yield-spread arithmetic.
- Regional GDP/CPI releases: 124 series, 21,573 observations.
- Extended series: 123 series, 43,436 observations, independently re-parsed using Python CSV/JSON rather than the production Node projection.

These totals count stored source rows; they are not claims of distinct indicators or full coverage of every economy. Three context series and eight regional release series remain without numeric coverage.

The recollected observation values and periods did not change relative to the before-copy. New acquisition timestamps are not new economic releases. Reviewed release dates and inputs were not advanced. Acquisition success is not a real-time-data guarantee.

## Validation

- All 548 existing/new Node tests passed; no failures or skips.
- All six local API integration tests passed.
- The GitHub Pages/browser artifact built successfully with 1,547 published instrument histories. No personal records, database, backend scripts or validation files were included.
- Browser suites cover the direct monitor, placement, economic-data explorer, compact disclosures, annual cycle, legacy briefing, historical charts and the new visual audit. Fresh isolated browser contexts were used throughout.
- Seven count-based browser suites passed 410 checks; the separate annual-cycle suite also passed exact-value, year selection, keyboard, trajectory and responsive checks. Nine final layout/map-selector checks passed after hiding the duplicate selector.
- All 46 economy choices were exercised. The visual audit covers five Macro routes in light/dark themes at 1440, 768, 390 and 320 pixels, keyboard and touch inspection, source-menu access, map focus/expand/Escape, country identity, Back/Forward, refresh, reduced motion and synthetic storage preservation.
- Local Node edition: six additional browser checks passed, including the refreshed acquisition identity, Indonesia scope, mobile layout and absence of uncaught page errors.
- Public source arrays remain byte-identical through browser interactions. Test records were synthetic; actual investment records were not read, modified or reset.

Machine-readable logs and browser results are retained locally under `validation/macro-refresh-20261019/`. Screenshots are under `validation/`.

## Files changed

- `macro-context.css`: neutral palette, plotting presentation, consolidated provenance and secondary menu layout.
- `macro-context-ui.js`: monitor source consolidation; chart inputs and financial mathematics unchanged.
- `macro-ui.js`: secondary source navigation; existing destination attributes and URLs retained.
- `macro-atlas-labels.js`: documented geographic label coverage.
- `tests/macro-atlas.test.mjs`: mainland France/Norway coordinate regression.
- `tests/macro-briefing-browser.mjs`: secondary source-link label expectation.
- `tests/macro-chart-browser.mjs`: open the existing Other views menu before selecting annual history.
- `tests/macro-visual-audit-browser.mjs`: isolated visual/navigation/data-preservation checks.
- This audit document.

Only the five public snapshot files were refreshed outside tracked source. No database/IndexedDB schema changes, storage-key changes, record migration, model hash changes, portfolio calculation changes or historical research edits occurred. No merge, push or deployment was performed.

## Remaining limits

Published macro series have different frequencies, release lags and revision policies. Annual cycle observations are historical descriptions, not current-quarter estimates. Some economies lack comparable policy/yield instruments or a connected release series. Official BI tables supply only a short recent archive. Currency instruments without a native provider history remain unavailable rather than receiving synthetic data. The optional older analyses and exact tables remain accessible, so deliberately expanding them can still produce a long page. This audit establishes the stated checks, not the absence of every possible defect.
