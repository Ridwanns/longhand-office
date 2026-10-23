# Investment Lab validation — 12 October 2026

The complete workflow passed in fresh browser contexts on **http://127.0.0.1:4174**. Every record is labelled **TEST ONLY**. The normal workspace remains on port 4173. Its existing local-storage value was compared before and after both browser suites and was unchanged. No new office modules or public deployment were added.

The test source and restore target used separate browser contexts, so they did not share a profile or local storage. Restore was performed only into the empty test target. A sentinel on port 4173 inside that isolated context remained unchanged after restoring port 4174. Tests closed their disposable contexts afterward; the normal workspace never received the test records.

## The tested workflow

1. Searched the Library for **Coal Still Burns. Trade Is Changing.**, a published Longhand Research report. Used **Use in a thesis** and verified the report was preselected and its ID persisted in **TEST ONLY — coal sector evidence exercise**. Filled assumptions, supporting evidence, risks and a review date of **12 October 2026**.
2. Created **TEST ONLY — weighted-average paper portfolio**, currency **USD**, with user-supplied simulated opening cash of **10,000**. Recorded the four transactions below. Every note identifies the price as a synthetic test input, not a market quote.
3. Created **TEST ONLY — simulated entry and partial exits** from the thesis. Linked the thesis, the paper portfolio and the report. Recorded the original expectation and a review date of **12 October 2026**.
4. Recorded an outcome review comparing cash, holdings, fees and realized profit to the independent calculation. Verified the status changed to **Reviewed**.
5. Reloaded the app. Compared the saved data before and after, including every report, thesis and portfolio ID, the review date and the outcome text. Opened the decision editor again and checked that both record links were selected.
6. Exported JSON through the app. Restored that downloaded file through the app's file picker and explicit replacement checkbox in a second empty test context. Compared every record field to the export, then reloaded and compared again. An invalid backup was rejected without changing the restored records.

## Independently checked example

All inputs below are **test data**, in USD. The prices have no relationship to the selected report or a real security. Starting cash: **10,000**.

| Date | Transaction | Quantity | Supplied price | Fee | Cash after | Shares held | Remaining recorded cost | Realized P/L on sale |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 1 Oct 2026 | Buy | 100 | 20 | 10 | 7,990 | 100 | 2,010 | — |
| 2 Oct 2026 | Buy | 50 | 24 | 5 | 6,785 | 150 | 3,215 | — |
| 3 Oct 2026 | Sell | 60 | 30 | 6 | 8,579 | 90 | 1,929 | +508 |
| 4 Oct 2026 | Sell | 30 | 18 | 3 | 9,116 | 60 | 1,286 | −106 |

After both buys, cost is `(100 × 20 + 10) + (50 × 24 + 5) = 3,215`. Selling 60 of 150 shares releases `3,215 × 60 / 150 = 1,286` of cost; net sale proceeds are `60 × 30 − 6 = 1,794`; realized profit is `1,794 − 1,286 = 508`. The second sale releases 643 of cost and receives 537 net, producing a loss of 106.

**Final result:** cash **9,116**, holdings **60 shares**, remaining recorded cost **1,286**, average recorded cost **21.433333/share**, fees **24**, realized profit **402**. Remaining cost is not a market valuation. Market value and unrealized profit are unknown.

The JavaScript ledger was compared with an independent **Python Decimal** calculation in `scripts/reference-calculations.py`, which does not import or reuse the JavaScript implementation. Model tests additionally check full liquidation: another 60-share sale at 25 with a fee of 4 produces zero remaining shares/cost, total realized profit **612**, fees **28** and cash **10,612**. A fractional-share example independently checks cost rounding and residue release on the final sale.

## What passed and what changed

- **26 model tests** passed: whole and fractional shares, multiple instruments, fees, full liquidation, unknown versus zero opening cash, insufficient cash, backdated trades, same-day ordering, excessive selling, invalid dates/numbers, legacy compatibility and backup validation.
- **34 workflow browser assertions** passed: the six steps above, invalid-input rejection, responsive layouts at 320/390/768 pixels, keyboard-scrollable tables, modal focus, Escape, room navigation and reduced motion.
- **11 record-safety assertions** passed: no write when loading old records, unknown legacy cash, unavailable report-reference retention, preservation of higher-precision transactions, legacy decisions, stale-save protection, storage events, concurrent restore protection and a delayed-file-selection race.
- A separate **touch-enabled mobile context** passed tap navigation, backup restore, transaction-editor opening and Cancel. Reverse keyboard traversal wrapped from the first editor control to the last. Computed muted-text contrast was checked in the browser at **4.80:1**.
- Added the missing **decision → portfolio** relationship, optional opening cash, funded-cash checks, fees and realized profit using an explicit weighted-average convention.
- Corrected the distinction between **net cash outlay** and **remaining cost** after sales. The old screen displayed cash outlay only, which was insufficient to determine retained cost or realized profit.
- Replaced floating-point accumulation with integer decimal calculations. Fractional oversales are rejected without an epsilon loophole.
- Fixed Tab escaping the editor at its final control. Added labelled, focusable scroll regions and table captions for mobile keyboard access.
- Fixed the room-purpose hint being cleared by a mouse hover while a room retained keyboard focus. Keyboard focus now takes precedence for that hint.
- Increased muted interface-text contrast from **3.99:1 to 4.80:1** against warm ivory; the palette, typography and courtyard illustration remain intact. Improved note-column width to avoid unnecessarily tall mobile transaction rows.
- Prevented a stale editor or restore from overwriting newer stored records. A later file selection now takes precedence over an earlier slow file read. Report IDs absent from the current catalogue remain attached when editing.

## Screenshots from the test environment

The architecture remains the same. The isolated banner and TEST ONLY names distinguish evidence from personal investment data.

![Test paper portfolio and calculations](<C:/Users/user/OneDrive/Documents/Longhand Office/validation/portfolio-desktop.png>)

![Test decision linked to thesis and portfolio, with completed outcome review](<C:/Users/user/OneDrive/Documents/Longhand Office/validation/decision-desktop.png>)

![Mobile paper portfolio](<C:/Users/user/OneDrive/Documents/Longhand Office/validation/portfolio-mobile.png>)

## Evidence and limitations

The downloaded **validation/TEST-ONLY-backup.json** contains only test records. **validation/results.json** and **validation/record-safety-results.json** contain individual pass results. Browser suites are retained in `tests/validate-workflow.mjs` and `tests/record-safety.mjs`; they run against a fresh context with the isolated server started by `npm run start:test`. `npm test` runs the model suite. `python scripts/reference-calculations.py` reruns the independent whole-share example.

The release remains local and stores records in browser local storage. No automatic migration writes to existing records. Browser storage is unencrypted and clearing site data removes it; private hosting still requires server-side authentication and access control.

Opening cash without a date represents cash available before the first recorded transaction. Subsequent deposits and withdrawals are not supported. Cash availability cannot be checked where opening cash was never supplied; the screen explicitly states that limitation. Fees use the portfolio currency. There is no market-price feed, unrealized return, currency conversion, dividends, splits, short selling or alternative tax-lot method. Same-day transactions use recorded order. These are targeted accessibility and browser checks, not a comprehensive assistive-technology audit or a hosted security review.
