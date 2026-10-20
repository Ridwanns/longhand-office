# Macro outlook and chart readability — 20 October 2026

The Macro workspace now has an **Outlook** destination with projections for the current quarter and the next three quarters. Reported observations, model projections and official survey expectations have distinct labels. The Monitor also has a searchable, grouped economic scorecard; selecting an indicator opens its existing exact-data explorer.

## Forecast method and accountability

`macro-ar1-v1` fits an AR(1) to at most 40 consecutive quarterly observations, with at least 24 required. The slope is limited to ±0.98 and the intercept recomputed from the training means. Each metric uses one eligible source history; a newer national observation is not spliced into another provider's history. GDP is real GDP YoY. Inflation is the published CPI YoY in March, June, September or December, not a quarterly average. Missing interior quarters break eligibility; annual data never becomes quarterly data.

The model recursively projects up to eight quarters from its source anchor. The displayed targets use the Asia/Jakarta calendar and can include an elapsed quarter still unreported by that source. Dashed chart segments identify these estimates. Point-path quads use unrounded changes; they have no assigned probability. The sensitivity table applies illustrative GDP/CPI shocks with the previous quarter fixed, without claiming causal effects or joint probabilities.

Walk-forward evaluation uses the same target quarters for AR(1), last-value naive and seasonal naive. MAE/RMSE are percentage points. Symmetric empirical 80% error bands require at least 12 resolved errors. Historical coverage calibration only uses errors whose target had resolved before that origin. The UI shows when AR(1) fails to beat naive. See the primary methodological reference, [Forecasting: Principles and Practice](https://otexts.com/fpp3/toolbox.html).

These checks use currently acquired, potentially revised history. They are **not** historical release-vintage backtests, a high-frequency activity nowcast, proof of future accuracy, or a consensus forecast. Overlapping errors are dependent. Downloaded evidence contains inputs, source hashes, cutoff, policy, parameters, projections and evaluations; it is a local snapshot without a certified timestamp or automatic prospective macro outcome registry.

## New source connections

Twenty additional Indonesia source records are validated independently. Nineteen have numeric observations in this acquisition. Together with existing primary and supporting records, the scorecard currently exposes 31 source records, 30 numeric. These are source-record counts, not 31 distinct economic concepts.

Bank Indonesia reviewed releases supply consumer confidence/expectations/current conditions, actual retail growth, quarterly PMI-BI, business-activity weighted net balance, capacity utilisation, M2 level/growth, credit growth, monthly reserves, import cover, core inflation, volatile-food inflation and administered-price inflation. Source links are attached to each record:

- [Consumer survey](https://www.bi.go.id/en/publikasi/ruang-media/news-release/Pages/sp_2821626.aspx)
- [Actual retail sales](https://www.bi.go.id/en/publikasi/ruang-media/news-release/Pages/sp_2821726.aspx)
- [Quarterly PMI-BI](https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2823126.aspx)
- [Business activity and capacity utilisation](https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2823026.aspx)
- [Money and credit](https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2819526.aspx)
- [Official reserve assets](https://www.bi.go.id/en/publikasi/ruang-media/news-release/Pages/sp_2821426.aspx)
- [BPS inflation composition reported by BI](https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2820926.aspx)

The review vintage remains fixed at `2026-10-20T12:50:07.847Z`, even when the publication pipeline runs again. Reviewed hashes identify the reviewed JSON records, not archived webpage bytes. Later BI releases require a new explicit review; the interface does not mislabel a pipeline run as a fresh manual source review. Q4 PMI-BI 52.37 and business activity 10.77 are separately sourced **survey expectations**, excluded from actual histories and model inputs. PMI-BI is a quarterly BI survey, not monthly S&P PMI.

[World Bank Global Economic Monitor](https://datacatalog.worldbank.org/infrastructure-data/search/dataset/0037798/global-economic-monitor) supplies industrial production, exports and imports. Country, indicator, unit, frequency and complete pagination are checked. Industrial growth compares the exact same month a year earlier; levels in USD millions become USD billions by dividing by 1,000. The trade balance subtracts exports/imports only for matching months and retains both component hashes. Missing observations remain null. GEM Indonesia real retail has no numeric observations in the acquired response and stays explicitly unavailable.

The date/freshness labels matter: GEM can lag the latest national release. Short BI histories do not receive a claimed ten-year range. Comparisons and ranges use the same source; for example, a newer BPS CPI reading is not ranked against an older BIS series. Six further gaps remain explicit: licensed monthly manufacturing PMI, vehicle sales, PPI, foreign investor flows, five-year CDS and a consensus/surprise archive.

## Chart presentation

All native analytical charts use 11-pixel screen labels, independent of SVG scaling, layout width, hidden/open panels and theme. Icons and geographic map labels retain their own semantics. Research plots use width-aware coordinates and approximately 310-pixel plotting canvases, with smaller headings and lighter grid lines. Macro, Treasury, bond ETF, commodity, equity and FX chart data are unchanged by the typography layer. No smoothing, interpolation, refit or missing-value replacement is introduced. Exact tables and keyboard/pointer inspection remain available.

## Verification

- 653 unit tests passed, including forecast eligibility, future-data rejection, gaps, calendar boundaries, provider separation and source transformations.
- Independent Python arithmetic reproduced 32,770 values/checks across 12 acquired-source metric cases, including OLS, recursion, naive/seasonal benchmarks and resolved-error calibration. This verifies arithmetic, not future accuracy.
- Browser checks: chart typography 90; Research charts 74; new outlook/scorecard 65; Treasury/rates 71. These cover 320–1660 px layouts, both themes, exact inspection, source immutability, future/actual separation and source-failure recovery.
- Existing macro supporting/explorer/release/map/error/navigation suites also passed during implementation. Static publication includes only allowlisted public client assets and public data, excluding private records and validation artifacts.

The six-priority status, including unconfigured private sync and remaining prospective validation work, is maintained in [ROADMAP_STATUS_2026_10_20.md](ROADMAP_STATUS_2026_10_20.md).
