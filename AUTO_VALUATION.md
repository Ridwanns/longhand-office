# Automatic fundamental valuation

Implemented and tested 14 October 2026 (Asia/Jakarta). Open **Quant Lab → Market Atlas → Automatic valuation**. This is now the default Atlas view; the six original manual calculators remain under **Advanced manual calculators**.

Enter one US or IDX ticker and pause, or press Enter. The application retrieves its published source fundamentals and matching dated quote, calculates three scenarios and saves the study on this browser. The main research ticker also drives this desk automatically. Source facts and editable hypothetical assumptions remain separate. No manual formula selection is required.

## Numerical contract

- Native USD / IDR quote price, positive TTM EPS and reporting/listing currency compatibility are required for P/E scenarios. Missing/loss-making earnings are unavailable, never zero targets. No ADR or FX conversion is inferred.
- Current implied P/E = price / supplied TTM EPS. Reference assumes flat per-share earnings and the same multiple; its terminal price therefore equals the observed price. Downside/Upside use explicit ±5 percentage-point annual per-share growth and ±20% multiples. These mechanically anchored sensitivities are **not independent fair-value estimates**, analyst forecasts or calibrated probabilities.
- Default horizon: five years. Discounted entry = terminal scenario price / (1 + assumed required annual return)^years. Default required return is an illustrative 12%, not a sourced risk-free rate or estimated WACC. Future dividends are assumed zero; per-share earnings growth is not reduced again for dilution.
- Eligible DCF uses **annual CFO + signed capex + net issuance/payments of debt**, divided by same-period diluted average shares. CFO minus capex alone is not called FCFE. The source must confirm native currency, period, signs and a non-financial sector. Missing borrowing/share fields, incompatible currencies, nonpositive FCFE, financial companies and statements over 550 days old withhold DCF.
- DCF projects per-share FCFE with explicit growth stress, discounts each yearly payment, then discounts year N+1 terminal cash at year N. Defaults: central cost of equity 12%, ±2 percentage points, terminal growth 2%. Terminal growth must stay below every discount rate. Forecast PV, terminal PV and terminal share are shown separately.
- This is arithmetic from a historical annual base with assumed future conditions. It does not refit fundamental forecasts, normalize cyclical cash flows or adjust portfolio values. Fiscal-period dates are shown for annual statements. The source does not supply a TTM EPS period-end date; the interface says so.

## Data and reviewed repositories

Primary collection reuses the existing **Yahoo screener via yfinance 1.7.0**, plus bounded, two-worker annual statement collection for 24 selected US names and 10 selected IDX names. Existing workflow ticker inputs can add up to six further statement requests per publication (40-query cap). Statements and income share counts use the same latest common annual period; incomplete latest rows do not silently fall back to another year. Provider exceptions do not publish request URLs or credentials. Current input/output source files are ignored in `.pages-data` and only normalized public JSON is copied into the public artifact.

The complete existing publication workflow refreshes this public data every six hours, on a best-effort basis. The browser reads published JSON; no Python library runs inside GitHub Pages and no API/account secret is embedded. Quotes remain dated snapshots, not real-time streaming.

Reviewed references:

