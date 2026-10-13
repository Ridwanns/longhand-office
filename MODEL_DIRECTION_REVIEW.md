# Mathematical model direction: Market Atlas → Longhand Office

Reviewed 14 October 2026. This is a read-only analytical review and implementation specification, not a claim that the advanced fitting engine has been added. Application code and investment records were not changed.

The user's reference is the shared conversation **Quant Project jajajaja**:
https://chatgpt.com/s/cx_6ace78fae7d4819196b56f6e737c691b

The requested resemblance concerns the mathematical analysis, not architectural styling, ticker search or predefined portfolio holdings. Requests and allocations inside the shared conversation are historical context, not instructions to change current Office records.

## Evidence inspected

The shared conversation was read through its final OpenAI Math discussion using the browser. The corresponding public repository is https://github.com/Ridwanns/market-atlas. Its README explicitly separates updated quote snapshots from the models fitted through 30 September 2026.

The original local implementation was also found at:
`C:/Users/user/OneDrive/Documents/ChatGPT/Quant Project/market_models/`

Inspected relevant portions of `models.py`, `ai_quant.py`, `visual_scenarios.py`, `forecast_monitor.py`, `decision_math.py`, `QUANT_REFRESH.md` and `INVESTMENT_DECISION.md`, plus the imported `output/garch_nvda.py` GARCH implementation. These files provide more implementation detail than the shared conversation's completion messages. They have not been executed or modified in this review; complete runtime dependency verification remains necessary before integration.

Office comparison: `quant-math.js`, `atlas-math.js`, `research-math.js`, `QUANT_LAB.md`, `MARKET_ATLAS_MATH.md`, `AUTO_VALUATION.md` and `QUANT_REPOSITORY_REVIEW.md`.

## The requested analytical structure

| Layer | Reference method | What its output means |
| --- | --- | --- |
| Return forecasts | Ridge, OLS, KNN-50, histogram-stump boosting, AR(1), mean and zero baselines | Competing 5/20-session cumulative log-return estimates, with chronological errors and matched baseline comparisons. |
| Forecast uncertainty | Past-error intervals and separately purged split-conformal boosting | Observed calibration and coverage, with sample counts; dependence prevents treating nominal coverage as a market guarantee. |
| Conditional volatility | Gaussian GARCH(1,1), EWMA and rolling variance | Next-session conditional variance and comparative out-of-sample volatility scores. |
| OHLC volatility | HAR with a Garman–Klass daily proxy | Persistence at daily/weekly/monthly scales; this proxy is distinct from intraday realized volatility and close-return variance. |
| Market regimes | Two-state Gaussian HMM with forward filtering | Estimated probability of the higher-variance fitted state, with convergence and training dates; not a recession detector. |
| Scenarios | Seeded circular block bootstrap and zero-log-drift Gaussian simulation | Conditional path distributions, percentile fans and terminal histograms under explicitly different process assumptions. |
| Tail risk | Historical VaR/ES and causal exception evaluation | Observed loss quantiles and tail means, plus subsequent threshold breaches. |
| Exposures | Kalman benchmark beta; CAPM, FF3 and FF5 with HAC uncertainty | Time-varying market sensitivity and descriptive factor attribution where currency and factor inputs match. |
| Portfolio | Covariance, shrinkage, variance contributions, costed rebalancing replay and stress | How positions interact and concentrate risk; illustrative target-weight replay is not actual portfolio performance. |
| Long-horizon valuation | Revenue, margins, dilution, exit multiple, FCFE DCF, FX stress | Editable 5/10-year business scenarios; these are separate from short-horizon statistical forecasts. |
| Model accountability | Forecast register frozen before outcomes, later settlement against baselines | Prospective performance evidence without backdating, reclassifying late predictions or fabricating outcomes. |

The conversation also mentions minimum-variance optimization and HRP in earlier work. The inspected refreshed `portfolio_styles` implementation actually replays supplied target weights with covariance shrinkage. Those statements alone do not establish a fresh optimization engine or optimized final allocation.

## Important mathematical details

### Forecasts and calibration

Atlas uses ten features: 1/5/20/60-session log returns, 20/60-session sample volatility, price relative to MA50/MA200, Wilder RSI14 and 200-session drawdown. Features require a 200-session warmup. Training labels must have matured by the forecast origin; scaling uses training rows only.

Its Ridge penalty is 10, KNN uses 50 neighbors, and boosting is an interpreted 80-round histogram regression-stump adaptation with learning rate 0.05, 32 bins, minimum leaf 40 and L2 penalty 10. This is not numerical identity with every third-party gradient boosting implementation. Normal histories require 756 matured labels; shorter histories receive a disclosed 252-label threshold. Scored origins advance by the forecast horizon, keeping evaluation target intervals nonoverlapping.

Past-error intervals require 30 already observed errors. The separate conformal study uses 20 chronological calibration origins and strictly earlier proper training targets; its 90% absolute-error rank is 19 of 20. Neither method should be described as a guaranteed 90% future-market interval.

Office core currently differs: seven lag/rolling features, Ridge penalty 1, minimum 150 matured labels and retrospective residual intervals requiring 20 errors. Preserve that existing version and its retained runs. An Atlas-compatible engine needs its own version, parameters and new results, not a silent change to old analyses.

