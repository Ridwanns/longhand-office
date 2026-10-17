# Phase 3 — End-to-end investment workflow integration

Local review release, 17 October 2026. Branch: `codex/phase-3-investment-workflow`. HEAD remains `6aca9b1`. No commit, merge, push or deployment was performed. Phase 1 and Phase 2 pending changes remain in this branch; the file inventory below describes Phase 3 relative to the preserved Phase 2 working tree.

## Baseline and preservation

Before editing, the existing implementation passed **358 Node tests**, **6 local API tests**, and **97 Phase 2 browser assertions** in a fresh isolated context. Its Pages build succeeded with **1,346 published histories**. Four primary workspaces and the six Research Lab sections were inspected and exercised. No critical predecessor regression blocked implementation.

All **24 pre-existing modified/untracked files** were preserved in ignored `validation/phase3-before.zip`, with the original diff and working-tree inventory. Hashes of **104 existing runtime/style files** were captured in `validation/phase3-baseline-files.json`. The pre-existing `PLUANG_DATA_TRIAL.md` remains unchanged.

Testing used new browser contexts, port 4174, the locally served Pages artifact on port 4175, and clearly labelled TEST ONLY investment records. No owner's browser profile, portfolio records or vault workspace was used. The port 4173 server was restarted only after its analysis-job summaries showed zero queued/running jobs, to expose the new module through the updated allowlist. That preview was not migrated or reset.

## Workflow before and after

Before: Phase 2 already carried a Markets ticker into Research Lab and exposed a brief-based Paper flow. Individual archives had their own controls. The standalone thesis-to-decision button selected the thesis but did not carry its retained research evidence/context into the new decision. The guided flow excluded Real portfolios. Portfolio pages did not expose their associated decision/review links, and a journal thesis link returned to the whole thesis list.

After:

1. **Markets → Research Lab:** a direct “Research this instrument” action carries the selected ticker, market and available observation metadata.
2. **Research → Valuation:** a context action opens the existing Company Valuation section. It does not recompute or convert a market quote into model input.
3. **Research → Thesis:** displayed briefs, displayed valuation/model studies and each of the six Saved Research archive types can open the original thesis editor. Investment arguments remain blank for the user. Opening saves nothing.
4. **Thesis → Decision:** the existing button now carries the thesis ID, evidence, assumptions, reports, horizon, invalidation conditions, review date, existing research context and immutable core references. Decision reasoning and expected outcome remain user-written.
5. **Decision → Portfolio:** users explicitly choose a labelled Paper or Real portfolio. Context-bearing handoffs exclude incompatible currencies. No transaction is created by association.
6. **Portfolio → Review:** associated theses, decisions and review sections have direct internal links. Reviews append through the original editor and preserve previous expectations/history.

The existing optional flow now has an explicit Paper/Real selector. It offers only compatible portfolios in the chosen group. Its transaction shortcut remains Paper-only; Real transactions are manually recorded through the existing Real portfolio editor. The chosen decision's portfolio group remains fixed in the flow. Creating a portfolio, entering a trade and recording a review are optional actions, not mandatory steps.

Independent thesis/decision creation remains available. Research does not require a portfolio, and decisions do not require transactions.

## Identity, provenance and storage design

Navigation context is a **one-time in-memory handoff**, separate from immutable study identity. It carries ticker, market, supplied currency, source/provider, observation/retrieval dates, observation type and intended destination. Missing metadata remains missing. The Research header distinguishes the arriving Markets observation from retained model inputs and their cutoff.

The existing version-1 `researchContext` and existing `analysisRefs` contracts are reused. No new record fields, database versions or backup formats were introduced. Core evidence retains its exact run ID, cutoff, model version and result hash. Other archive identities, original settings, available hashes and source metadata are retained in the existing evidence text, with internal links back to their original archives. These prose references are not a new relational integrity contract. Manual descriptive asset labels are not silently treated as verified tickers.

New read-only routes:

- `#theses/<id>` and `#theses/<id>/reviews`
- `#decisions/<id>` and `#decisions/<id>/reviews`
- `#quant/study/<advanced|valuations|predictions|tickers|manual>/<id>`

Existing `#quant/run/<id>` and every legacy workspace/section route remain supported. Study links delegate to existing archive handlers. A missing study is reported without selecting a replacement. Forecast links open the existing registry; registration timing, settlement and scoring rules are unchanged.

Archive/evidence reads use the existing interaction-generation guard, current URL and connected DOM identity. Delayed results cannot open an editor after a newer research action. Ticker archive recovery now also yields as soon as a user focuses or presses within the input form, preventing a retained ticker from being inserted during new typing. The instrument suggestion directory still loads after recovery is guarded. Observers, original DOM IDs and model handlers are retained.

## Exact Phase 3 files

