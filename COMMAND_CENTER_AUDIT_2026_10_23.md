# Investment Command Center and data re-audit

Date: 23 October 2026 (Asia/Jakarta).

## Delivered behavior

Overview becomes a compact investment desk, based on the owner's supplied Command Center/CIO Desk reference and the existing Figma Economic Pulse design tokens. The architecture illustration remains in About Longhand. Existing navigation, browser records, saved research and normal password-free access remain available.

Four dated market cards accompany a straight-line base-100 comparison. Only actual common source dates are plotted; holidays and missing sessions are not filled, prices are not smoothed, currencies are not converted, income is excluded, and gold retains its futures-series basis. Current quote snapshots are separate from the chart's history cutoff. USD/IDR and the official 10-year Treasury par yield keep their own units outside the comparison. A compact overview publication (approximately 207 KB before compression in the local check) is derived from the fully validated feeds instead of making the opening page download the 11 MB full market history.

Real and Paper records are separate. Each currency has its own NAV and P&L. Incomplete prices, stale prices under the existing 30-calendar-day policy, unknown cash or currency mismatch withhold whole-group totals. Recorded unrealized P&L is not total portfolio performance or TWR/MWR. Allocation includes known cash in the denominator and never substitutes instrument-history risk for actual portfolio risk. Empty records have no invented account balance, concentration or track record.

Macro uses the existing synchronized-quarter calculation, not a static screenshot label. At the audited vintage, Indonesia and the US both have a common Q2 2026 reading. Indonesia is Quad 4; the US is Quad 3. This is GDP YoY rate change versus the previous quarter plus quarter-end CPI YoY rate change. It is not quarterly-average inflation, a current-quarter nowcast, an allocation instruction or a forecast. A latest-month release can give a different mixed-period quadrant, so it is not relabelled a synchronized quarter.

Important values and the chart date scrubber remain visible. Source detail stays in Data Sources or the exact-observation disclosure. Interface copy received 81 targeted revisions across 23 files for semicolons, slashes, fragments and overloaded labels. URLs, IDs, financial operators, currency-pair notation, decimal formatting and mathematical signs were preserved. A corrupt multiplication glyph in a reconciliation error message was corrected to ×.

## Public-data coverage and findings

Detailed raw download receipts and full audit outputs are in the ignored `validation/reaudit-2026-10-23/` folder. These are factual observations of the audited source vintages, not a guarantee that all future provider data will remain unchanged.

- All 8,421 base quote records and 8,421 price-refresh entries passed source identity, timestamp, unit and numerical contract checks. All 1,553 published stock/ETF history files were retrieved and inspected structurally, covering 1,776,817 rows. Structural validity does not prove source correctness.
- A fresh, independently parsed same-provider comparison covered 51 long market histories, 21 Treasury year files and two FX series. It compared 241,413 closes, 70,056 yield cells and 5,216 FX cells. Forty-four matching-timestamp quotes matched; seven quotes had a different observation time and were not treated as same-time discrepancies. Twenty-two previously retained long-history dates are now missing/null at the provider, including after narrow retries. Those are unresolved source-vintage differences, not certified current matches or proof of fabrication.
- Twelve additional stock/ETF samples matched their raw closes and same-time quotes. Reacquisition also exposed ordinary open/volume revisions and small adjusted-price revisions. Adjusted retrieval vintages must remain distinct from raw close prices.
- Eighty-three OHLC consistency anomalies occurred across 78 histories. Independent samples reproduce them at Yahoo, including opens/closes outside the supplied high/low range. The current close-based models do not consume those OHLC fields. Such data must not silently feed future candlestick or range-based risk analysis.
- MTF=F coal has an observation from February 2025 even though its file was acquired recently. The watchlist now displays the source year and an explicit outdated-snapshot marker. This contract is not included among overview headline/comparison assets. No acquired time is promoted to a current market observation or verified real-time entitlement.
- Macro audit covers 582 source-series records across five feeds, not 582 unique economic indicators. The public context contains 46 economies. Independent source reconciliation found no arithmetic mismatches in the compared automatic observations. Twelve records have no numeric data (three context, eight regional releases, one supplementary indicator); their missing values remain explicit.
- The New Zealand reviewed CPI series was stale at June 2026. The official [Stats NZ September-quarter release](https://www.stats.govt.nz/information-releases/consumers-price-index-september-2026-quarter/) published 22 October reports 3.7% annual inflation and 0.7% quarterly inflation. The registry appends 3.7% to the YoY series, preserves all prior values, and updates only the NZ review date and source URL. It does not substitute the quarterly 0.7% value into a YoY chart. The standard extended collector rebuilt all 123 series and the independent audit passed 43,697 observations with no failures or retained-source exception.

## Mathematical verification and limits

The numerical agent ran 189 existing targeted tests and 136 separate Python comparisons across two actual retained AAPL runs and two explicitly synthetic test configurations. Reviewed eligible calculation paths showed no demonstrated arithmetic defect: geometric TWR, dated ACT/365 MWR with ambiguity guards, exact-date FX interaction, earnings sensitivity, FCFE currency/period/shares gates, volatility/drawdown, matured-target forecasting and seeded Monte Carlo all retained their stated conventions. Simulation paths remain separate from terminal counts.

The audited retained fundamentals directory has 8,326 records but only 23 complete automatic annual FCFE packets, all US, and none IDX. This is not complete issuer-statement verification. Reviewed primary IDX filings still cover 10 issuers, with their existing scope, share-count and currency qualifications. No missing Indonesian cashflow or share denominator is invented.

The main audit prior to final UI refinements passed 747 unit tests. Four further overview publication-contract tests and 13 new overview numerical tests cover missing-data withholding, Real/Paper and currency isolation, exact common dates, invalid scales and source identities. Browser checks cover responsive widths 320–1440, light/dark mode, actual saved synthetic portfolios, interactive ranges/country controls and optional old-vault compatibility. Final CI and public verification provide the deployment check.

No owner portfolio, private backup, browser password, Pluang account or brokerage order was accessed or modified. Only public data and isolated synthetic test records were used. This work does not establish a licensed real-time feed or certify every external observation.


## Compact chart revision, 23 October 2026

The Overview now uses a purpose-built percent-price-change plot, with straight source-point segments, calendar-date spacing, a zero baseline, stable instrument colours, readable percentage ticks, collision-separated endpoint labels and an immediately available date inspector. All paths use the original common-date intersection. These are price returns in original quote currencies, excluding income; no FX conversion or interpolated observations are introduced. Repeated mini charts and the duplicate standalone 10Y quote are removed.

A Treasury maturity curve adds 2Y, 5Y, 10Y, 20Y and 30Y par yields from the latest applicable row of the already validated official-rates publication. All tenor values and the 10Y minus 2Y basis-point spread share that date. Missing tenors remain null and break the curve; a missing spread input withholds the spread. Original provenance and acquisition time are retained. This UI release reuses the last successfully published source snapshot, rather than labelling reused observations as newly acquired.

Verification: 754 unit checks passed; the updated Command Center browser suite passed 24 checks, including responsive widths from 320 to 1440 pixels, immediately available inspection, exact zero-percent common starting values, Real/Paper and currency isolation, and no JavaScript errors. Ordinary-entry browser coverage passed 11 additional checks. Desktop, mobile and dark appearances were visually reviewed. No owner portfolio records or connected brokerage accounts were accessed.
