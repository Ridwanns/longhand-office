# Phase 2 — Research Lab restructuring

Local review release, 17 October 2026. Branch: `codex/phase-2-research-lab`. No commit, merge, push or deployment was performed. Phase 1's pending work is still present; the changes described here are relative to the preserved Phase 1 working-tree snapshot.

## Baseline and preservation

Before editing, the Phase 1 implementation passed 354 Node tests, 6 local API tests and 128 navigation browser assertions in a fresh isolated context. Its Pages build succeeded with 1,346 published histories. There was no known critical Phase 1 regression blocking this phase.

All 13 pre-existing changed/untracked files were captured in ignored `validation/phase2-before.zip`, including the original working-tree diff. Hashes were recorded for 101 existing runtime/style files. `PLUANG_DATA_TRIAL.md` remains byte-identical (SHA-256 `3A6FA25163E4D5F1789E5CCAD592265FAA07B4C994C5ACA74C207CD9B1DBAFF9`).

Eighteen existing engine/contract/storage modules remain byte-identical to that baseline: the portfolio, core, advanced, Atlas, research-toolkit, automatic-valuation and prediction mathematics; core history/config/analysis contracts; Office/ticker/advanced/continuity storage; complete backup; SQLite store; and browser API/worker. No schema, artifact format, model version, financial calculation, provider or historical input/cutoff was changed. No user records were migrated or reset.

## Before and after

Before: one long Quant page with the ticker desk, brief, model results, automatic valuation, calculators, toolkit, forecast registry and several archives; 22 exposed precision-navigation destinations in Advanced mode.

After: six focused, URL-addressable sections over the same original mounted components:

1. **Research overview** — selected instrument/company, original ticker source and historical statistics, Investment brief, source/freshness information, official financial evidence where available, and retained-stock comparison.
2. **Quantitative models** — original core settings/results, seven-model advanced comparisons, volatility, regimes, risk, simulations, conditional HAR/Kalman evidence and registered forecast validation. Unavailable inputs/models keep their original explanations.
3. **Company valuation** — original earnings/eligible FCFE valuation, actual input periods, editable assumptions, existing stress scenarios, original exports and a link to saved valuations.
4. **Investment thesis** — existing brief evidence and a reviewed handoff to the original thesis editor; links to existing theses and Research Library. No new argument, portfolio or decision is generated.
5. **Saved research** — a filtered discovery index reading all six existing archives through their original APIs: core runs, advanced studies, forecasts, valuations, manual studies and ticker studies. Original archive/export controls remain available in a disclosure.
6. **Advanced tools** — original decision calculators, options/Greeks/IV, fixed income, portfolio risk and historical Atlas references. Reference studies remain explicitly historical, separate from fresh fits.

The six-section desktop navigator and mobile section selector remain available while scrolling. The original 22-section controls remain in a collapsed **Detailed section shortcuts** disclosure for precise legacy navigation. The overlapping global Research submenu is hidden only while the actual Research Lab is mounted; it remains available on the Library and thesis pages. The global finder is preserved.

## Context, routes and lifecycle

- Selecting a US/IDX instrument in Markets and explicitly opening Research Lab passes a validated, one-time, in-memory market/ticker intent. The original automatic ticker workflow loads its own documented published data/cutoff. A market quote is not silently substituted for model inputs.
- No handoff is put in records or browser storage. Modifier-click behavior is left to the real link.
- New views use `#quant/view/<view>` or `#quant/run/<id>/view/<view>`. Original `#quant`, `#quant/run/<id>` and Phase 1 `#quant/section/<key>` URLs remain supported.
- Section changes retain the mounted form elements and exact core/advanced artifacts. Browser history records the prior view, including the original bare run URL. Back/Forward between views does not remount the desk.
- Explicit legacy run links recover their own model panel after another retained ticker hid it or an independently opened advanced study changed the visible artifact.
- The submit-acceptance callback checks the currently mounted run ID, so switching sections before a response cannot strand a valid run merely because the URL gained a view suffix.
- Saved-index reads are generation-guarded and do not write to any archive. Each Open action delegates to the existing saved-study handler, or the original retained core-run link. Each study retains its original source/parameters/results; no databases are consolidated.
- Original DOM IDs are unique and retained. The original Quant observer still watches `.quant-content`; legacy precision controls sit outside that observed subtree to avoid self-triggering updates. New observers disconnect on unmount and observe only existing result/brief nodes.
- The context header distinguishes the active instrument from separately retained valuation and advanced-study identities and dates.

