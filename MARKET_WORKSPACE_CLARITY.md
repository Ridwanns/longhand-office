# Markets and Research reading improvements

Validated locally on 17 October 2026. Branch `codex/market-workspace-clarity`.
The existing dirty working tree was preserved. HEAD remains
`6aca9b19cb5080823128160b0677d4a3adbea6cc`. No commit, merge or deployment was made.

## What changed

### Markets

US and Indonesian stocks now show Office-rendered history by default. The same
renderer supports existing index, bond ETF and commodity histories. TradingView
remains an explicitly loaded supplementary chart inside source details. It is not
loaded merely by entering the workspace. No authenticated TradingView data is
extracted.

The watchlist sits beside the instrument workbench on a wide screen and stacks on
smaller screens. The verified 950 pixel width cap was removed. The former large
widget above the watchlist and duplicate small detail chart were removed from the
default presentation. Existing research, model, valuation, refresh and watchlist
controls remain accessible.

Charts use actual dated source closes. Range and frequency controls select existing
observations rather than synthesizing prices. The closing price and date of the
history are explicitly distinct from a potentially newer quote. Charts include
keyboard and touch inspection, exact value tables, and source information.
Hidden charts wait until they have a measurable width. Resizing redraws the same
values at a legible size without requesting or fitting new observations.

The renderer does not change portfolio valuations or retained research inputs.
Bond ETF prices retain their identity as fund prices. Treasury yields retain their
separate official source and units.

### Global Macro

The geographic map reuses all 176 existing country boundaries. It now sits beside
readable selected-economy metrics and provenance. GDP bars and inflation history
have their own large panels below the map rather than a narrow sidebar chart.
On mobile those panels stack. The responsive redraw also works when resizing an
already open page.

The comparison surface shows connected economies and useful columns. Missing
individual observations remain unavailable, with accessible explanations. Unsupported
countries remain selectable with honest empty states. Coverage details explain the
missing connections. Table and Charts views avoid duplicating the corresponding
content below them. Tables scroll within their own bounded region and retain a
sticky header.

Indonesia's separate annual World Bank context is available alongside its short
BPS release histories. Annual history does not extend or replace the monthly and
quarterly source series. Map labels no longer imply that disconnected countries
have reported values.

GDP uses a zero baseline, negative observations remain visible, and missing periods
break an inflation line. No smoothing, interpolation, invented policy rates or
fabricated capital flows were introduced. The market pages use a restrained charcoal
dark palette. Chart text sizes were corrected where older CSS reduced their actual
screen size.

### Reading and punctuation

Technical separators were removed from prominent Research labels and Markets copy.
The location header uses two levels of text instead of a slash. Prices use words
such as “USD per share”. Research context uses labelled facts instead of a long
concatenation of tickers, source identifiers and timestamps.

Examples of presentation changes:

| Previous presentation | Current presentation |
| --- | --- |
| US / NVDA with a run version | NVDA research evidence |
| 2026-10-12 in the main research context | 12 Oct 2026 |
| 2026-Q2 on a macro chart axis | Q2 2026 |
| 20 / 20 | 20 of 20 |
| Volatility · GARCH / HAR | Volatility models |
| VaR / ES & exceptions | Tail risk and exceptions |
| ROLLING60 in the research assessment | 60 session rolling estimate |

Full timestamps, hashes, technical protocols and original machine values remain
accessible through audit disclosures and existing exports. Display helpers do not
rewrite saved studies. UTC is explicit when a retrieval time is shown. Raw chart
labels remain in chart payloads and exact source tables while axis dates and
inspection dates are easier to read.

The pale model-result heading on the light theme was also corrected. Risk values
now separate value at risk from expected shortfall with individual labels. Negative
signs, official ticker characters, scientific notation and meaningful mathematical
symbols remain intact. No blanket text stripping or document-wide rewriting was used.

## Files changed by this task

Presentation and interaction files:

- `advanced-ui.js`
- `data-status.js`
- `macro-atlas.js`
- `macro-visuals.js`
- `market-catalogue.js` — category label only
- `market-data.css`
- `market-terminal.js`
- `market-view.js`
- `prediction-ui.js`
- `quant-charts.js`
- `quant-navigation.js`
- `quant-ui.js`
- `research-lab.css`
- `research-lab.js`
- `research-layout.js`
- `ticker-summary.js`
- `ticker-ui.js`
- `workspace-shell.css`

Regression coverage:

- `tests/market-workspace-browser.mjs` — new suite
- `tests/market-inline-browser.mjs` — delegates to the native-chart suite
- `tests/macro-browser.mjs`
- `tests/macro-visuals.test.mjs`
- `tests/phase2-research-browser.mjs`
- `tests/phase3-workflow-browser.mjs`
- `tests/phase4-atlas-browser.mjs`
- `tests/phase5-market-data-browser.mjs`
- `tests/phase5-source-safety-browser.mjs`
- `tests/research-layout.test.mjs`