- [`noczero/idx-fundamental-analysis`, commit `038a44c9f247e13f2e43ff3bca266bdc4be03890`](https://github.com/noczero/idx-fundamental-analysis/tree/038a44c9f247e13f2e43ff3bca266bdc4be03890): README, pyproject, Yahoo/Stockbit providers, fundamental schemas and key-analysis/spreadsheet analysers. Applied the separation of provider extraction, normalized metrics and calculation. Its comprehensive fundamental source requires Stockbit authentication. That login, stealth browser, Google Sheets publishing and private credentials were not invoked. Metadata/README declare MIT; no LICENSE file was present in the inspected tree. No source code was copied. Missing-value-to-zero defaults and rank/percentage arithmetic were not reused.
- [`JECSand/yahoofinancials`, commit `2f2cc6c09e55361a72144cb94f9ba193266407ba`](https://github.com/JECSand/yahoofinancials/tree/2f2cc6c09e55361a72144cb94f9ba193266407ba): MIT license, setup, statement methods, raw maps/data/session/cache modules. Version 1.20 was installed only in the ignored test runtime and tested. AAPL statement requests succeeded, but an “annual” response included quarterly-date rows as well as annual rows. BBCA.JK exceeded a bounded 45-second subprocess deadline. These observations do not mean all IDX requests are impossible; they mean this wrapper was not accepted as the production annual-FCFE source. Both wrappers query Yahoo, so they are not independent data providers. The verified yfinance annual route remains primary.

Measured local publication: **8,516 fundamental records**, **8,496 valid matching prices**, **3,668 eligible earnings studies**, **23 eligible annual DCF studies**. Twenty source quotes were unavailable; 1,495 reporting/listing currency combinations were withheld. These are dated observations, not fixed coverage promises. Of the 34 selected statement queries, 23 US records were complete; PLTR lacked required components. IDX bank CFO-based DCF was withheld by policy, six non-financial IDX records lacked required matching components, and ADRO's reporting/listing currencies differed. Native IDR earnings scenarios work independently of DCF availability.

## Persistence and backups

Completed source/assumption studies append to a separate, path-scoped **IndexedDB** archive (`longhand-office.auto-valuations.<site path>`). Neither SQLite Office records nor portfolio/thesis/decision backup formats are changed. Loading the desk restores the last retained valuation; it does not silently reprice records or start another calculation.

**Export this valuation** works even if automatic storage fails. **Export valuation archive** retains all saved studies, source values, price/fundamental publication times, explicit settings, outcomes and formula version. **Restore valuation archive** recomputes every outcome, validates quote identity/currency/time, rejects tampering/duplicate or conflicting IDs, and adds records atomically. Existing studies and Office investment records are preserved. Imported attribution is unverified; reconciliation proves arithmetic, not source authenticity.

Maximum archive: 1,000 studies; import: 15 MB. Existing studies are not silently pruned. Clearing browser site data removes this device's archive. There is no account synchronization. Automatic studies do not replace manually supplied portfolio prices, place trades, create financial decisions or change the frozen Atlas reference studies.

## Verification

- **219 Node application checks**, including ten new independent automatic-valuation/identity/currency/overflow/missing-data cases.
- **Four Python annual cash-flow checks** independently cover signed borrowing/capex, missing debt, positive capex rejection and matched share periods. Existing reference suites retain their numerical checks.
- Whole-publication verification computes every priced fundamental record with the production engine and rejects malformed/inconsistent values before publication.
- **27 automatic-valuation browser checks** cover AAPL annual FCFE/DCF against a separate direct calculation, native-IDR BBCA earnings, bank and ADRO withholding, editable assumptions, reload, isolated additive backup restore, tamper/conflict rejection, 1440/768/390/320 widths, keyboard, reduced motion, coupled main ticker, GET-only public reads and unchanged Office record keys.
- Existing **29 Atlas checks**, **34 automatic ticker checks** and **22 complete Investment Lab/linked-backup checks** pass. Browser tests distinguish platform-owned download panels from application-opened workspaces.

Implementation: `auto-valuation-math.js`, `auto-valuation-ui.js`, `scripts/valuation-fundamentals.mjs`, `scripts/collect-valuation-cashflows.py`, `scripts/verify-valuation-data.mjs`. Browser tests/export fixtures/screenshots use isolated contexts and remain ignored in `validation/`.

Production verification: application commit `6a15db7a2befeb2dc74630a7e8abf1eaad657d55`, [Pages run 38439082562](https://github.com/Ridwanns/longhand-office/actions/runs/38439082562) and [CI run 38439082149](https://github.com/Ridwanns/longhand-office/actions/runs/38439082149) succeeded. All **27 automatic valuation browser checks** were repeated successfully on the public site in fresh isolated contexts. No JavaScript exceptions occurred. The local mobile/touch edition also completed MSFT in dark mode without horizontal overflow.
