# State machines

Lifecycles in Longhand Office. **Explicit** machines live in `machines.js` (built with `state-machine.js`) and are enforced or checked by `tests/state-machines.test.mjs`. **Implicit** ones are still flags or strings in code; they are listed so nobody has to rediscover them. Change an explicit machine here first, then the code.

## Explicit

| Machine | Where | States | Notes |
| --- | --- | --- | --- |
| `JOB_LIFECYCLE` | `scripts/quant-jobs.mjs`, `scripts/local-store.mjs` | queued, running, completed, failed, cancelled | Enforced: every status write goes through `lifecycle.assert`. `running -> queued` is restart recovery. A cache hit is created directly as `completed`. |
| `WORKSPACE_MODE` | `secure-workspace.js` (`mode`) | inactive, guest, vault, locked | Checked by test only (source scan). Runtime not guarded, to avoid touching encryption code paths. |

## Implicit (candidates, by priority)

1. **Vault gate flags** – `booted`, `locking`, `hiddenAt`, `starting` in `secure-bootstrap.js` / `secure-workspace.js`. Combinations like `locking && !booted` are meant to be impossible; fold into one `gate` state (booting, entry, unlocked, locking, failed) next.
2. **Prediction records** – `pending -> settled` in `prediction-math.js`, `prediction-review.js`, `prediction-ui.js`. Two states, scattered checks.
3. **Quote observation precedence** – `priceKind` (`source-snapshot`, `daily-bar-close`, `regular-session-snapshot`) and `olderObservation()` in `native-prices.js`. A precedence rule, not a lifecycle; keep as a pure function with its tests.
4. **Source revision status** – `initial`, `identity-mismatch`, `older-acquisition`, `unavailable`, `unverified-date`, `not-comparable` in `source-integrity.js`. A classification result, not a lifecycle.
5. **Atlas view state** – `mode` (map/table/charts), `indicator`, `range`, `country` in `macro-atlas.js`; independent fields, low risk.
6. **Native price bucket cache** – per-bucket `{at,feed,promise}` in `native-prices.js`: fresh, stale, in-flight, last-good-fallback.
7. **Routes** – `canonicalRoute()` in `workspace-navigation.js` already centralises these.

## Rules for new lifecycles

- Name every state and legal move in `machines.js`; use `machine.assert(from,to)` where the write happens.
- Terminal states have an empty list. Recovery edges (like `running -> queued`) are written down, not implied.
- Add a line to the table above and a test that scans for undeclared literals.
