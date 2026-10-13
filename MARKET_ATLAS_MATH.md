# Market Atlas mathematics in Longhand Office

Integrated on 13 October 2026 with the owner's explicit request to reuse their [Market Atlas repository](https://github.com/Ridwanns/market-atlas). Reference commit: `c08ae40a4fb7295b006aec05914857689c0d3e4c`. The Market Atlas repository, original report, allocation targets and source datasets were not modified.

Open **Quant Lab**, then expand **Market Atlas · decision mathematics & reference studies** below Previous analyses. Everything remains on the same page. This is an addition to the existing fresh, ticker-specific core model runner; old immutable analyses, ledger records and backup formats are unchanged.

## Calculations you can run

`atlas-math.js` reuses the complete original `source/decision-math.js` formula implementation with only its global/CommonJS wrapper adapted into an ES module. The browser API exposes all seven original functions:

- Revenue/margin/dilution valuation with a supplied exit P/E.
- Total-earnings growth / EPS alternative, with separate dilution.
- Equity DCF using explicit annual FCFE per USD quoted share, or supplied base/per-share growth/horizon.
- Same-period USD asset / USD-IDR compounded return, and its USD-name alias.
- Portfolio shock with explicit starting weights and USD or IDR cash.
- IDR budget, supplied FX spread and proportional/fixed broker fees.

Year-end dividends, price CAGR, total return with dividend cash, timed-receipt IRR, hurdle-supporting maximum entry, DCF forecast/terminal present values and terminal-value share are retained. The optional annual FX assumption is supplied by the user, never inferred from a price feed. Revenue/shares use billions; TSM or another ADR requires an explicitly established quoted-share and USD basis. The calculator does not automatically translate company statements, treat ETFs as corporate earnings or relabel CFO minus capex as FCFE.

All fields start empty. **Load TEST ONLY example** is explicit. Invalid/missing inputs stay unavailable, loss-making P/E outputs are not zero price targets, and editing inputs clears obsolete results. Nothing writes portfolio valuations or trades.

Calculations stay in memory until **Export calculation**. **Restore calculation** validates the format/version and recomputes the retained outcomes before displaying them. It restores only the calculation desk; it cannot replace Office records. These standalone calculation files are separate from the existing complete portfolio/thesis/decision backup. Reloading without exporting loses the unsaved calculation.

## Complete retained model reference

The second view loads the owner's two public compressed study datasets from the pinned commit, verifies each SHA-256, and merges the identical shared studies plus SPY. Their fingerprints are:

| Source | SHA-256 |
| --- | --- |
| `data/quant-snapshot.json.gz` | `8be7adad041d2fcf6553b5cf12b2f80ce5a61bfa7bc7407fca6f58c8ea7317a6` |
| `data/focused-portfolio.json.gz` | `832e91146080883f57fb84dc7509819bc402c3f5cc78f44eb61ef63a465141d9` |

There are **14 instruments**: NVDA, TSM, INTC, AMD, MU, AVGO, ETN, VRT, ALAB, CRDO, SPY, S&P 500, Nasdaq Composite and IHSG. Both focused and original archived portfolio studies remain accessible. Their targets are illustrative allocations from that report, never imported as Office holdings.

All **17 model-family groups** are retained: Ridge, OLS, KNN50, histogram-stump boosting, AR(1), mean/zero baselines, purged conformal boosting, GARCH/EWMA/rolling volatility, HAR OHLC proxy, forward Gaussian HMM, historical VaR/ES, both seeded scenario studies, Kalman SPY beta, CAPM/FF3/FF5 with HAC, and delayed moving-average timing. Fourteen explorer sections expose the forecasts, evaluation, factors, risk, source definitions and parameter audits. Long arrays show a bounded initial sample; **Export complete selected study** retains all records, paths, values, configuration and source hashes.

These are **retained historical fitted results through 30 September 2026**, not new fits on the expanded ticker universe. Loading the study or refreshing quotes does not run/refit those advanced models. The original runner still depends on its Python/OHLC/factor environment; this release does not pretend GitHub Pages runs it. The existing fresh browser core runner continues separately. Full advanced fresh fitting for arbitrary US/IDX tickers remains a separate integration task.

Original Atlas direction accuracy is explicitly labelled **up versus non-up**; the fresh Office core uses negative/zero/positive. Variance fields retain their actual scale; daily squared-log-return variance is not presented as annual volatility. HAR uses its separate annualized OHLC proxy. IHSG retains unavailable USD beta/factor studies, with no substituted coefficients. Scenario bands remain process assumptions rather than validated prediction intervals. Source unit fields and model limitations remain inspectable.

Public source downloads are anonymous GETs without credentials or private parameters. Source failure, changed fingerprints or unsupported gzip browsers leave the study unavailable; the local calculators continue working. Both public files together transfer about 10.6 MB compressed only when explicitly loaded. No automatic polling is added.

## Verification

- **12,688 independent reference checks** reconcile realized source returns, matured chronology, RMSE/MAE/direction/interval scores, historical VaR/ES, covariance/shrinkage, variance contributions and costed portfolio replay. These verify retained arithmetic, not fresh fits or a prospective trading edge.
- **190 application tests**, including nine independent arithmetic regressions for the reused implementation.
- **20 Python tests** comparing hand calculations and the actual Office JavaScript module against the separate original Python implementation, including eleven detailed cross-language cases.
- **29 browser workflow checks**: all six calculator interfaces, isolated export/restore, altered output/source rejection, no obsolete results after editing, negative earnings, keyboard navigation, no record changes, anonymous source requests and 1440/768/390/320 px layouts.
- **18 calculator layout cases** additionally cover all six methods at desktop, 390 px and 320 px with touch enabled.
- Every **196 instrument/view combination** rendered without a JavaScript exception; SPY is included and IHSG's missing factor model stays missing.

The existing complete 22-step Investment Lab backup workflow and 22 same-page core Quant checks are rerun before publication. Calculator source files and pure Python verification code are public; personal calculator inputs and exported files are not committed or uploaded.

```powershell
npm test
python tests/atlas-parity.py -v
python scripts/verify-atlas-reference.py
```

The original formula guide remains [Market Atlas DECISION_MATH.md](https://github.com/Ridwanns/market-atlas/blob/c08ae40a4fb7295b006aec05914857689c0d3e4c/source/DECISION_MATH.md). The reused source fingerprint is `360d99e563af86a1a04f1d5811318168af6579416a5077d46009578b14e39678` before adapting the module wrapper.
