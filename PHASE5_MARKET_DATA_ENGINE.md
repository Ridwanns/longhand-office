# Phase 5 — Unified market data foundation

Implemented and verified locally on 17 October 2026. Branch: `codex/phase-5-market-data-engine`. No commit, merge, push, deployment, trading functionality or Phase 6 work.

## Outcome and Pluang feasibility verdict

Office now has a provider-independent market-data contract, validation/adaptation layer, an implemented **Data Sources** secondary workspace, immutable device source archives, and distinct selected-source research studies. Existing Markets links into this workflow. Eligible data can use the existing Quant and automatic-valuation engines; original runs and investment records are not updated.

**The implemented Pluang integration is validated JSON/CSV ingestion and inspection. It is not an automatic Office-to-Pluang connection.** Fresh authorized market-only connector responses were used to verify NVDA ingestion and the interface. That does not transfer the chat connector's credentials or permissions to Office.

### Verified access facts

- Pluang documents an official MCP endpoint at `https://mcp.pluang.com/mcp` and custom MCP client connections with user login/approval. Its documentation distinguishes read and trading permissions. It is not described as an ordinary API-key product. [Official connection instructions](https://pluang.com/en/faq/agentic-trading/agentic-trading-security-permissions/cara-menghubungkan-akun-pluang-ke-ai-agent), [access controls](https://pluang.com/en/faq/agentic-trading/agentic-trading-security-permissions/bagaimana-pluang-mengontrol-akses-ai-agent).
- Public OAuth discovery metadata returned authorization, token, registration and revocation endpoints, authorization-code/refresh-token support and S256. Protected-resource metadata advertised `market:read`, `portfolio:read` and `trade:write` as separate scopes. Reading this public metadata did not authenticate Office or grant any scope.
- The connector actually returned US quotes, daily/intraday OHLC, technical indicators and fundamental snapshots for NVDA. An IDX BBCA market quote also succeeded. This verifies those individual reads, not every US/IDX instrument or endpoint.
- Pluang explains that agent and application readings can differ by timing; the application remains the system of record. [Official explanation](https://pluang.com/en/faq/agentic-trading/agentic-trading-transaction/jawaban-agent-tidak-cocok-dengan-aplikasi-pluang).
- The published terms contain restrictions on use/copying/distribution. Connector access does not establish a right for Office to retain, republish or redistribute a market-data feed. [Pluang terms](https://pluang.com/en/tnc/bsc-terms).

### Unresolved; direct connection remains closed

There is no separately authorized Office OAuth client/grant, confirmed persistent-data permission, published numeric rate-limit agreement verified for Office, or redistribution entitlement. A private Node MCP client is technically plausible from the documented protocol; that is an architectural inference, not verified production approval for this application.

No OAuth client, token store, proxy around authenticated sessions, private-endpoint scraping or background Pluang refresh was introduced. No account holdings, balances, transaction histories or trading tools were accessed. The connector session identifier was not written into repository source, browser application storage or the Pages build.

Unverified imports are preview-only. Retention requires an explicit importer declaration and permission reference; this remains an importer assertion, not vendor certification. The app never approves public redistribution. Source files and raw fresh Pluang responses were not added to the public snapshot pipeline.

## Baseline and preservation

The baseline had 49 modified/untracked paths from earlier phases. Those were preserved in the ignored `validation/phase5-before.zip`, with a working-tree inventory/diff and a 205-file hash inventory. Phase 5 adds to that work rather than replacing it.

Baseline tests: **382 Node tests and 6 local API integration tests passed**. The Phase 4 atlas baseline also passed 51 browser checks locally before integration.

The final comparison found **196 of those 205 files byte-identical**, nine intentionally modified files and no missing baseline files. All 25 specifically protected financial engines, model/input contracts, original storage/backup implementations, browser worker/API modules and map geometry matched their Phase 5 baseline hashes. The earlier `PLUANG_DATA_TRIAL.md` also remained byte-identical. Git HEAD remained `6aca9b19cb5080823128160b0677d4a3adbea6cc`.

No database/IndexedDB schema change, migration, record reset or acquisition-provider change occurred. Tests used fresh browser contexts and labelled synthetic investment/source records. They did not use the owner's browser profile or investment records.

## Architecture actually implemented

| Layer | Responsibility |
| --- | --- |
| `market-data-contract.js` | Strict canonical schema, timestamps, monetary units, OHLC and identity validation, quality/coverage report, independent-source comparison, canonical JSON and SHA-256 |
| `market-data-adapters.js` | Pluang response envelopes, existing Yahoo publications, official SEC evidence, legacy Yahoo/Flowless quotes, canonical JSON/CSV imports and explicit future-adapter registration |
| `market-data-service.js` | Explicit provider selection; read existing published files or the existing local Flowless endpoint; no provider fallback or Pluang credential inheritance |
| `market-data-research.js` | Eligibility checks and adaptation into unchanged existing engines; distinct source-study format and reproducibility validation |
| `market-data-worker.js` | Selected-source computation and restored-study recomputation off the UI thread |
| `market-data-storage.js` | Separate bounded, content-addressed device archive and atomic additive restore |
| `market-data-ui.js`, `market-data.css` | Data Sources inspection, quality, history, comparison, import/backup, and source-aware Research panels using the Phase 4 visual system |

The new route is `#data-sources`, also recognized by the global page finder. A listing handoff such as `#data-sources/US/NVDA/yahoo` prefills the intended provider/market/ticker without silently loading another source. Retained datasets use `#data-sources/<SHA-256>`.

Selected-source studies use `#quant/source/<SHA-256>`, with the existing six Research Lab views and optional `/study/<UUID>` deep links. These are a distinct archive; original Quant job formats, routes, hashes and saved studies remain intact. Only the new selected-source route hides unrelated legacy workflow links; its own evidence action opens the existing thesis editor with source IDs/hashes and blank investment reasoning.

## Canonical data contract

`longhand-market-dataset` version 1 contains:

- Provider and instrument identity: symbol, US/IDX market, exchange when supplied, equity/ETF/reference asset class, currency and optional reported sector.
- Source: retrieval time, observation time when supplied, source URL/label, acquisition method, storage declaration/reference, redistribution status, and component acquisition timestamps.
- Nullable reference quote: price, previous close, regular-session open/high/low when supplied, session, observation timestamp and optional volume.
- Supplied historical collections: interval, timezone, session coverage, date convention, adjustment basis/method/evidence/authority, corporate actions when supplied, and original OHLC/adjusted-close/volume/start/end/completeness fields.
- Fundamentals: normalized metric, value, unit, reporting currency, original field, source period label/type/start/end/fiscal year when available and filing URL.
- Technical values: original indicator key, value, timeframe, vendor/local origin, signal and methodology disclosure; vendor summary scope remains separate.

Supported interval vocabulary is 5m, 10m, 15m, 1h, 1d and 1wk. **The selector exposes only collections actually supplied in that dataset.** Nothing is resampled to manufacture another interval. Pluang technical imports accept the connector's verified technical frames (5m, 15m, hourly, daily); history support does not imply that 10m or weekly technical indicators exist.

Unknown exchange, event timestamp, volume, corporate actions and financial periods remain unknown/null. Source period boundaries are not labelled as quote event timestamps. Microsecond acquisition timestamps from the existing Python Yahoo pipeline are preserved; comparisons use JavaScript millisecond precision without rewriting those strings.

Fundamental coverage includes capitalisation/enterprise value, reported financials, per-share earnings, valuation multiples, profitability/debt ratios, dividend yield, analyst counts and price targets **when supplied**. This is not a promise that every provider returns every metric. Monetary values, per-share units, ratios and percentage points are checked explicitly. Financial reporting currencies can differ from listing currency; there is no invented FX conversion.

## Validation and analytical safeguards

Implemented checks reject unsupported/private fields, nonfinite or invalid prices, bad currency/listing identity, malformed or future timestamps, impossible calendar dates, duplicate/reversed candles, inconsistent date/timezone conventions, invalid intraday boundaries, invalid OHLC bounds, negative volume, ambiguous numeric formats, invalid reporting periods/units and credential-bearing URLs/payloads.

Quality reports separately disclose stale/unknown observation times, retrieval freshness, missing closes and volume, partial OHLC, material calendar gaps, suspicious changes above 40%, unknown adjustments, incomplete candles, incompatible financial currencies, undated/stale reporting periods and vendor methodology limitations. Freshness thresholds are disclosed heuristics: quote age over four calendar days, retrieval age over seven days, financial periods over 550 days. They are not exchange calendars or real-time guarantees.

Structural rejection does not rewrite source values. A quality finding is not an independent audit of the vendor. Dataset-level flags describe the complete supplied source; analytical eligibility additionally depends on the selected daily history/basis/cutoff and the existing engine's rules.

### Quant

- Daily regular-session history only; at least the existing 350-observation minimum after existing omissions/segment rules.
- Unverified adjustment methodology blocks model use. Documented importer/retrieval-vintage conventions require explicit review. The selected adjusted/raw basis must actually exist.
- Unresolved >40% jumps in the eligible selected basis block execution. No automatic split correction is performed.
- Existing `prepareHistory` rules still exclude incomplete/future rows, reject a missing latest selected close, and retain only the latest eligible segment after known missing closes/material gaps. Those exclusions are retained in metadata; no filling or bridging occurs.
- Actual selected-provider price-convention wording is supplied by the new adapter. A non-Flowless IDX import is not mislabeled as Flowless.
- Each new source study freezes its provider, dataset hash, vintage, normalized input hash, parameters, seed, cutoff, engine version, results and result hash. Restored studies are recomputed and compared before being accepted.

### Company valuation

The unchanged automatic-valuation engine currently enforces Yahoo identity. The new adapter respects that safeguard instead of relabelling Pluang or SEC data as Yahoo.

Compatible Yahoo inputs require a dated source price plus dated TTM EPS or complete same-period annual FCFE inputs with appropriate reporting currency/sector. Undated EPS, annual EPS pretending to be TTM, incompatible reporting currencies and incomplete cashflow inputs are withheld. Official SEC annual facts remain evidence, with reported capex signs preserved; fiscal-year labels are not inferred from the calendar year of period end.

The selected-source valuation action uses the existing, explicitly displayed hypothetical default assumptions. Existing editable valuation tools remain accessible below. Source observations and scenario assumptions are separate, and saved valuations never update automatically. Additional-provider automatic valuation is a remaining limitation, not an implemented claim.

## Fresh NVDA ingestion demonstration

Actual market-only Pluang connector responses retrieved on 17 October 2026 were adapted and inspected in a fresh local browser context. The latest component retrieval was `2026-10-17T04:18:52.072Z`. Figures were not copied from a visual reference or hardcoded as current prices.

| Observation | Actual result |
| --- | --- |
| Daily OHLC | 1,266 supplied candles, 1 Oct 2021–16 Oct 2026 |
| Intraday OHLC | 52 supplied 15-minute candles, 15–16 Oct 2026 |
| Historical volume | Absent for all 1,318 candles; retained as null |
| Completion | All returned period ends preceded this retrieval; no ongoing candle was invented |
| Vendor technical entries | 34, preserving original keys/periods and summary scope |
| Fundamental entries | 32, including separately labelled quarterly actual/expected EPS |
| Quote event time / exchange | Not supplied; not inferred |
| Adjustment methodology | Unverified; Quant withheld |
| Fundamental eligibility | Undated snapshots not converted into TTM/annual inputs |
| Storage permission | Unverified; preview only, export disabled, zero source datasets retained |
| Direct Office refresh | Not authorized/implemented; this demonstration used the selected chat connector |

Normalized dataset hash: `47fcbc54cf97d026cee2108ab14c60e6cfa40228f8ae58220f28b8852216cb85`.

The quality/count/hash receipt and screenshots are local validation evidence. The raw connector responses were not saved into the application cache, repository market fixtures, public assets or the acquisition pipeline. The demo is a dated observation, not proof of real-time entitlement or a persistent live connection.

## Existing publication coverage audit

All **1,346 existing Yahoo history publications** were run through the new adapter/quality engine without acquiring or altering upstream data.

| Market | Existing histories | Passed structural normalization | Rejected |
| --- | ---: | ---: | ---: |
| US | 507 | 485 | 22 |
| IDX | 839 | 805 | 34 |
| Total | 1,346 | 1,290 | 56 |

Of the 1,290 structurally valid datasets, 1,257 had review findings and 33 had blocking quality findings. Structural validity is not universal model eligibility.

The 56 rejected publications contain an opening/closing value outside supplied high/low bounds or a nonpositive opening price. Examples include BA's incomplete 13 Oct 2026 row, SHEL on 24 Jan 2023, several IDX historical rows, and WBD's zero opening value. No source number, candle or original study was changed to conceal these inconsistencies. The new path reports the date/field where available and withholds the inconsistent dataset; the existing legacy workflows remain available as before. A reviewed provider reacquisition/correction is still needed for those publications. The full rejected-symbol/date list is in `validation/phase5-publication-validation.json`.

The existing NVDA Yahoo publication normalized 1,255 daily rows from 13 Oct 2021–13 Oct 2026; its last incomplete row is excluded by the existing model adapter. Dated annual FCFE inputs reproduced the existing automatic valuation engine exactly, while undated EPS remained withheld.

The existing SEC publication contains eight unavailable issuer records, including NVDA with HTTP 403. The interface preserves those reasons and does not substitute fabricated filings. Flowless remains an existing local read-only source; its availability is checked only when explicitly selected. Tests verify unavailable-service handling and static-edition refusal; no general live Flowless uptime/coverage claim is made.

## Storage, import and backup operation

Existing browser records, local SQLite vaults, browser IndexedDB stores and complete-backup formats are unchanged.

New source datasets and source studies use a separate **unencrypted localStorage archive**, naturally isolated by origin and additionally by application path and existing workspace scope. Key prefix: `longhand-office.market-data.v1.`. Limits: 4 MB total, 40 datasets and 40 source studies. There is no automatic eviction or replacement; quota/conflict failures leave the previous archive intact. No cross-device sync was added.

Dataset IDs are canonical SHA-256 hashes. New acquisition vintages/providers create distinct entries. Existing entries/study IDs cannot be overwritten with different content. Export verifies hashes. Restore validates every incoming dataset, recomputes incoming source studies in a worker and merges atomically after validation. A bad hash, missing source, changed result, ID conflict or concurrent write rejects the operation without replacing investment records.

**Export both archives when using this workflow:** the existing Office/complete backup for investment records and original analyses, plus **Export source data & studies** in Data Sources for the new archive. Records & Backups links to this separate backup and explains the boundary. The existing optional encrypted complete-backup feature does not encrypt this new source cache or source backup.

To use the new workflow:

1. Open Data Sources; choose market, ticker and an implemented source, or inspect a permitted JSON/CSV file.
2. Review source time, supplied intervals, quality, exact candles, reporting periods and methodology.
3. Retain a permitted dataset explicitly. Imported declarations remain assertions; previewing does not retain the file.
4. Continue in Research Lab with that immutable source. Review basis/cutoff/seed and run an eligible distinct study; incompatible data is withheld with a reason.
5. Use its evidence in the existing thesis editor; the investment argument remains user-written.
6. Export the separate source archive as well as Office records. Restore source data additively in the target workspace.

JSON imports accept canonical `longhand-market-dataset` v1 or the market-only `longhand-pluang-market-import` v1 envelope. The Pluang envelope identifies `instrument`, `retrievedAt`, optional `componentRetrievedAt`, and successful market `quote`, `histories`, `fundamentals` and `technicals` response objects. It must not contain connector sessions, tokens or account data. Canonical public-source permission claims in an imported file do not establish trust and are downgraded to unverified.

The UI's downloadable **TEST ONLY CSV template** documents supported columns. CSV uses one listing/provider/interval and consistent source metadata, explicit currency/timezone/session/completeness, ISO dates, and blank nullable fields. Missing volume stays null. Adjustment method/evidence and permission references are required for their respective claims. Formula-like/ambiguous numbers, private/unknown headers and mixed metadata reject. `tests/market-data-fixture.mjs` contains deterministic synthetic JSON fixtures for developers; it is not shipped as market data.

## Verified fixes during this phase

- Accepted existing Yahoo microsecond timestamps without relaxing impossible-date/hour checks or rewriting provenance.
- Retained separate cashflow acquisition timestamps rather than attributing all fundamentals to an earlier snapshot read.
- Kept quarterly actual/expected EPS display labels and did not invent fiscal period ends or fiscal-year labels.
- Prevented source selection changes, aborted/late responses and delayed retention inspection from restoring an obsolete displayed quote.
- Prevented non-Flowless IDX model inputs from inheriting the legacy preparer's Flowless price-convention description.
- Added explicit metric-unit/suffix safeguards and rejection of raw API-key/cookie/token fields.
- Scoped chart sizing to the actual source/research container so mobile axis labels remain readable, including when reopening a saved study from a hidden pane.
- Added the separate source-backup link/boundary to Records & Backups and extended the page finder to real destinations.

The upstream OHLC inconsistencies above were detected and withheld, not repaired by this phase.

## Tests actually executed

| Check | Actual result |
| --- | --- |
| Full Node suite | **449 passed, 0 failed** (382 baseline + 67 new) |
| Local API integration suite | **6 passed, 0 failed** |
| Baseline/current numerical replay | **11 deeply identical artifacts** across retained core/advanced/valuation examples |
| New source workflow browser suite | **49 checks each** on local and static editions |
| New source safety browser suite | **17 checks each** on local and static editions |
| Existing browser regression suites | **777 checks each** on local and static editions |
| Browser total, distinct final suite runs | **1,686 checks, no suite failures or uncaught JavaScript exceptions** |
| Publication normalization/quality scan | 1,346 inspected; 1,290 structurally valid, 56 explicitly rejected |
| Final artifact/security/preservation script | **37 checks passed**; 1,446 artifact files inspected |
| Pages build | Successful; 1,346 existing histories copied; new modules included |
| Working local preview | Home and new source module returned HTTP 200 |
| Git whitespace check | `git diff --check` clean |

Existing browser suites rerun in both editions: Phase 1 navigation (128), Phase 2 Research (97), Phase 3 workflow (53), async guards (7), workspace shell (99), inline Markets (58), simple Office/valuation workflow (40), macro (86), Phase 4 atlas (51), atlas error handling (12), Phase 4 workspaces (49), scientific charts (74), encrypted backup (23).

New tests cover normalization, absent volume, prices/currencies/units, date/timezones, periods, unknown adjustments, conflicting provider prices, explicit source switching and delayed responses, numerical reuse, source-study refresh/Back/Forward, hash tampering, concurrent writes/quota failure, additive restoration into a second context, original-record byte preservation, keyboard navigation, reduced motion and 1440/1280/768/390/320px layouts. Readable source/model chart axis sizes are measured at those widths.

Third-party TradingView frames are isolated with labelled stubs in regression tests. These tests do not certify external widgets, provider uptime, all possible data errors or every historical test script in the repository. Original numerical calculations were not modified to make tests pass.

Local receipts: `validation/phase5-node-final.log`, `phase5-api-final.log`, `phase5-numerical-final.log`, `phase5-browser-final.json`, `phase5-publication-validation.json`, `phase5-security-final.json`, and `phase5-pluang-nvda-final.json`. The validation directory is ignored by Git and excluded from the static build.

## Exact Phase 5 source-file changes

Modified from the captured Phase 5 baseline:

- `app.js` — Data Sources route/mount/title and explicit separate-backup guidance.
- `index.html` — scoped source stylesheet.
- `market-terminal.js` — normalize existing quote identity and expose quality/source handoff.
- `research-lab.js` — mount source-specific panels/context while retaining existing panes/workflows.
- `research-layout.js` — preserve selected dataset/study prefixes through the six existing views.
- `workspace-navigation.js` — secondary Data Sources route and finder aliases.
- `scripts/serve.mjs` — allowlist the eight new static assets.
- `scripts/build-pages.mjs` — include those assets in the existing build.
- `tests/workspace-navigation.test.mjs` — recognize the implemented route/aliases.

Added runtime files: `market-data-contract.js`, `market-data-adapters.js`, `market-data-research.js`, `market-data-worker.js`, `market-data-storage.js`, `market-data-service.js`, `market-data-ui.js`, `market-data.css`.

Added tests: `tests/market-data-fixture.mjs`, `tests/market-data.test.mjs`, `tests/market-data-storage.test.mjs`, `tests/phase5-market-data-browser.mjs`, `tests/phase5-source-safety-browser.mjs`. This report is new. Earlier Phase 1–4 dirty/untracked files remain present; their existence in Git status is not attributed to Phase 5 edits.

## Screenshots and local preview

- [Data Sources, desktop](validation/phase5-data-sources-desktop.png)
- [Fresh Pluang NVDA inspection, desktop](validation/phase5-pluang-nvda-preview-desktop.png)
- [Fresh Pluang NVDA inspection, dark](validation/phase5-pluang-nvda-preview-dark.png)
- [Fresh Pluang NVDA inspection, mobile](validation/phase5-pluang-nvda-preview-mobile.png)
- [TEST ONLY selected-source Research, mobile](validation/phase5-source-study-mobile.png)

Working application: `http://127.0.0.1:4173/#data-sources`. Static artifact inspected at `http://127.0.0.1:4175/office/#data-sources`. The public GitHub Pages site was not deployed or changed by this phase.

## Remaining limits and stop boundary

Direct/automatic Pluang refresh, a separately approved read-only OAuth client, rate-limit policy, persistent-data permission and redistribution terms remain unresolved. No real-time guarantee is made. Existing Yahoo publication freshness and uneven fundamentals remain visible; 56 inconsistent histories need reviewed upstream correction. Current SEC publication is unavailable, and Flowless depends on its existing owner-operated local service.

Pluang vendor methodology/adjustments and several financial dates are unknown. Its fresh NVDA response is therefore an inspection demonstration, not automatically eligible Quant or valuation input. Additional-provider automatic valuation, account sync, encrypted active storage, trading and further modules are outside this phase.

**Phase 5 stops here. No merge, commit, deployment, account-data access, order execution or Phase 6 work.**
