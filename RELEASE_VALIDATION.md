# Local release validation — 13 October 2026

Follow-up fixes and current verification counts are recorded in [AUDIT_2026-10-13.md](AUDIT_2026-10-13.md). This document retains the preceding release's evidence and walkthrough.

## Working previews

- Ordinary workspace: [Longhand Office](http://127.0.0.1:4173/#overview).
- [Isolated complete workflow](http://127.0.0.1:4174/?test-workspace=098cf524-b9c8-437a-b1e9-4d76afe3f0c2#overview).
- [Persisted AAPL analysis](http://127.0.0.1:4174/#quant/run/b04d9004-b605-4f07-b7a1-8a2d34670d85).
- [Latest cutoff-anchored AAPL analysis](http://127.0.0.1:4174/#quant/run/22c9b334-f26e-4081-afe8-1b2c82cee796).
- [Independent-reference AAPL run](http://127.0.0.1:4174/#quant/run/1e064819-d043-44f6-9ad9-61e9b03c7ec5).

Port 4174 has a prominent isolated-validation banner. The test-workspace query reads an explicitly named SQLite test workspace without changing browser records or connection markers. Port 4173 ignores that query. The transactions/theses/decisions in the walkthrough are labelled TEST ONLY; the Quant observations are actual provider data, not fabricated fixture prices.

## Tested walkthrough

1. Create a TEST ONLY USD Paper portfolio with opening cash 1,000.
2. Deposit 200 (1 Jan), buy 10 AAPL at 50 with fee 5 (2 Jan), receive dividend 12 (3 Jan), withdraw 100 (4 Jan), sell 4 at 60 with fee 3 (5 Jan). Every price/trade here is a labelled simulated input.
3. Supply a manual test price of 70 dated 12 October. Inspect holdings, cost, profit and concentration.
4. Select an actual report ID from the public research catalogue and attach it to a TEST ONLY thesis with assumptions/evidence/risks/horizon/invalidation/review date and the portfolio link.
5. Create a decision linked to both thesis and portfolio; retain the original expectation. Add two separate outcome reviews with lessons, next action and a Held reasoning assessment.
6. Run AAPL from the Quant form. Verify a new tab opens directly, the persistent ID and actual source dataset match AAPL, and reload recovers the exact result hash.
7. Attach that same run to both thesis and decision. Inspect its cutoff/model-version link.
8. In Markets, select AAPL and choose **Use for valuation**. Verify nothing saves before choosing a matching held position and checking the price/date/source confirmation. Save it and verify the previous manual price remains in history.
9. Explicitly back up/connect the vault. Verify the original browser key and before-vault recovery copy remain byte-for-byte unchanged.
10. Reload, export records including the linked dataset/results, restore into a separate empty vault, reload again and follow the immutable analysis link. Every record/reference round-trips.

The final example's later source valuation is a dated Yahoo observation, so its current value will differ from the earlier synthetic price-70 example. That is explicit recorded history, not an invented test price or automatic price update.

## Independent ledger example

| Measure | Independently calculated |
|---|---:|
| Cash | 1,000 + 200 − 505 + 12 − 100 + 237 = **844 USD** |
| Remaining holdings | 10 − 4 = **6 shares** |
| Initial recorded cost | 10 × 50 + 5 = **505 USD** |
| Cost released on sale | 505 × 4/10 = **202 USD** |
| Remaining cost | 505 − 202 = **303 USD** |
| Realized trading profit | 4 × 60 − 3 − 202 = **35 USD** |
| Recorded fees | 5 + 3 = **8 USD** |
| Dividend income | **12 USD** |
| Net external contributions | 200 − 100 = **100 USD**, opening cash excluded |
| At supplied price 70 | Holding value **420**, unrealized P/L **117**, total with cash **1,264 USD** |
| Largest security weight | 420 / 1,264 = **33.227848%**, cash included in denominator |

Overselling 7 shares and withdrawing 10,000 reject without saving any record. Backdating, ordering, fractional precision, negative/nonfinite inputs, unknown versus zero cash, currency mismatches and missing/outdated valuation prices are covered in automated tests. Currency buckets remain separate; incomplete valuations do not become complete totals.

## Quant evidence

AAPL, MSFT and SPY each completed with 1,254 actual eligible observations during the still-open 12 October US session. Last completed session was 9 October. MSFT and SPY have distinct dataset hashes; no ticker receives another ticker's frozen output.

Provider rolling-range retrievals can shift the first observation on subsequent days. New runs now anchor their five-year acquisition window to the requested cutoff with explicit start/end timestamps. Earlier retained runs expose their original source URL and actual sample; they are not rewritten to disguise the change.

After the 12 October US session completed, the anchored AAPL run above retained 1,255 observations through 12 October. A further independent Python check matched all 34 numerical comparisons on this fresh run. The old reference run remains unchanged at 1,254 observations through 9 October.

BBCA failed honestly at 288 versus the 350 required observations. Provider failure/429, missing adjusted/raw closes, missing latest completed close, unexpected tickers, unsupported venues/types, invalid inputs, duplicates, material gaps and incomplete daily bars were checked separately.

The independent Python reference performs 34 checks on the saved AAPL run: sample annualized volatility, max drawdown, historical VaR/ES, rolling/EWMA, AR forecasts, Ridge forecasts through an independent Cholesky solver, scored RMSE/MAE and counts at both horizons. It reads only a public-data analysis from the isolated server. Python statistics/Cholesky differs from the JavaScript implementation/solver. Receipt: `validation/quant-independent-results.json`.

Leakage tests replace every return after an evaluation origin and verify AR/Ridge fits remain exactly unchanged. They independently check training-feature means, matured label ends and nonoverlapping scored intervals. Zero-return direction semantics, too-few-errors intervals, seeded path reproducibility and sensitivity to ticker/seed/config are checked.

## Persistence, jobs and recovery

- SQLite record persistence after physical close/reopen passed.
- A running job recovered after physical database close/reopen; queued/running states are requeued on server startup.
- Completed real AAPL results survived an actual local-server restart with the same saved hash.
- Two-worker/16-job admission bounds, cancellation of queued/running jobs, worker deadline, failure/retry, cache identification and forced new versions passed.
- Popup-block fallback was exercised by making `window.open` return null; its ordinary persistent link opened the completed run.
- Atomic linked-run restore, mismatched/missing run rejection, incompatible models, altered dataset/results hashes and conflicting immutable IDs passed.
- Backend stale revision returned 409 and left the newer record intact. Browser legacy stale-edit/storage-event/restore-selection races also passed (11 checks).
- The restoration candidate is captured before the asynchronous commit. The file input is disabled and Escape cannot dismiss the committing modal; explicit delayed-commit testing passed.
- Explicit thesis edits preserve original prose, append prior versions and retain Quant links. This was checked through the interface as well as unit tests.

## Design, accessibility and motion

The existing courtyard was retained, with added material/glass/planting detail and dimensional shadows. Its labels and conventional navigation remain available. Keyboard focus illuminates the matching room; Enter opens it. Future rooms are still planned.

Light/dark desktop checks covered the overview, portfolio, Journal, Library and Quant result. At 390 px, overview, portfolio lists/detail, theses, Journal, Library, Records, Markets and Quant had no document overflow. Tables scroll inside labelled regions. New form labels, focus trap, Shift+Tab and Escape were exercised. Reduced-motion removes entrance/transition effects; actual numeric results remain unchanged. Rapid navigation completes without unhandled cancellation errors. Charts have exact-value tables and no fabricated price points.

Visual evidence is in `validation/office-light-final.png`, `office-dark-final.png`, `quant-light-final.png`, `quant-dark-final.png`, `quant-mobile.png`, `office-mobile-entrance.png` and `office-workflow-portfolio.png`. These screenshots contain isolated test records/public analyses, not ordinary private records.

## Fixes verified in this task

- Added the missing cash-flow ledger, immutable analysis references, original-prose/review history, review queue and actual desk activity.
- Added persistence/CAS/atomic backups rather than an automatic browser migration or frontend password gate.
- Hardened malformed URL handling: a `//` request previously terminated the server; it now returns 400 and the server remains available.
- Handled expected View Transition readiness rejection when rapid navigation skips an earlier transition.
- Retained acquired history on jobs that fail during fitting, so insufficient-history failures can expose/export their acquisition audit.
- Strengthened analysis restore validation beyond hashes, including model/config identity, shape and chronological observations.
- Correctly labelled appended market observations separately from user-supplied prices.
- Made the architectural SVG parse as valid standalone XML while preserving its displayed labels.

## Check counts and practical limits

Final `npm test`: **137 passed, zero failed**. Live local API suite: **2 passed**. Independent Python: **34 passed**. Complete browser workflow: **22 passed**. Legacy record safety: **11 passed**. Additional mobile/theme/navigation/storage race checks passed as documented above.

These are automated/browser/manual visual checks, not a complete assistive-technology audit or penetration test. Provider-adjustment vintage is not point-in-time market history; empirical model ranks/intervals are retrospective. IDX needs more history. No guaranteed real-time feed, FX, tax-lot accounting, corporate-action trade adjustment, TWR/MWR, standalone analysis-import screen or public hosting was added. See QUANT_LAB.md and LOCAL_VAULT.md for exact policies.

All record mutations during verification occurred in fresh browser contexts or explicitly named TEST ONLY SQLite workspaces at port 4174. The ordinary port 4173 browser key was checked unchanged on reload. Flowless's service/database were only read. Source was backed up before implementation to `%LOCALAPPDATA%\LonghandOffice\source-backups\20261013-022005`; the workspace is not a Git checkout, so no commit/PR was fabricated.