| File | Purpose |
| --- | --- |
| `app.js` | Read-only record/review routes, associated records, safe thesis-to-decision seeding, original editor handoff |
| `investment-flow.js` | Explicit Paper/Real mode, compatible portfolios, optional Paper transaction, record links |
| `market-terminal.js` | Direct research action and source observation metadata |
| `research-lab.js` | Study evidence actions, retained-study deep links, context/failure display |
| `research-layout.js` | Optional provenance in the one-time instrument handoff |
| `ticker-ui.js` | Guard pending archive recovery when input use begins |
| `ticker-summary.js` | Explain the optional Paper/Real handoff without requiring transactions |
| `workspace-shell.js` | Carry selected market observation into Research |
| `workspace-navigation.js` | Resolve record/review deep links to the correct workspace |
| `rooms.css` | Small scoped relationship/review styles and focus treatment |
| `scripts/serve.mjs` | Allowlist the new continuity module |
| `scripts/build-pages.mjs` | Include the same module in Pages |
| `workflow-continuity.js` — new | Pure route, portfolio filtering, evidence and relationship helpers |
| `tests/workflow-continuity.test.mjs` — new | 13 unit tests for identity, provenance, modes/currencies and unchanged inputs |
| `tests/phase3-workflow-browser.mjs` — new | Complete optional workflow, records, reviews, restoration and responsive checks |
| `tests/workflow-async-browser.mjs` — new | Deliberately delayed real archive/core responses |
| `tests/phase1-navigation-browser.mjs` | Adapt old submenu interactions to the existing Phase 2 finder/mobile selector; retain all 128 assertions |
| `PHASE3_INVESTMENT_WORKFLOW.md` — new | This implementation and validation report |

## Validation executed

Final **371 Node tests passed**, zero failures. **6 local API tests passed**, zero failures. An independent replay deeply compared **11 complete baseline/current numerical artifacts**, including parameters, scores and arrays: four core cases, four advanced cases and three USD/IDR/missing-input valuation cases. All were identical.

**18 engine/contract/storage files remain byte-identical to the Phase 3 baseline**: `model.js`, `quant-math.js`, `advanced-math.js`, `atlas-math.js`, `research-math.js`, `auto-valuation-math.js`, `prediction-math.js`, `quant-contract.js`, `quant-history.js`, `analysis-contract.js`, `office-storage.js`, `ticker-storage.js`, `advanced-storage.js`, `continuity-store.js`, `complete-backup.js`, `scripts/local-store.mjs`, `pages/browser-api.js`, `pages/browser-worker.js`.

| Browser suite | Local | Built Pages |
| --- | ---: | ---: |
| Phase 3 end-to-end workflow | 53 | 53 |
| Delayed archive / evidence response guards | 7 | 7 |
| Phase 2 Research Lab regression | 97 | 97 |
| Phase 1 navigation regression | 128 | 128 |
| Workspace shell | 99 | 99 |
| Inline market views | 58 | 58 |
| Scientific charts and retained advanced results | 74 | 74 |
| Existing Paper workflow and complete restore | 40 | 40 |
| Total | **556** | **556** |

All **1,112 selected browser assertions passed**, with no page-level JavaScript errors in the successful runs. This is selected regression coverage, not a claim that every historical browser test file ran. Third-party TradingView frames were stubbed only inside test contexts; live data delivery/entitlements were not certified.

The NVDA workflow tested exact saved model/valuation recovery, distinct Paper/Real decisions without trades, original thesis evidence, appended outcome reviews, read-only review deep links, Back/Forward, refresh and byte-preserved records. Mobile restoration could append a further review while the original source and restore-target workspace stayed intact. Layouts were checked at 320/390/768/1440 px in the new workflow, with broader widths covered by existing suites. Keyboard review navigation and reduced-motion behavior were exercised.

The original Paper suite independently checked: buying 2 shares at 100 with fee 3 leaves cash **797**, cost **203**, fee **3**; selling 1 at 110 with fee 1 leaves cash **906**, remaining cost **101.5**, realized profit **7.5**, total fees **4**. Overselling was rejected. These accounting formulas were not edited.

Complete backup export/validation and restoration into a separate workspace preserved IDs, contexts, reviews, hashes and valuation studies. No existing workspace was replaced. The final Pages build succeeded with 1,346 existing histories. Asset bytes and relative imports were checked; no database files entered the artifact. `git diff --check` passed.

## Failures investigated

- The existing Paper browser workflow exposed a genuine pending ticker-recovery/input race (`US:NVDAAAPL`). Input-use guards fixed it. A deterministic delayed-IDB test now verifies both the typed value and absence of an old source replacement.
- The older Phase 1 browser test attempted to click the intentionally hidden Research submenu introduced in Phase 2. It now uses the implemented finder/mobile section selector; all 128 original assertions pass in both editions.
- New test harness issues were corrected: checking the actual disabled option property, waiting for both a retained valuation and its section to finish opening, and scoping the currency selector to the editor instead of a second mounted research form. No business or numerical assertion was removed.

No known introduced regression remains in the executed coverage.

## Remaining limits and stop boundary

This phase organizes and connects existing capabilities. It does not add real-time feeds, improve fundamental coverage, establish forecast accuracy, infer FX rates, change adjustment conventions, or add trading. The original limits and local/server-wide scope of archives remain. Large local archives can make complete backup verification/restoration take noticeably longer.

Non-core evidence references use existing prose rather than a newly validated foreign-key schema. Their study archive must be retained or restored to reopen the original artifact; the complete backup includes those archives. Forecast navigation opens the existing registry, not a new forecast detail page. The optional flow's progress remains session-based; saved record links and reviews persist independently after it is closed.

Active-storage encryption, hosted authentication and synchronization remain outside this phase. Local SQLite and Pages IndexedDB differences are preserved. No schema migration, record reset, source-provider change or mathematical change occurred.

Screenshots: `validation/phase3-decision-desktop.png`, `validation/phase3-portfolio-mobile.png`. Machine-readable successful test checks: `validation/phase3-final-receipt.json`. Baselines, receipts and screenshots remain ignored under `validation/`.

**Stop after Phase 3. No Phase 4 visual redesign, Pluang integration, merge or deployment was started.**