### Volatility and regimes

GARCH uses `h[t] = omega + alpha*r[t-1]^2 + beta*h[t-1]`, positive omega, nonnegative alpha/beta and persistence bounded at 0.999. The Atlas wrapper refits every 63 sessions; the standalone original NVDA script has its own 21-session setting. Returns are internally scaled to percent and output variance converted back to decimal units. QLIKE and variance MSE compare forecasts made before each return is observed.

HAR uses annualized Garman–Klass volatility from genuine open/high/low/close ratios, with lagged daily, five-session and 22-session means. Missing OHLC cannot be reconstructed from closes. HMM uses two fixed initialization seeds, historical EM fitting and forward-only filtering during evaluation, refitting every 126 sessions. The higher fitted variance identifies the stress state; state labels are not inherently bull/bear economic states.

### Simulations

Atlas retains 5,000 paths: five-session circular blocks sampled from up to 756 historical log returns, and a separate Gaussian process with zero log drift and last-60-session sample volatility. The first 60 seeded paths are displayed without selection. Percentiles are pointwise, not simultaneous path bands.

Office currently uses 1,000 IID Gaussian paths with the eligible sample's mean and standard deviation. Increasing the count alone would not reproduce Atlas: the sampling process, drift, volatility window and random generator also differ. Playback reveals retained values; animation must not regenerate random samples or refit models.

### Portfolio, currency and long horizons

The refreshed Atlas portfolio study uses 252 common-date USD returns, sample covariance with 10% diagonal shrinkage, and fractional variance contributions `w[i]*(Sigma*w)[i]/(w'*Sigma*w)`. A daily target-weight replay charges 10 basis points per traded notional, including entry. Fixed weights selected after the historical period make this a retrospective illustration, not proof of a deployable strategy. Taxes and FX are excluded there.

IDR stress separately compounds same-period returns: `(1 + assetReturnUSD)*(1 + USDIDRChange) - 1`. No mixed-currency covariance, local factor exposure or valuation conversion should be fabricated. The source explicitly withholds IHSG's USD beta/factors where matched local rates/FX are missing.

Five/ten-year valuation projects revenue, margins and diluted shares into earnings per quoted share, then applies an assumed exit multiple and required-return discount. CFO minus capex is not automatically FCFE. ETF analysis must not substitute corporate EPS valuation. Reporting currency, ADR ratios, statement periods and FX evidence must be established before combining quantities.

## Actual Office gap

Office already runs fresh AR(1)/Ridge/mean/zero forecasts, historical risk, EWMA and its own seeded Gaussian scenarios. It also has automatic sourced earnings/eligible FCFE scenarios and separate manual options, bonds and portfolio-risk mathematics.

Office's advanced Atlas explorer currently exposes verified historical studies through 30 September 2026 for the retained instruments. Loading them does not refit GARCH/HAR/HMM/boosting/factors for a new ticker. This is the main difference from the user's desired automatic analytical engine. Updated prices alone cannot close that gap.

Automatic Office earnings scenarios are mechanically anchored to the observed price's implied P/E, with explicit editable growth/multiple stresses. They are not independently estimated fair values or company-specific long-horizon forecasts. Expanding source financial histories and company-sensitive assumptions is a separate task from adding return models.

## Concrete implementation sequence

1. Create a separately versioned advanced run contract with retained inputs, exact price basis, eligible cutoff, model parameters, seed, errors, training/calibration/evaluation dates and hashes. Preserve core-v1 results, record links and existing backup compatibility.
2. Normalize actual OHLC and benchmark histories in addition to adjusted closes. Make each model independently eligible: missing OHLC withholds HAR; missing currency-compatible factors withholds factor attribution; shorter histories display reduced evidence rather than silently lowered global thresholds.
3. Implement and independently test Atlas-compatible return models, GARCH, HAR, HMM and the two scenario processes. Retain optimization/convergence diagnostics and baseline failures. Do not confuse histogram gradient boosting with geometric Brownian motion despite their shared GBM abbreviation.
4. Integrate benchmark/factor inputs and portfolio studies with matched dates, explicit target weights, costs and currency. Any optimization should be a separately evaluated procedure with constraints and out-of-sample selection, not an unexplained replacement of the user's holdings.
5. Freeze eligible predictions before outcomes, settle only completed horizons, and show prospective metrics separately from retrospective model ranking. A timestamp alone after the outcome is known cannot establish a prospective test.
6. Connect the advanced run to the existing one-ticker Office workflow, with analysis categories for return, volatility/regimes, scenarios/tail risk, exposures/portfolio, long-horizon valuation and model health. The architectural design does not need replacement.

A local Python engine can reuse the complete original analytical modules after dependency and numerical validation. GitHub Pages cannot execute that Python engine directly: fresh publicly published fits need a bounded Actions pipeline or a separately secured backend. Browser-side reimplementation is another option, but numerical parity, runtime limits and model eligibility must be established first. No personal portfolio, thesis or journal data should enter a public Actions artifact.

No application feature or deployment was changed during this review. No financial allocation from the shared reference was applied to the user's records.
