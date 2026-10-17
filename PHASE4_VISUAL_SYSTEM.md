# Phase 4 — Institutional visual system and Global Macro atlas

Implemented locally on `codex/phase-4-macro-visual-system`. Git HEAD remains `6aca9b1`. No commit, merge, push or deployment was performed. This report separates implemented behavior from coverage limits; it does not assert that every possible bug is absent.

## Baseline and preservation

The existing Phase 1–3 work was inspected before editing. The four-workspace shell, six Research Lab sections, legacy deep links, investment handoffs, saved-study recovery, Records and complete backup implementations were verified in source and exercised in the regression suites below.

The initial working tree already contained 33 modified or untracked files. They were retained, with a recoverable ignored snapshot in `validation/phase4-before.zip`. A separate inventory recorded SHA-256 hashes for 105 runtime/style files. The before screenshots include the actual local application and a reconstructed static baseline whose 105 runtime/style files were matched byte-for-byte to that inventory. These are application captures, not generated mockups.

Twenty-five protected files match their pre-Phase-4 hashes, including mathematical engines, contracts, storage adapters, backup implementation, browser worker, investment context, and geographic boundaries. `PLUANG_DATA_TRIAL.md` also retains its original hash. There was no data migration, schema change, storage reset, model-hash change, historical observation edit or provider change. Tests use fresh browser contexts, ports 4174/4175 and synthetic records labelled TEST ONLY. The owner's port 4173 investment records were not used as test fixtures.

## Implemented design system

The supplied Global Macro concept is the primary reference for composition: map at left, selected economy at right, and a cross-economy matrix below. Shared styling follows its editorial typography, fine dividers, compact controls, restrained geographic colors and clear active states. It retains Longhand branding and the original architectural courtyard rather than introducing a different product identity.

| Foundation | Light | Dark |
| --- | --- | --- |
| Page | `#f4f3ef` | `#161c20` |
| Panel | `#fcfcfa` | `#1d2529` |
| Ink | `#202d30` | `#e4e8e4` |
| Muted text | `#626b6a` | `#a4b0b2` |
| Divider | `#dedfda` | `#354148` |
| Accent | `#315a63` | `#9bbdb6` |
| Bronze | `#8c7452` | `#c0a57b` |

Georgia headings, Segoe UI interface text, tabular numbers, small corner radii and consistent spacing refine existing components. Tables and meaningful charts remain central. No new chart library, animation library, font service, WebGL renderer or other third-party dependency was introduced.

- **Overview:** real workspace counts, current research and due reviews precede the courtyard visually. All five architectural rooms remain available. Test, error and recovery notices remain ahead of operational content.
- **Markets:** existing tables, selected instruments, inline provider frames, dates, currencies, quote freshness and research handoff remain intact, with a consistent visual treatment.
- **Research Lab:** all six existing sections and mounted forms/listeners remain. Scientific charts receive restrained grid, type and palette refinements. Historical observations, forecasts, confidence intervals and diagnostics retain their original definitions and values.
- **Portfolio:** existing cash, remaining recorded cost, supplied valuations, allocation, ledger, decisions and reviews remain. Paper and manually recorded Real portfolios remain separate. No broker synchronization or unsupported return series is implied.
- **Navigation:** the original four workspaces, finder, secondary navigation, mobile menu and deep links remain. The existing courtyard artwork is reused faintly in the desktop sidebar.

## Motion and interaction

`motion-system.js` provides a small native Web Animations helper. It reveals a changed panel with opacity and a 4px translation over 180ms, cancels a prior reveal on the same element, and cancels active reveals when reduced motion is enabled. It does not tween numbers or alter chart paths.

Native view transitions coordinate workspace content and the active navigation indicator where supported. Root transitions last 140/180ms; the fallback uses the same reveal helper. Chart reveals affect opacity only, and the courtyard has one short entrance. Pointer interaction is not blocked by the transition overlay. Hover, selected-row, focus and press treatments are scoped and consistent. Reduced motion disables decorative transitions and animations.

Map-to-panel selection, tooltip inspection and comparison-row highlighting supply the technical interaction character. There are no sound effects, particles, continuous rotation, neon overlays, artificial price motion or branded cinematic assets. Existing Research completion, scenario controls and disclosures are reused rather than adding a second analytical interaction system.

## Global Macro atlas

The atlas reuses all **176 existing Natural Earth country paths**, unchanged. Singapore is represented by the existing point locator, not an invented country polygon. The original cartographic resolution is retained. Static label anchors are taken from Natural Earth's label coordinates and projected into the existing equirectangular view box; source and hash information are documented in `macro-atlas-labels.js`.