## Validation executed

Final **358 Node tests passed**, zero failed. **6 local API tests passed**, zero failed.

An independent before/current replay deeply compared **11 complete numerical artifacts**, including their parameters, scores and generated arrays:

- Four core cases: 5/20 sessions × seeds 7/19.
- Four advanced cases: 350/700 observations × 5/20 sessions, with supplied OHLC and a matched benchmark fixture.
- Three valuation cases: USD earnings/FCFE, unavailable loss-making inputs, and separate IDR arithmetic.

All outputs were identical to the original engines loaded from baseline commit `6aca9b1`; the engine files also match the Phase 1 working-tree hashes. Replay receipts include SHA-256 hashes.

| Browser regression suite | Local 4174 | Built Pages artifact 4175 |
| --- | ---: | ---: |
| Research Lab, context and saved studies | 97 | 97 |
| Existing investment workflow / isolated complete restore | 40 | 40 |
| Scientific charts and immutable advanced results | 74 | 74 |
| Global workspace shell | 99 | 99 |
| Inline market charts | 58 | 58 |
| Total | **368** | **368** |

All **736** selected browser assertions passed, with no page-level JavaScript errors in those successful runs. This does not claim that every historical browser test file was executed. External TradingView frames were stubbed only in isolated browser tests; no provider/live-data entitlement was newly certified.

Coverage includes six panes, all legacy workspace route families, 11 legacy Quant section links, correct Markets-to-Research context, rapid US/IDX selection, exact saved valuation/advanced restoration, original manual-study recomputation, unsaved form continuity, no extra jobs on navigation, Back/Forward/refresh, record byte preservation, complete backup/isolated restore, light/dark UI, reduced motion and all six views at widths 320/390/768/1024/1440. The scientific suite separately checked chart units, exact values, labels, interactions and widths through 1600 px.

The final Pages build succeeded with 1,346 existing published histories. Relative module imports resolved, new research assets matched their source, and no SQLite/database, backend or validation directories entered the artifact. Local and Pages storage/source differences remain intact. No data-publication workflow was run.

## Failures found and corrected

- Back initially defaulted a bare legacy run URL to Models instead of restoring the previous Overview view. Browser-history view state now preserves that distinction.
- An overly broad section-link selector also matched the Lab root and intercepted ordinary panel buttons. It now matches actual navigation anchors only.
- Moving the old navigation inside its observed content subtree could create repeated observer updates. Precision controls are now outside that subtree.
- An explicit retained-run link could otherwise reuse a hidden model panel after opening another saved ticker. Such links now recover the original run as required.
- Existing workflow tests were adjusted for the new six-section interface while retaining their business, record and backup assertions. The scientific screenshot step now waits for its existing resize debounce before scrolling a redrawable chart node; mathematical assertions were retained.

No known introduced regression remains in the executed coverage.

## Exact Phase 2 files

Existing runtime/build files changed: `app.js`, `index.html`, `quant-ui.js`, `quant-navigation.js`, `ticker-ui.js`, `workspace-shell.js`, `scripts/serve.mjs`, `scripts/build-pages.mjs`.

New runtime/style files: `research-layout.js`, `research-lab.js`, `research-lab.css`.

Existing tests updated: `tests/simple-office-browser.mjs`, `tests/scientific-charts-browser.mjs`.

New tests: `tests/research-layout.test.mjs`, `tests/phase2-research-browser.mjs`.

Documentation: this file. Logs, baseline snapshots, replay artifacts, browser receipts and screenshots remain ignored under `validation/`.

## Limits and stop boundary

Saved research is a discovery layer, not a merged database. Core summaries retain their existing local-server-wide archive scope and limits; browser/auxiliary archives retain their previous scope and capacity. There is no pagination or new storage capacity policy. A failed archive read is reported as incomplete coverage, not an empty successful archive.

Market snapshots, fundamental coverage, historical reference vintages, authentication, active-storage encryption and device synchronization retain their previous limitations. Fresh CAPM/Fama–French inputs are still unavailable; conditional models are not made available by navigation alone. Original thesis/decision workflows are reused, with no new workflow engine or trading integration.

Stop after Phase 2. Phase 3 workflow integration, Pluang, new providers, schema migration and hosting/deployment require a separate approved scope.