Tests that depended on old punctuation-delimited labels now verify separate ticker,
market, provider and source-hash facts. Checks of actual identity, values and hashes
were retained. Existing source controls nested in the new disclosure are opened
explicitly in the relevant regression.

This report is new. Ignored validation files contain screenshots, receipts, logs and
the source baseline. Earlier Phase 1–5 changes outside this list were left intact.
The server and Pages build scripts are unchanged relative to the task baseline.

## Validation results

All browser suites below ran after the final label and axis changes, in fresh
contexts on local port 4174 and on the locally served Pages artifact at
`http://127.0.0.1:4175/office/`. Only synthetic private records were inserted.

| Browser suite | Local | Pages artifact |
| --- | ---: | ---: |
| Phase 1 navigation | 128 passed | 128 passed |
| Phase 2 research | 102 passed | 102 passed |
| Phase 3 investment workflow | 53 passed | 53 passed |
| Phase 4 atlas | 51 passed | 51 passed |
| Phase 4 atlas error states | 12 passed | 12 passed |
| Phase 4 workspaces | 49 passed | 49 passed |
| Macro workflows | 86 passed | 86 passed |
| Scientific charts | 74 passed | 74 passed |
| Native market workspace | 58 passed | 58 passed |
| Phase 5 source workflows | 49 passed | 49 passed |
| Phase 5 source safety | 17 passed | 17 passed |
| Total | 679 passed | 679 passed |

There were no JavaScript exceptions in these final suite runs. The 1,358 browser
checks include legacy navigation, Back and Forward, refresh, page finder, source
handoffs, preserved studies, late response guards, record links, backup restoration,
corrupt-backup rejection, exact chart observations, keyboard inspection, touch,
reduced motion, theme changes and desktop/mobile widths down to 320 pixels.

Additional executed checks:

- `npm test`: 450 passed, zero failed or skipped.
- `npm run test:api`: 6 passed, zero failed or skipped.
- `node validation/phase2-numerical-replay.mjs`: 11 baseline/current numerical
  artifacts deeply identical, covering core forecasts, advanced models and valuation.
- `npm run build:pages`: successful, including 1,346 published histories. The build
  excludes databases, personal records, backend scripts and validation artifacts.
- SHA-256 comparison with the task baseline: 33 critical math, storage, contract,
  worker, backup, geometry and server/build files unchanged.
- Fresh-context visual inspection of the main local edition: Macro and stock history,
  desktop/mobile and market dark theme. Stock history and quote were independently
  dated. Main server continued serving the existing CSS asset successfully.

Receipts are in `validation/clarity-browser-release.json`,
`validation/clarity-preservation-final.json`, `validation/clarity-node-final.log`,
`validation/clarity-api-final.log`, `validation/clarity-numerical-final.log` and
`validation/clarity-build.log`.

## Preservation and known limitations

No database or IndexedDB schemas, saved model hashes, financial calculations, market
providers, original study cutoffs, source observations, storage keys or backup formats
were changed. No migration ran. The owner's browser profile was not used. The main
local server and its data directory were not restarted, reset or replaced.

An intermediate backup regression exposed an existing capacity limitation: the old
synthetic test backend had accumulated 140 completed runs and its archive was about
52.1 MB. Posting that archive exceeds the existing 50 MB local request limit and
surfaced a fetch failure. This UI task does not fix that existing large-backup limit.
The old test database was preserved. The final complete-workflow tests used a fresh
backend under `validation/clarity-isolated-backend` and passed export, isolated
restoration, relationship preservation and source-study hash checks. Very large local
archives still need a separate backup-capacity improvement.

Market histories remain dated public snapshots. A newer quote does not extend a
published history or imply that saved models use the newer price. This change does
not provide new real-time entitlements, providers or broader fundamental coverage.
FX native history is unavailable when no connected source exists; the optional
external chart remains available independently.

Current macro source coverage still has only two connected Indonesian quarterly GDP
and monthly CPI observations. Separate annual context spans 2020–2025. US and
European histories retain their longer existing observations. China and Japan,
policy-rate series and capital flows remain disconnected. No missing observations
were inferred. Optional TradingView embedding was regression-tested with a labelled
test frame; availability of a live external widget remains provider-dependent.

## Screenshots

All screenshot examples use actual existing public observations in fresh contexts.
The model example was generated in an isolated browser, not from private records.

- `validation/clarity-main-macro-desktop.png`
- `validation/clarity-main-macro-history.png`
- `validation/clarity-main-macro-dark.png`
- `validation/clarity-main-macro-mobile.png`
- `validation/clarity-main-stocks-desktop.png`
- `validation/clarity-main-stocks-mobile.png`
- `validation/clarity-models-desktop.png`
- `validation/clarity-models-reading.png`
- `validation/clarity-models-chart.png`
- `validation/clarity-models-mobile.png`

The screenshots verify presentation, not future market accuracy or freedom from every
possible bug. These changes remain local for review.