Natural Earth geographic data is public domain: [terms of use](https://www.naturalearthdata.com/about/terms-of-use/). No terrain imagery or fabricated topographic detail was added.

Implemented controls:

- Country selector, distinct regional-series selector, supported-country map controls and economy shortcuts.
- GDP growth, inflation, policy rate and 10-year yield views; unavailable series are explicit.
- Map, accessible table and chart presentations; 1Y, 3Y and all supplied history.
- User-controlled zoom, reset and drag when zoomed. Selection retains the viewport.
- Keyboard country controls, Enter/Space selection, arrow-key focus, plus/minus zoom and Home reset. The country selector provides an alternative for small or unsupported geographies.
- Selected-economy summary, historical chart, exact observation table, source/method disclosure, cross-economy matrix, and coordinated inspection highlighting.
- Selection and display state in browser history state only. Existing supported-country URL formats, refresh and Back/Forward behavior remain.
- Mobile layout puts country controls and selected-economy information before the map, with readable tables as an alternative. Existing mobile navigation remains available.

Only seven countries have connected country-level GDP series: the US and the existing six ASEAN economies, including Indonesia. Euro area and World observations appear as regional series, never as single country geometries or values painted onto member countries. China and Japan are selectable but explicitly unconnected. All other unsupported coverage stays grey.

The data adapter consumes the existing validated macro snapshot and official Treasury file. It neither acquires a new provider nor computes new financial indicators. A missing latest observation remains missing, rather than falling back to an older value. Each observation keeps its original period, unit, frequency, source, retrieval timestamp and status. Outdated, estimated and provisional observations remain labelled. Map color bins describe magnitude, not a trading signal.

Existing Indonesia coverage contains two quarterly GDP and two monthly CPI observations. The US and euro area have longer existing histories, while the connected World Bank series are annual. The interface displays those actual differences rather than extending short histories or pretending periods align. The cross-economy matrix explicitly warns that latest observations are not a common-period ranking.

The original full Macro context remains under **Detailed observations, sources & methods**. Original Economy, Rates & currency, Markets & flows, Sources, refresh behavior and thesis-note workflow remain available. The note action is accurately labelled as GDP/inflation evidence and is disabled when an unsupported map country is selected, so another region's evidence cannot be prepared accidentally.

## Components reused

The existing workspace shell, page finder, courtyard SVG, theme preference, market board, inline TradingView integration, `macroChart`, `lineFigure`, macro data contracts, Natural Earth paths, Research Lab layout, model outputs, portfolio ledger, valuation forms, thesis/decision editors and complete backup pipeline are retained.

`macroChart` gains an optional presentation limit for showing all supplied atlas history. Its original default remains 16 observations, and existing chart arithmetic is unchanged. Models, forecasting, validation, accounting and provider acquisition modules were not restructured.

## Exact Phase 4 file inventory

Existing runtime/build files changed in this phase:

1. `app.js` — operational Overview heading/order integration and native motion fallback; courtyard title hierarchy.
2. `index.html` — loads the two scoped visual stylesheets.
3. `market-terminal.js` — Global Macro page heading and description.
4. `macro-ui.js` — atlas mounting, retained detailed context and accurate evidence-note scope.
5. `macro-visuals.js` — optional display limit, preserving the existing default.
6. `theme.js` — theme-color metadata aligned with the refined themes.
7. `scripts/serve.mjs` — serves the six new runtime/style assets.
8. `scripts/build-pages.mjs` — includes the same assets in the browser edition.

New runtime/style files:

9. `office-visual-system.css`
10. `motion-system.js`
11. `macro-atlas.css`
12. `macro-atlas.js`
13. `macro-atlas-data.js`
14. `macro-atlas-labels.js`

Existing browser tests adjusted:

15. `tests/macro-browser.mjs` — opens the retained detailed-context disclosure before inspecting its original controls; all 86 assertions retained.
16. `tests/workspace-shell-browser.mjs` — uses visible atlas readiness; all 99 assertions retained.
17. `tests/market-inline-browser.mjs` — disclosure readiness and the actual new dark token; all 58 assertions retained.
18. `tests/encrypted-backup-browser.mjs` — uses a temporary file for uploads above Playwright's in-memory upload limit, deleting only its own generated files afterwards; all 23 assertions retained.

New tests and report:

19. `tests/macro-atlas.test.mjs` — 11 pure presentation/data-adapter tests.
20. `tests/phase4-atlas-browser.mjs` — atlas geography, source identity, history, interactions, navigation and motion.
21. `tests/phase4-atlas-errors-browser.mjs` — missing, outdated and unavailable data behavior.
22. `tests/phase4-workspaces-browser.mjs` — six workspace layouts, record/math preservation, contrast and screenshots.
23. `PHASE4_VISUAL_SYSTEM.md` — this report.

Other dirty files shown by Git belong to the preserved earlier phases; they are not being presented as new Phase 4 changes. Validation logs, receipts, baseline snapshots and screenshots remain ignored under `validation/`.

## Validation results

Baseline: **371 Node tests and 6 API integration tests passed** before implementation. Final: **382 Node tests and 6 API integration tests passed**, with zero failures or skipped tests. The 11 additional Node tests cover the atlas adapter. Eleven independent baseline/current numerical artifacts were deeply identical across core configurations, advanced analyses and automatic valuations.

Browser suites were run against a fresh local context at `http://127.0.0.1:4174/` and the actual static browser artifact at `http://127.0.0.1:4175/office/`.

| Executed browser suite | Local checks | Static browser checks |
| --- | ---: | ---: |
| Phase 1 navigation | 128 | 128 |
| Phase 2 Research Lab | 97 | 97 |
| Phase 3 investment workflow | 53 | 53 |
| Async workflow guards | 7 | 7 |
| Scientific charts | 74 | 74 |
| Workspace shell | 99 | 99 |
| Inline market content | 58 | 58 |
| Simple Office / Paper workflow | 40 | 40 |
| Original Macro monitor | 86 | 86 |
| New atlas interactions | 51 | 51 |
| New atlas error states | 12 | 12 |
| Cross-workspace visual checks | 49 | 49 |
| Encrypted backup | 23 | 23 |

All **1,554 assertions across 13 suites in two editions passed** in the successful final receipts, with no browser JavaScript errors. Machine-readable checks are retained in `validation/phase4-final-receipt.json`; source-preservation and artifact checks are in `validation/phase4-preservation.json` and `validation/phase4-artifact-check.json`. The successful local encrypted test used a roughly 57MB encrypted archive, including tampered-file and incorrect-password rejection and isolated restoration. Its four generated temporary upload copies were removed after the run; no owner backup was touched.

The investment suites exercised thesis evidence, immutable model/valuation links, separate Paper/Real decisions, appended outcome reviews, refresh, Back/Forward and isolated complete restoration without replacing original records. Independent Paper examples retain cash 797/cost 203 after buying 2 at 100 with fee 3; a sale of 1 at 110 with fee 1 leaves cash 906, remaining cost 101.5, realized profit 7.5 and total fees 4. Overselling is rejected. The new visual fixture independently retains cash 8,995, recorded cost 1,005 and total supplied valuation 10,095 after buying 10 at 100 with fee 5 and recording a supplied price of 110. These are TEST ONLY examples, not market returns.

Six workspaces were checked at **1440, 1280, 768, 390 and 320px**. No horizontal page overflow was found in that coverage. Keyboard, touch, reduced motion, deep links, selected-country persistence and source/error behavior were exercised. Selected text/background token pairs and the dark selected-region control pass AA text contrast; this is not a claim of a complete WCAG audit.

The final five-width visual run measured synchronous atlas rendering at **7.2–11.3ms locally** and **8.1–9.7ms in the static edition**. These ten samples exclude network acquisition, full-page rendering, external provider frames and end-to-end interaction latency. They do not establish 60 FPS. External TradingView frames were stubbed in these deterministic suites; their live data, entitlements and availability were not certified.

The static build succeeded with **1,346 existing published histories**. All six new assets match their source bytes. The artifact check resolved 190 relative JavaScript imports without a missing target, checked HTML asset references, and found no database, environment/config secret files, backend scripts, tests or validation artifacts. No new credentials were used. `git diff --check` passed.

### Failures investigated and corrections

- Dark-mode region selection initially placed light text on a light accent. The selected text color was corrected and a dedicated computed-contrast regression assertion added.
- Chart labels that became too small when the detail panel scaled down were enlarged without changing plot coordinates or values.
- Unsupported geography selection now disables the legacy GDP/inflation note handoff rather than retaining an unrelated region's note action.
- Deferred Treasury data updates preserve open source/method disclosures and keyboard focus. Tooltip state is cleared consistently when inspection ends.
- Legacy tests initially waited on newly collapsed regional content; test helpers now explicitly open the existing disclosure. No financial assertion was removed.
- One concurrent local workflow run exceeded the old 20-second wait while restoring a growing synthetic archive. A subsequent sequential run passed all 53 checks without changing restoration code. Large archives remain a performance limit.
- A test invocation accidentally targeted the old `/pages/` design-preview artifact. It was rejected as a failed run and rerun against the real `/office/` browser build. Only successful `/office/` receipts are counted.
- The encrypted local test exceeded Playwright's 50MB in-memory upload limit. Its test helper now supplies a temporary file for large uploads, preserving the same application validation assertions and cleaning up its own files.

The table lists the suites actually executed for this phase. It does not claim that every historical provider-specific or obsolete-layout browser script in the repository was rerun.

## Screenshot gallery

Each pair below uses the actual running static baseline and final application, fresh contexts, the same deterministic TEST ONLY records and matching viewport sizes. Desktop is 1440px; mobile is 390px. Additional local baseline and full-page atlas captures are also retained.

| Screen | Desktop before / after | Mobile before / after |
| --- | --- | --- |
| Overview | [Before](validation/phase4-baseline-overview-desktop.png) / [After](validation/phase4-after-overview-desktop.png) | [Before](validation/phase4-baseline-overview-mobile.png) / [After](validation/phase4-after-overview-mobile.png) |
| Markets | [Before](validation/phase4-baseline-markets-desktop.png) / [After](validation/phase4-after-markets-desktop.png) | [Before](validation/phase4-baseline-markets-mobile.png) / [After](validation/phase4-after-markets-mobile.png) |
| Macro: Indonesia | [Before](validation/phase4-baseline-macro-id-desktop.png) / [After](validation/phase4-after-macro-id-desktop.png) | [Before](validation/phase4-baseline-macro-id-mobile.png) / [After](validation/phase4-after-macro-id-mobile.png) |
| Macro: United States | [Before](validation/phase4-baseline-macro-us-desktop.png) / [After](validation/phase4-after-macro-us-desktop.png) | [Before](validation/phase4-baseline-macro-us-mobile.png) / [After](validation/phase4-after-macro-us-mobile.png) |
| Research Lab | [Before](validation/phase4-baseline-research-desktop.png) / [After](validation/phase4-after-research-desktop.png) | [Before](validation/phase4-baseline-research-mobile.png) / [After](validation/phase4-after-research-mobile.png) |
| Portfolio | [Before](validation/phase4-baseline-portfolio-desktop.png) / [After](validation/phase4-after-portfolio-desktop.png) | [Before](validation/phase4-baseline-portfolio-mobile.png) / [After](validation/phase4-after-portfolio-mobile.png) |

Dark pairs: [Overview before](validation/phase4-baseline-overview-dark.png) / [after](validation/phase4-after-overview-dark.png); [Research before](validation/phase4-baseline-research-dark.png) / [after](validation/phase4-after-research-dark.png); [Macro before](validation/phase4-baseline-macro-id-dark.png) / [after](validation/phase4-after-macro-id-dark.png).

Scientific chart captures: [desktop](validation/phase4-after-scientific-desktop.png), [dark](validation/phase4-after-scientific-dark.png), [mobile](validation/phase4-after-scientific-mobile.png). Full atlas captures: [dark](validation/phase4-after-macro-dark.png), [mobile](validation/phase4-after-macro-mobile.png).

## Known limits and stop boundary

- This phase does not create real-time data. Existing snapshots and publication schedules remain honestly labelled. Data-contract validation does not independently certify every upstream economic release.
- Numerical policy rates are not connected. Existing US Treasury yields are available; other sovereign yield, China/Japan and capital-flow coverage remains explicitly unavailable. No synthetic aggregate or inferred foreign/broker flow was added.
- Periods and frequencies differ across economies. Short Indonesia history remains short. The original 1:110m map is generalized and unsuitable for detailed geographic analysis; disputed boundaries are inherited from that dataset.
- Portfolio return histories still require complete dated valuations. No decorative performance chart, FX assumption or live broker position was introduced.
- Active-storage encryption, authentication and synchronization were not changed. Existing optional encrypted backup remains file-level protection, not an encrypted live database.
- Native view-transition support varies by browser; the fallback and reduced-motion paths remain available. No universal frame-rate, provider uptime or absence-of-all-bugs guarantee is made.
- Executed tests found no remaining introduced functional regression. Untested historical scripts and live external provider behavior remain outside the stated evidence.

**Phase 4 stops here. No Pluang integration, trading, next phase, merge or deployment was started.**
