# Manual portfolio valuation — 12 October 2026

The Investment Lab now accepts per-instrument **user-supplied price, currency, date and optional source**, retains price history, calculates market values and comparable unrealized profit/loss, and shows position weights and largest-position concentration. The architectural entrance and working-screen palette/typography are unchanged. No private data was deployed or published.

[Open the working TEST ONLY preview](http://127.0.0.1:4174/?preview=valuation). The test server must be running (`npm run start:test`). The ordinary office remains at http://127.0.0.1:4173/. Reload it to use the new screens with your own records.

The preview uses a dedicated storage key, **longhand-office.v1.valuation-preview**, on the separate port 4174 origin. It seeds labelled synthetic examples only when that preview key is absent. Preview edits persist to that key and cannot replace ordinary port 4173 records or the normal test workspace's records. All fixture prices are synthetic and unrelated to the linked public research report.

## Valuation rules

- Select an assessment date. Holdings, remaining cost and cash come from recorded transactions up to that date. The latest supplied price dated on or before that date is used. If several prices share a date, the last recorded one wins.
- A price is **outdated after 30 calendar days** relative to the assessment date. Missing and future-dated prices are unavailable. An explicitly supplied price of zero is distinguished from an absent price.
- Market value = held quantity × supplied price. Unrealized profit/loss = market value − remaining recorded cost, only if the supplied currency matches the recorded-cost currency. Sale fees remain part of the ledger's realized results; hypothetical future exit fees are not deducted from unrealized profit.
- A complete portfolio value includes recorded cash and requires current prices for every holding in the portfolio currency. A missing/outdated price, unknown cash or incompatible currency withholds the complete total. Known components are labelled as subtotals; a missing holding is never silently assigned zero.
- Position weights use the relevant currency bucket. Base-currency weights include known cash. Foreign-currency weights use that currency's priced holdings only. They are not comparable consolidated portfolio weights. Missing/outdated price coverage withholds weights. Unknown base-currency cash withholds base-currency weights.
- Largest-position concentration means the largest security position's share of complete portfolio value including cash. Mixed-currency valuations have no consolidated concentration. Separate bucket concentrations may be shown only with current price coverage and a valid denominator. A zero denominator produces unavailable concentration.

## Independent example

All amounts and instruments below are **TEST ONLY**, in USD. Start with supplied cash of **5,000**:

1. Buy 10 ALPHA at 100 with a fee of 10: cash becomes 3,990; cost 1,010.
2. Buy 20 BETA at 50 with a fee of 5: cash becomes 2,985; BETA cost 1,005.
3. Sell 2 ALPHA at 120 with a fee of 2: net proceeds 238; cash becomes **3,223**. Released weighted-average cost is 202; realized profit is 36. Remaining ALPHA is 8 units with recorded cost **808**.

Supply valuation prices dated **12 October 2026**:

| Instrument | Held units | Remaining recorded cost | User-supplied price | Market value | Unrealized P/L | Weight including cash |
|---|---:|---:|---:|---:|---:|---:|
| ALPHA | 8 | 808 | 130 USD | 1,040 USD | +232 USD | 20.143328% |
| BETA | 20 | 1,005 | 45 USD | 900 USD | −105 USD | 17.431726% |

Holdings market value is **1,940 USD**, unrealized profit is **127 USD**, total value including cash is **5,163 USD**, and the largest position is **ALPHA at 20.143328%**. This is test arithmetic, not a market observation or a personal portfolio result.

`scripts/reference-valuation.py` checks the example with Python Decimal without importing or reusing the JavaScript ledger or valuation code. Additional model examples cover fractional amounts, zero prices/totals, historical positions and complete liquidation.

If BETA has **no price**, the screen shows ALPHA value plus known cash as a **4,263 USD known-components subtotal**, and withholds the full value and concentration. BETA's value and unrealized P/L are unavailable.

If BETA's supplied price is instead **45 EUR**, it shows **4,263 USD** and **900 EUR** separately. There is no combined total, exchange rate or EUR-to-USD unrealized P/L. ALPHA's weight becomes its share of the USD bucket, and BETA's weight is its share of the EUR holdings bucket; both bases are labelled.

If the assessment date advances to **12 November 2026**, the 12 October prices are 31 days old. Their dated values remain visible, but both are flagged outdated and the complete total/concentration are withheld.

## Verification

**52 model tests passed**, including the prior ledger/backup suite and 26 valuation cases. **35 new browser assertions passed** in fresh source/restore contexts, using only labelled test records. The existing **34 workflow and 11 record-safety browser checks** also passed again after this extension. The valuation suite:

- Restored a fixture without prices, then entered both prices through the forms, including currency, date and source.
- Checked missing-price behavior, independent market values/unrealized profit, cash-inclusive total and concentration, historical dates, outdated/future prices, mixed currencies and negative-price rejection.
- Compared transactions, linked theses, decisions and report IDs before and after supplying prices. Only the new valuation records changed.
- Reloaded and compared every field. Exported through the app, restored the downloaded file into a second empty context, compared all records field-for-field and reloaded again. A malformed valuation backup was rejected without overwriting the restored records.
- Checked responsive widths of **320, 390 and 768 pixels**, desktop presentation, keyboard table scrolling, touch form opening, modal focus, Cancel and reduced motion.
- Verified preview storage is separate from normal test records, and compared the existing original browser record value before and after: **unchanged**. No uncaught browser errors occurred.

Evidence: `tests/valuation.test.mjs`, `tests/valuation-browser.mjs`, `validation/valuation-results.json` and the downloaded `validation/TEST-ONLY-valuation-backup.json`. `npm test` reruns model tests; `python scripts/reference-valuation.py` reruns the independent reference. Existing backup/version and legacy higher-precision transaction fields remain intact.

![Desktop manual valuation](<C:/Users/user/OneDrive/Documents/Longhand Office/validation/valuation-summary-desktop.png>)

![Missing-price handling](<C:/Users/user/OneDrive/Documents/Longhand Office/validation/valuation-missing.png>)

![Mixed-currency handling](<C:/Users/user/OneDrive/Documents/Longhand Office/validation/valuation-mixed.png>)

![Mobile manual valuation](<C:/Users/user/OneDrive/Documents/Longhand Office/validation/valuation-summary-mobile.png>)

## Remaining limitations

Prices and sources are manual and unverified. The 30-day age rule is a fixed basic freshness check, not a statement that a price is executable or appropriate. No live feed, exchange rates, converted totals, cross-currency gains, dividends, splits, deposits/withdrawals, tax-lot methods or prospective sale fees were added. Each portfolio has one recorded transaction/cash currency; another price currency is kept separate.

Valuation records are append-only. Supply a newer price, or a correction with the same price date, to supersede an earlier entry; history is retained. The assessment-date selector is a view setting that defaults to today in Asia/Jakarta on reload; stored price dates persist and are included in backups. Quantities/prices are displayed to at most six decimals, and weights may have small displayed rounding differences.

The app remains loopback-only and uses unencrypted browser local storage; clearing that browser profile's site data removes records. Authentication and server-side access control remain prerequisites for any hosted private release. Responsive/keyboard/touch checks are targeted verification rather than a complete assistive-technology audit.
