# A clearer daily Investment Lab

14 October 2026 · this release preserves the architectural interface and original records.

## Simple and Advanced

Simple is the initial Quant view. Seven conventional destinations cover ticker/source, Investment brief, valuation scenarios, historical risk, next steps, comparison and registered forecasts. Detailed source tables, model controls, technical analyses, calculators and archives remain mounted and accessible in Advanced. Switching views does not submit a model or modify records. The preference persists only after an explicit choice, is scoped for isolated restored workspaces and participates in complete backups. Older backups without this field default to Simple.

Desktop navigation includes a view shortcut; the sticky mobile menu includes both views. The existing in-place model navigation remains available. Entering Simple stops scenario playback. Reduced-motion preferences retain the existing slider-only inspection behavior. The entrance illustration, Office routes, light/dark themes and responsive tables are preserved.

## Investment brief

The brief uses the matching retained ticker, explicitly loaded matching core run and matching valuation. Another issuer's values are withheld. It presents source price/date/currency, historical simple-return volatility and maximum drawdown with their actual observation window, earnings yield with its valuation price date, three mechanical earnings/FCFE scenarios, editable assumptions and source limitations. A custom core can be identified independently of the ticker's original automatic run; an inactive previous core is not substituted. A saved core reference can be opened explicitly without requesting a fresh run.

Reference earnings scenarios are anchored to current P/E and flat earnings. They are not independently estimated fair values. Growth, multiples, discount rates and terminal assumptions remain hypotheses. Risk history is not portfolio profit, and model scores do not establish prospective forecasting accuracy. No automated investment argument, rating, buy recommendation or trade is generated.

Thesis evidence uses readable observations and assumption descriptions. Typed research context separately retains issuer/currency, source study identifiers, observation values/dates and model cutoff; immutable core references retain their existing hash contract. A plain-text brief export additionally includes audit identifiers. Complete backups verify context against included ticker/valuation sources. A legacy individual record backup may retain source identifiers without those separate archives; source attribution remains unverified and the retained prose is not replaced.

## Research → decision → paper → review

Save to thesis opens the existing editor with ticker, source evidence and available immutable core links. The owner writes the argument, risks and horizon and chooses reports. Opening an editor does not create an Office record. An explicitly selected existing matching thesis may be reused.

The continuation bar follows conventional Office routes and can resume in the same browser tab after reload. It carries the saved thesis into a decision, including reports, evidence, assumptions and core links. Decision reasoning and expected outcome remain owner-written. Only matching-currency Paper portfolios are offered; Real records stay separate. A new compatible Paper portfolio uses owner-supplied opening cash, including the existing unknown-cash option.

Paper transactions require owner-supplied date, quantity, price and fee. An available source quote is not inserted as an execution price. On explicit submission, the transaction retains decision/thesis references; a previously blank decision portfolio link is filled with the selected Paper portfolio and its prior record version is retained. Different existing portfolio links, another currency/instrument, overselling and insufficient known cash reject before persistence. Optional transaction links are validated in all supported record/backup paths. Existing transactions without these new fields are unchanged. A unique recorded ticker spelling (for example ADRO instead of ADRO.JK, or BRK.B instead of BRK-B) is reused for the linked transaction rather than creating another holding key; original transactions are not renamed. Multiple matching spellings require explicit owner input.

The review shortcut focuses the existing decision review-date field. Outcome review appends through the existing journal contract, preserving expectations and prior reviews. Closing the continuation bar deletes no saved record. Flow progress is an ephemeral scoped same-tab session aid, not a new investment record or a cross-device backup; unsaved prose inside a cancelled editor is not promised to survive.

## Comparison and workspace status

Comparison reads two to four explicitly selected retained stocks. Within each market/currency group, historical risk uses the intersection of actual dated adjusted prices and the existing descriptive-risk mathematics. Missing prices are not filled; insufficient common observations or incompatible frequency withhold risk for that group. The common window and observation count are shown. Quotes/earnings yields retain their own dates. Groups are not converted or combined, and no cheapest-stock ranking is inferred. Selection is temporary; saved source studies remain in the complete backup.

Check status in the Office overview or Records reads archive status, known pending save failures, capacity limits, export-generation activity and the published source directory. It does not modify investment records. Core summaries can be bounded by the backend and are labelled accordingly. Browser-reported storage usage covers the whole origin, including other workspaces, and excludes the local SQLite vault. Source directory coverage does not guarantee quotes, fundamentals or model suitability.

The export timestamp records successful file generation, not proof the owner retained or restored the download. It belongs to this workspace/device and starts unknown in a new isolated restoration; it is an operational aid, not imported investment data. No scheduled notifications or external messages are created.

## Verified preservation fix

A synthetic regression confirmed that a valid saved FCFE valuation could be rejected on restoration after its annual statement crossed the 550-day live eligibility limit: recomputation previously used today's date. Historical verification now uses the original saved creation time. Source acquisition and annual-period checks are bound to that reference time; future reference times reject. Current calculations still withhold stale annual FCFE. Retained values and original inputs are not rewritten. Both the brief and Advanced valuation identify the retained calculation date and warn when annual data is too old for a current DCF. Existing formulas and current-input results are unchanged.

## Local verification

- Forty isolated browser checks cover Simple defaults, keyboard switching, explicit-mode persistence, brief facts/limitations, no records from merely opening an editor, linked thesis/report/core context, Real/currency exclusion, Paper creation, same-tab continuation, decision linkage, owner transaction prices, overselling rejection, review preservation, comparison, workspace status, tampered context rejection, full backup/isolated restoration, original-record preservation, mobile view switching and 320/390/768/1440 layouts. No JavaScript errors occurred.
- Existing Advanced navigation (59), complete continuity/backup (34), deliberate draft-storage failure (7), ticker source workflows (34) and automatic valuation (27) passed again in explicit Advanced mode, with isolated contexts and clearly labelled test records.
- Independent examples verify ±10% / ±5% common-window volatility and drawdown; paper buy 2×100 + fee3 gives cash797 and cost203; sale 1×110 − fee1 gives cash906, remaining cost101.5, realized profit7.5 and total fees4. Frozen FCFE8/rate12%/five-year/terminal2% DCF reconciles to an independent sum after the live age threshold changes.

Screenshots, synthetic inputs and browser receipts remain ignored in `validation/`. Personal records and databases are excluded from publication. Final CI, public data-gate and live-browser receipts are appended after deployment succeeds. Free data remains dated and best effort; exchange holiday calendars, certified timestamps, broker execution and cross-device private synchronization are not added.

Seven additional actual-source IDX checks verify ADRO identity, the compatible existing IDR Paper portfolio, legacy ADRO spelling reuse, unchanged original transactions, one holding with quantity12/cost1248/average104/cash8752/fees8, and canonical thesis/decision links. Five synthetic TEST-only browser checks restore an originally eligible valuation after its current annual data expires, show the retained date and stale warning, and verify reload persistence and complete export. No JavaScript errors occurred. **275 Node tests and four local API checks** pass; publication and live receipts follow below.
