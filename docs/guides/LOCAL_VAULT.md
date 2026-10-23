# Local storage, migration and recovery

## Current locations

Normal local server: `http://127.0.0.1:4173`. Original browser records remain under `longhand-office.v1` on that origin until an explicit migration. Theme/watchlist keys are separate and are not private-record backups.

Durable backend: `%LOCALAPPDATA%\LonghandOffice\data\office.sqlite`.
Isolated validation backend: `%LOCALAPPDATA%\LonghandOffice\test-data\office.sqlite`, with browser records on port 4174. Quant jobs are durable here from the outset; portfolios/theses/decisions use the vault after explicit migration.

These locations are outside the OneDrive project folder. Source files and JSON exports saved inside the project/downloads/other synced folders may still sync according to the user's own settings. Neither browser storage nor SQLite is application-encrypted. Loopback, Host/Origin restrictions, request tokens and CSP are local hardening, not hosted authentication.

## Explicit migration

Open **Local records & backups → Back up & connect local vault**. This downloads a complete records backup, retains a `longhand-office.v1.before-vault.<timestamp>` recovery copy, validates all records/run references and creates a new UUID workspace in SQLite. A database snapshot is written in the same transaction as the first workspace revision. The original browser key is retained unchanged. Page load never migrates or overwrites it.

The browser's `longhand-office.v1.vault` marker stores the workspace ID and recovery-key name. Subsequent page loads read that workspace; subsequent saves validate and use its expected revision. Other tabs receive a local broadcast update. The backend rejects stale revisions with 409, preventing stale edits or restores from overwriting newer data.

If migration fails, the original key remains, and any already-created recovery copy remains available. Keep the downloaded JSON. If browser site data is cleared, the SQLite database survives but the browser connection marker is lost. Restore a JSON backup into a newly connected workspace; no automatic selection of an old workspace occurs.

## Backup and restore

New exports use envelope format `longhand-office-backup`, formatVersion 2, with `records` containing the backward-compatible record version 1. They include portfolios, Paper/Real mode, trades, cash flows, all valuations/provenance, theses, decisions, public report IDs, review histories and immutable analysis references. All linked completed runs include normalized history, results, scores, audit metadata and hashes.

Old record-version-1 exports remain supported, including optional absent fields, report IDs missing from today's catalogue and legacy higher-precision trades. Invalid IDs, broken portfolio/thesis/run links, unsupported formats, malformed models, conflicting immutable run IDs and inconsistent hashes reject before replacement. The input/request size limit is 50 MB.

Restore previews validated counts and requires an explicit replace checkbox. Connected-vault restoration validates first, then snapshots the old workspace, inserts absent linked runs and replaces the workspace within one SQLite transaction. Failure rolls the transaction back. The form captures its selected candidate and blocks file changes while committing, and revision checks protect a stale dialog.

Browser-only restoration of old records without analyses remains available with the original stale-key guard. A backup containing linked analyses requires a connected vault, so records and analyses can be committed atomically. The UI states that requirement instead of performing a partial cross-storage restore.

Connected workspaces can list and download their latest 30 recovery snapshots through **Show recovery snapshots**. All save/restore/migration snapshots remain in the database; automatic retention/pruning is not implemented. Close the local servers before making a filesystem database copy, or use the app's JSON export. SQLite uses WAL; do not copy only the live main .sqlite file while omitting active WAL data.

## Cash-flow and journal rules

Deposits/withdrawals/dividends use the portfolio currency, a valid date, positive amount, optional recorded instrument and note. Events order by date, then sequence. Legacy same-day trade order is retained; new events get increasing sequences. There is no intraday timestamp model. A backdated event is validated against the full historical ledger.

Cash known as zero differs from cash unknown. Unknown starting cash remains unknown even after deposits. Known cash cannot become negative, including fees/withdrawals. Deposits minus withdrawals are external contributions; opening cash is labelled separately. Dividends add cash/income and do not alter trade cost or realized profit.

Buys add quantity × price + purchase fee to weighted-average recorded cost. Sales release proportional remaining cost and deduct sale fees. No short selling, automatic corporate-action ledger adjustments, FX conversion or tax-lot accounting is implied. Real is manual bookkeeping; it never places orders.

Outcome reviews append dated entries with outcome, lessons, next action and Held/Changed/Unclear reasoning assessment. Original expectations/rationale and earlier reviews stay intact. Existing legacy outcome text is retained. New thesis/decision entries retain an original prose snapshot; explicit edits append the preceding prose as a revision. Legacy originals are first captured when explicitly edited, with a retention timestamp rather than an invented original creation date. Both snapshots and revisions are included in records backups.

Time-/money-weighted investment returns remain unavailable because a complete valuation series at cash-flow boundaries and a conversion/calculation policy are not implemented. No percentage return is inferred from value minus contributions.

## Follow-up reliability audit

See [AUDIT_2026-10-13.md](../audits/AUDIT_2026-10-13.md) for reproduced defects and verification. Out-of-order reads cannot regress the client revision/data. Expired server-session tokens refresh once only after an explicit pre-write expiry rejection; ambiguous writes are not replayed. A peer update leaves a committing editor mounted so its revision conflict can be reported safely. Restore callbacks must still own the current open dialog/file selection.

Complete linked analysis bundles receive structural/numeric validation as well as hash checks. Unknown wrappers and exports beyond the 50 MB restore limit fail explicitly. Archive list reads return only small summaries. Lightweight failed-Quant-request notices live under `longhand-office.quant-request.<run UUID>` in browser storage; saved server jobs take precedence. These notices contain request configuration/error, not tokens or private thesis/portfolio text.

## Before private hosting

Implement real server authentication, authenticated sessions, per-user/per-workspace authorization on every read/write, TLS, encrypted storage and backup management, recovery/access policies, provider entitlements, and a security review. A frontend password screen or this loopback request token is insufficient. This release has no public deployment.
