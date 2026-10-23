# Data coverage and dated portfolio valuation

This release continues the approved data-quality, page-workflow and portfolio-valuation work. It does not claim that every provider or every global indicator is available.

## What changes

- Data Sources gains a generated inventory over the actual published stock/ETF snapshots, economic series, long market histories, Treasury yields, FX references and selected SEC evidence. Counts reconcile to retained inputs. Search, area/status filters, pagination, original-source links and a downloadable public report make source gaps inspectable. Quote availability, historical-model eligibility, earnings inputs and FCFE eligibility remain different properties.
- Observation age and acquisition age are shown separately. Annual fiscal/year-end dates are not shifted into the next year. A report assembly/check time does not renew a source acquisition. Other connected series are labelled as different connections, not silently substituted or combined.
- Portfolio holdings can preview exact-date completed raw closes from the existing public stock/ETF histories. The user reviews and appends a complete price set. Earlier prices and transactions are preserved; identical source records do not duplicate. Unknown cash, incompatible listings/currencies, missing dates, incomplete sessions and known split/share-basis risks withhold automatic use. Price storage uses six decimals and retains the original source value and hash. This workflow does not import brokerage positions or infer dividends, taxes, split restatements or FX trades.
- Performance studies can fill complete opening/closing NAVs and empty exact-date FX inputs for review. Direct pair direction and an explicit reciprocal are supported; unsupported cross-rates and absent dates stay unavailable. Published FX is a reference, not an execution-rate assertion. Exact pre/post-external-flow NAVs remain manual because a daily closing price cannot establish an intraday boundary.
- Automatically sourced NAV studies retain cash, quantities, original/rounded prices, individually rounded position values, dates and source hashes in their backup evidence. New studies freeze economically relevant ledger inputs through the study's closing date. Historical trade, fee or cash edits require re-review; later transactions outside the period do not invalidate an otherwise unchanged historical study. Legacy workbooks without the new fingerprint retain their earlier external-flow checks.
- Appending published closing prices updates the valuation section without clearing an unsaved performance form. Recorded-NAV lookup reads the current portfolio state. Data Sources' old backup-coverage wording is corrected.

## Source gaps and limits

Direct checks of the official SEC directory, submissions endpoint and company-facts endpoint returned HTTP 403 from this connection. No proxy bypass or fabricated official facts were added. The existing publication pipeline still attempts its configured official acquisition; unavailable records retain their reason. SEC's documented [EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) remain separate from provider fundamental snapshots and are not browser-CORS feeds.

The coverage table inventories supplied data; it does not independently certify provider truth, establish a data licence, declare a release overdue, or prove model accuracy. More complete portfolio automation still depends on complete personal records and compatible source observations. Private hosted sync and macro nowcasting are outside this update.

## Verification

Unit tests cover exact raw-close NAV arithmetic, cash/fee treatment, source identity and vintage checks, no session/adjusted-price substitution, split blocking, explicit FX inversion, ledger-change detection, retained evidence reconciliation, coverage totals, alternate-series separation and date freshness. Browser tests use disposable contexts and clearly labelled synthetic portfolio/source fixtures, including preservation of original records, idempotent price saves, sourced performance backups, provider-specific gap inspection and small-screen layouts. Published real data remain separate from those fixtures.

Before publication: 611 unit tests and 7 isolated API checks passed. The new browser workflow passed 23 checks; navigation passed 128, portfolio workspaces 49, encrypted backup 23, source loading 49, source safety 17, roadmap workflows 24, predictions 6 and release-cache behaviour 5. Desktop and 390/320-pixel layouts were inspected in disposable browser contexts. Publication reruns the existing independent reference and full market-model verification gates.
