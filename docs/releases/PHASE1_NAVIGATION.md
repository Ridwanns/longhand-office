# Phase 0 + 1 — safe global navigation restructuring

Local review release, 16 October 2026. Branch: `codex/phase-1-navigation`. Baseline: `6aca9b1`. No merge, deployment, provider addition or trading capability.

## Baseline

- Started on main at `6aca9b1`, with no tracked modifications. The existing untracked `PLUANG_DATA_TRIAL.md` was retained unchanged (SHA-256 `3A6FA25163E4D5F1789E5CCAD592265FAA07B4C994C5ACA74C207CD9B1DBAFF9`).
- Existing Node suite: 350 passed, zero failed. Local API suite: 6 passed, zero failed.
- Original workspace browser suite: 99 assertions passed locally and 99 against the built Pages edition, in fresh contexts with synthetic records.
- Existing Pages build succeeded with 1,346 published histories. No acquisition or publication workflow was run.
- Baseline navigation: 13 destinations across Workspace, Market data, Investment, Research and Your workspace. Quant retained its independent 22-section navigator.
- Baseline routes: `#overview`, `#market`, `#market/us`, `#market/idx`, `#market/bonds`, `#market/commodities`, `#market/macro`, nested Macro region/view/country routes, `#portfolios`, `#portfolios/real`, `#portfolio/<id>`, `#theses`, `#decisions`, `#library`, `#records`, `#quant`, and `#quant/run/<id>`.

## Result

Four stable primary links: Overview, Markets, Research Lab and Portfolio. The selected workspace exposes its contextual destinations. Records & Backups, actual Macro source information, and existing preferences are secondary.

- Overview retains daily summary, recent research, portfolio completeness, reviews and the courtyard. No Overview redesign or new financial aggregate.
- Markets exposes US stocks & ETFs, Indonesia, Macro, Bonds and Commodities.
- Research Lab exposes instrument research, Quant Lab, company valuation, theses, Research Library, saved core studies and advanced tools. The finder also links directly to each existing archive, registered forecasts, decision calculators and Atlas references.
- Portfolio exposes Paper, Real, the decision journal and the existing review queue. Portfolio details remain accessible through existing record links, with Real/Paper selection retained.
- Preferences expose the existing theme control, study-view control and US watchlist editor. There is no new Settings service or general Data Sources capability. Source information opens the actual Macro source ledger; other source notes remain within their original views.

New `#quant/section/<key>` links use the existing `data-quant-jump` buttons after the current page mounts. They open the existing disclosures and switch existing modes as needed. They do not refit a model. While already on a Quant page, global shortcuts navigate in place without replacing its run URL or mounted form inputs. Full legacy links, native anchor modifier-click behavior, refresh, and browser Back/Forward remain supported.

The finder recognizes valuation/DCF/FCFE, quant, forecast/prediction, options/Greeks, research, portfolio/holdings, backup/export/import/restore, and existing preference terms. Search indexes implemented destinations, not private record contents.

## Scope and preservation

- No financial engines, model versions, result hashes, price-source calculations, database schemas or IndexedDB schemas were modified.
- No migration, browser-storage reset, historical input/cutoff modification, data-provider change, Pluang integration or order execution.
- The source changes are navigation metadata, the shell, one post-mount hook in the existing renderer, narrowly scoped navigation CSS, and the two module allowlists.
- Existing Quant DOM IDs, listeners, observers and interaction guards remain in place. Quant's own sidebar and long-page organization are intentionally retained for a later phase.
- Seventeen existing engine/contract/storage files were compared with the baseline and were identical after line-ending normalization. No model, storage or backup implementation changed.
- Owner records were not used. Tests ran in fresh contexts on isolated local port 4174 or static artifact port 4175. The local servers were restarted only after checking that no jobs were queued/running.
- Local Node jobs/SQLite and browser jobs/IndexedDB remain different editions. Local Flowless/MSN and public published snapshots retain their existing differences. The new module is explicitly allowlisted in both editions.

## Validation

Final Node suite: **354 passed, zero failed** (350 existing plus four navigation metadata tests). Local API: **6 passed, zero failed**.

| Browser suite | Local 4174 | Built Pages artifact |
| --- | ---: | ---: |
| Workspace shell | 99 | 99 |
| Phase 1 navigation | 128 | 128 |
| Investment workflow / isolated complete restore | 40 | 40 |
| Scientific charts / retained models | 74 | 74 |
| Existing Quant navigation | 59 | 59 |
| Inline market charts | 58 | 58 |
| Encrypted backup / isolated restoration | 23 | 23 |
| Total assertions | **481** | **481** |

All **962** final browser assertions passed, with no page-level JavaScript errors in those runs. This is selected regression coverage, not a claim that every browser test file or every live provider was exercised.

Navigation coverage includes every legacy route family, synthetic Paper/Real detail links, 25 Macro region/view paths, 11 new section links and their refresh behavior, actual finder destinations, Back/Forward, keyboard/touch access, drawer focus with closed/open Preferences, desktop/mobile widths 320–1440 px, and reduced-motion behavior. Retained core and advanced results remain identical while global shortcuts switch sections; no additional core job is submitted.

Existing Python checks also passed: Atlas parity 20 tests; public snapshot cache 5 tests; valuation cash-flow collector 4 tests; research reference 21 independent checks across 17 cases. The cash-flow test initially lacked pandas in the system Python and was rerun successfully in the existing `.tools/yfinance` environment; no dependency was added.

The encrypted-backup browser test was originally Pages-specific. Its first local run rejected legitimate loopback API POSTs. It now selects the correct local records namespace and permits only explicit same-origin local analysis/backup/restore routes; external private writes and passwords in POST bodies remain rejected. It passed again in both editions. This changed the test harness, not the backup implementation.

## Files

Runtime/build: `app.js`, `workspace-shell.js`, `workspace-shell.css`, new `workspace-navigation.js`, `scripts/serve.mjs`, `scripts/build-pages.mjs`.

Tests: `tests/workspace-shell-browser.mjs`, `tests/simple-office-browser.mjs`, `tests/encrypted-backup-browser.mjs`, new `tests/workspace-navigation.test.mjs`, new `tests/phase1-navigation-browser.mjs`.

Documentation: this file. Detailed receipts, logs, preservation hashes and screenshots are ignored under `validation/` and are excluded from the Pages artifact.

## Review boundary

Stop after Phase 1. No work on Research Lab internals, saved-archive consolidation, new providers, Pluang, trading, schema migration or deployment. The selected regression tests do not establish universal absence of bugs, real-time market entitlement, authentication or cross-device synchronization. Review the local branch before approving the next phase.
