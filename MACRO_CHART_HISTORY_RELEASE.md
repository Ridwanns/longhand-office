# Macro charts and longer economic history

This change adapts the useful information hierarchy observed in Arthara's Macro overview and Economy tab: current readings, clear historical charts, and optional source/method detail. Office keeps its own interface and public datasets. No Arthara data, assets, code, nowcasts, scores, consensus estimates or backtests were imported.

## What changed

- The economic observatory presents six selectable annual indicators for 46 economies. World and euro area remain aggregates, not countries.
- A dedicated macro chart renderer uses calendar-based horizontal positions, rounded axis ticks, lighter grids, consistent typography, distinct negative GDP bars and explicit missing observations. Monthly, quarterly, annual and decision-date series keep their own cadence. Decision-date rates use steps between connected reported decisions.
- Mouse inspection, a keyboard/touch history slider, exact observation tables, and visible date coverage replace the generic Quant plotting interface in the additional macro desk. Quant's own plotting engine and calculations are unchanged.
- History controls offer 1, 5, 10 and 20 years plus all available observations. Ten years is the initial view. Opening all economic histories reveals separate plots and independent scales; it does not combine unlike units.
- Existing release-monitor charts and tables remain accessible in a collapsed section. Expanding chart collections survives responsive redraws.
- Shared chart imports participate in the existing Pages asset versioning so cached dependencies cannot leave this release partly installed.

## Verified source coverage

The World Bank WDI request now starts in 1960, with the same indicators, definitions, units and country identities. Its complete response was 4,275,325 bytes, one page and 18,216 rows, below the existing 5 MB collection limit. No country or date page was silently truncated.

The locally assembled snapshot contained 68,983 dated observations and 61,245 numerical observations across 293 series; 290 series have numbers. The independent source auditor compared all 68,983 observations with newly fetched official responses: 314 checks passed with no failures.

| Economy | GDP growth | Consumer inflation |
| --- | --- | --- |
| Indonesia | 1961–2025, 65 readings | 1960–2025, 66 readings |
| United States | 1961–2025, 65 readings | 1960–2024, 65 readings |
| Euro area | 1961–2025, 65 readings | 1960–2025, 66 readings |
| World | 1961–2025, 65 readings | 1981–2025, 45 readings |
| China | 1961–2025, 65 readings | 1987–2025, 39 readings |
| Japan | 1961–2025, 65 readings | 1960–2025, 66 readings |

Coverage reflects the snapshot collected on 18 October 2026 and may change on later official revisions. A requested year without a number remains null. Euro-area current account, world current account and world reserves have no supplied numbers. FRED-distributed US/ECB context still begins in 2000 where available; official BI policy/JISDOR tables provide only ten recent observations. These series are not reconstructed or spliced into longer histories.

This is latest-vintage official historical data, not a point-in-time release archive. It is not a real-time macro stream. Annual data never substitutes for a missing monthly or quarterly release.

## Preservation

No private schema, record key, export format, portfolio record, stored study, model input, cutoff or financial model calculation was changed. The original GDP/CPI contract and source acquisition remain intact. The longer annual dataset is public context in its existing independent file. Source histories can receive official revisions, while previously saved studies retain their original inputs.

## Files

UI: `macro-chart.js`, `macro-context-ui.js`, `macro-context.css`, `macro-ui.js`, `macro-atlas.js`.

Public context/history window: `macro-context-contract.js`, `macro-context-math.js`.

Edition integration: `scripts/build-pages.mjs`, `scripts/serve.mjs`, `scripts/pages-asset-version.mjs`.

Tests: `tests/macro-chart.test.mjs`, `tests/macro-chart-browser.mjs`, `tests/macro-context.test.mjs`, `tests/macro-context-browser.mjs`, `tests/macro-cache-browser.mjs`, `tests/pages-asset-version.test.mjs`.

## Validation record

All browser tests use fresh isolated contexts and TEST ONLY records. Personal browser data is not opened or restored. Generated audit logs and screenshots remain under ignored `validation/` rather than the public application artifact.

- 496 Node tests passed.
- 6 isolated local API tests passed.
- Existing macro navigation/coverage/responsive suite: 150 checks passed.
- Macro failure/retry/refresh suite: 14 checks passed.
- Shared asset cache/personal record-address suite: 6 checks passed.
- Existing Quant navigation and representative runs: 59 checks passed.
- Investment workflow, exact records and isolated complete-backup restoration: 53 checks passed.
- New long-history/chart inspection suite: 42 checks passed, covering pre-2000 data, original source values, keyboard controls, 320/390/768/1024/1101/1280/1440 layouts, light/dark themes, reduced motion, responsive disclosure state and private-record preservation.
- Total browser regression checks above: 324 passed with no uncaught application errors.
- Thirteen financial/storage/legacy-contract source files match the baseline after normalizing platform line endings. Nine source/build financial module pairs are byte-identical.

The Pages artifact and local edition were both opened successfully. Public deployment and post-deployment checks must be verified separately; a successful local build alone is not evidence of a live release.
