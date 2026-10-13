# A simpler, recoverable Investment Lab

Implemented 14 October 2026, Asia/Jakarta. The original core, advanced and valuation mathematics, record schemas and ledger calculations are unchanged. This release connects five practical improvements around them.

## Drafts and saved calculations

Atlas calculators and the options/bonds/portfolio toolkit autosave raw fields by method into a new browser IndexedDB continuity archive. Imported toolkit source rows are retained too. A saved indicator appears only after a successful transaction. Switching methods preserves each method's fields; reload restores without fetching data or calculating a result automatically. A short-lived same-tab session copy protects ordinary drafts during immediate reload. Large source-bearing drafts rely on the confirmed IndexedDB save; wait for **Saved** before closing a tab.

Writes compare revision numbers. A stale tab cannot replace another tab's newer draft. **Export draft** preserves current input even when persistence fails; **Restore draft** validates its desk, fields and any source rows before loading it. Invalid arithmetic inputs can be saved as a draft but are not presented as a valid calculation.

Completed manual results enter **Saved manual studies**, retain assumptions/formula versions and reopen through independent recomputation. Invalid calculator outcomes are not saved as completed results. No silent archive pruning occurs.

## One complete backup, isolated restoration

**Records → Back up everything** produces `longhand-complete-backup`, version 1. It contains the active Office records plus completed core runs (including unlinked runs), advanced studies, automatic valuations, ticker studies, both desks' drafts, completed manual studies and registered predictions. Linked reports, theses, decisions, trade prices/fees, valuation records and outcome reviews retain their existing record representation. Incomplete model requests are retained as audit notes and never restarted by import. Other Office workspaces and old recovery snapshots are not merged into the active workspace's records.

Each section is bounded and validated before staging. Core analyses use the existing hash/structural contract; advanced studies additionally recompute in independent workers. Automatic/manual valuation and toolkit results recompute from retained inputs. References bind to the correct market, ticker, basis, source prices and core model. Registered forecasts bind to their original core values, and settled outcome arithmetic recomputes. Duplicate/conflicting identifiers, malformed drafts, modified results and absent references reject before activation.

Restoration uses a newly generated `?restored-workspace=UUID` namespace. Browser records, core jobs and all research archives are isolated there. Local restoration creates a new SQLite records workspace while retaining existing immutable shared core jobs; the separate research archives still use the new namespace. The original Office record key is never replaced. **Return to the original workspace** remains visible.

Multiple IndexedDB databases cannot share one transaction. Instead, all mathematical validation precedes writes, writes target only the new namespace, and the new record connection activates last. An interrupted restore can resume matching staged contents; conflicting changes require another new restore. Successfully activated staging payloads are cleared. A source or storage failure stops restoration and leaves the original records intact. Existing individual backup formats and the legacy explicitly replacing records restore remain available.

Limits: 100 MB complete JSON, 200 completed core runs, 200 ticker studies, 1,000 automatic valuations, 100 advanced studies, two method-aware draft desks (5 MB each), 300 manual studies and 500 registered predictions. These limits reject oversized exports/imports instead of silently truncating. Public catalogue/reference files and server recovery history are outside this file; mathematical studies retain their own inputs. Browser storage is not app-encrypted or synchronized across devices. Files remain private until the owner chooses to share them.

## One ticker, one readable overview

**Stock overview** shows the matching ticker's source price/currency/date, historical volatility, source earnings yield, model date and valuation limitations. Quote and model dates stay distinct. Another company's valuation is withheld while the matching one loads. Buttons connect directly to models, company valuation and registered outcomes; the sidebar and compact mobile menu include the overview and saved manual studies.

## Forward observation

Fresh, eligible core runs automatically freeze all four existing core forecasts for five and twenty available source sessions. An explicit registration button remains available. The original values, base price, basis, source model/hash and device time are immutable. Duplicate forecast vectors for the same instrument/cutoff/basis/horizon are not registered again.

The gate rejects old cutoffs with elapsed intervening weekdays, registration after a later weekday session may have opened (09:30 New York / 09:00 Jakarta), source/model creation later than registration, and incomplete source anchors. Weekends are handled; a complete exchange holiday/early-close calendar is not connected, so some otherwise usable historical registrations are conservatively withheld. Imported/device timestamps are unverified, not certified evidence of an externally audited prediction.

Pending outcomes check on a Quant visit at most once per hour and through **Check pending outcomes**. Checks read the current published source, not a live stream. Only completed positive observations count. Wrong identities/currencies, revised adjustment anchors, invalid dates, large gaps, late registration or future outcomes withhold settlement. The original forecast is not refitted or overwritten. Core prediction error, direction and interval inclusion are scored against the retained actual log return; MAE summaries separate five and twenty sessions. Overlapping windows are not an independent sample or evidence of a trading edge. Advanced models remain retrospective studies in this first registry; no advanced forward-performance claim is added.

## Data states

The shared presentation distinguishes **Dated snapshot**, **Outdated snapshot**, **Unavailable**, **Date unverified**, **Insufficient history** and **Missing fundamentals**. It is used in ticker research, the consolidated overview, core/advanced analyses, valuation, Markets and Treasury. Daily stock/history snapshots use a three-calendar-day stale threshold; Treasury uses seven. These are transparent thresholds, not exchange holiday calendars. Manual holding valuations keep their existing policy. No missing data becomes zero, no FX is inferred and no real-time entitlement is implied.

## Verification

All tests use clearly labelled synthetic inputs or actual dated public prices in fresh isolated contexts. Original user browser records are not touched. The first complete workflow passed 29 checks: immediate reload recovery, per-method drafts, imported rows, saved manual results, one-ticker source/risk/valuation, future empty/pending states, all-archive export, modified-model rejection, isolated restore/re-export, return to original records, core namespace separation, tamper rejection and 320/390/768/1440 layouts.

Existing navigation (59), complete Investment Lab (22), auto valuation (27), ticker (34) and official rates (19) browser checks passed again with no JavaScript errors. A two-tab draft conflict test confirmed that the newer revision remained intact. Six additional isolated registry checks used explicitly synthetic TEST-only prices and a simulated historical clock to verify settled/pending storage, correct endpoint return, model-bound tamper rejection, full-backup validation, reload persistence and unavailable rather than zero error for an unsettled horizon. No synthetic prices or scores were published. Pure independent examples verify 100→110 log-return errors, direction, interval inclusion, partial windows, exchange opening times, revised anchors, invalid/future observations and backdating rejection. Local store tests verify complete unlinked-run export, archived requests never auto-starting, original request preservation, portable browser-core import and capacity rejection. Final publication receipts are recorded after live verification.
