# Quant Lab — local core release

## Workflow

Open **Quant Lab**, enter a US equity/ETF ticker, choose a cutoff, a 5- or 20-session horizon, a return basis and seed, then select **Run models**. The tab opens directly from that click before any asynchronous request. A normal persistent link appears if the browser blocks the tab. Markets offers the same action for US, IDX and bond ETFs.

Each URL is `/#quant/run/<UUID>`. Queued/running/failed/cancelled/completed states and timestamped stages come from the local job database. Reload recovers them; there are no guessed progress percentages. Two workers run concurrently; the queue admits at most 16 pending/running jobs. Provider acquisition is limited to 25 seconds and 12 MB; the whole worker is limited to 120 seconds. Cancellation terminates the worker. Retry and Rerun open a new run version, with fresh acquisition. Interrupted jobs are requeued when the server starts.

Identical normalized ticker/market/cutoff/horizon/basis/seed requests with the same implementation hash may reuse a completed result. The result explicitly names its cached source run and original retrieval time. There is no automatic cache expiry; use **Rerun** for new observations or provider revisions. Market snapshot refresh does not refit anything.

Use **Attach to research** on a completed result. Select a thesis or decision. Its reference retains the run ID, ticker, market, requested cutoff, model version and result hash. New runs do not replace that link. Both record types also retain public research and portfolio links.

## Acquisition and eligibility

US history comes from the fixed Yahoo chart host, five calendar years anchored to the requested cutoff, with daily closes and corporate-action metadata. Explicit period1/period2 are retained in the source URL. Earlier retained validation runs used the provider's rolling range=5y; their actual dates remain visible and immutable. Supported listings are USD equities/ETFs on the explicitly checked US venues. Unsupported indices, futures, FX, listings and currencies fail before fitting. Yahoo is a best-effort public source, without a service or real-time entitlement guarantee.

Current daily bars are excluded until the provider's regular-session end plus 15 minutes; fallback is 17:00 New York. Earlier exchange dates are eligible. Requested cutoff and last completed observation are shown separately. Runs during the open US session on 12 October 2026 used completed data through 9 October, even though Markets could show a 12 October snapshot.

Raw closes exclude dividends and can have split discontinuities. Yahoo adjusted closes are a provider split/dividend-adjusted total-return proxy, not exact after-tax investor returns. Historical adjustments are retrieval-vintage information, not a point-in-time corporate-action archive.

IDX reads only the owner's existing `127.0.0.1:8000/api/ticker/<TICKER>` endpoint, validates the returned ticker, and never ingests or changes its database. Flowless `adj_close = close * adj_factor` adjusts confirmed split/reverse-split/bonus-share events; it excludes dividends. The inspected implementation is `src/idxflow/splits.py` and `api.py` in the owner's checkout. Current BBCA history has **288** eligible sessions, below the **350**-observation minimum. Its full Quant run is unavailable. This threshold was not lowered to force a result.

No price is interpolated, forward-filled or replaced with zero. A known missing eligible close or gap longer than 10 calendar days starts a new segment; only the latest segment is fitted. Earlier excluded rows, omissions and segment breaks are retained. A missing latest completed close rejects the run rather than silently shifting its cutoff. Holidays/suspensions and absent provider rows are not reconstructed into a trading calendar. Horizons are observed eligible sessions, not calendar days or dated future trading promises.

## Mathematics

For positive selected prices, daily log return is `ln(P[t]/P[t-1])`. Annualized volatility is sample standard deviation × √252. Drawdown is price/running peak − 1. Rolling volatility uses 20 returns and sample variance. EWMA uses λ=.94, zero-mean squared log returns, starts at the first squared return, and annualizes its square root with √252.

Historical VaR/ES uses all overlapping h-session realized log returns, transformed into simple losses `1-exp(sum(r))`. VaR is the linearly interpolated 95th loss percentile; ES averages observed losses at or above that threshold. Counts, horizon, tail count and sign convention are retained. Positive means loss; negative means gain. This is a historical descriptive risk estimate with no distributional or future coverage guarantee.

AR(1) regresses the next daily log return on the prior one, with an intercept. It iterates fitted conditional expectations over 5 and 20 sessions. Ridge uses five recent return lags, rolling-20 mean and sample volatility; its target is the subsequent h-session cumulative log return. Features standardize with training-row means and population standard deviations only. Ridge penalty α=1 is fixed; intercept is unpenalized. No hyperparameter search uses evaluation outcomes.

Chronological evaluation starts at the greater of return index 220 and floor(60% of the sample). Origins advance by h, so scored target intervals do not overlap. Training target ends must be at or before the evaluation origin; future/unmatured labels are purged. Ridge requires at least 150 matured labels. AR uses only daily labels already observed. Zero and expanding historical-mean forecasts use the same scored origins as AR/Ridge. Final fits use only the eligible cutoff sample.

RMSE and MAE are log-return decimals. Direction accuracy compares three signs: negative, zero (absolute value ≤1e-12), positive. A zero forecast is correct only for a zero outcome. Exact scored counts and origin/target/training-end audit indices are exposed. Implied simple forecast return is exp(log forecast)−1; it is not a mean future market price or an order.

At least 20 eligible retrospective out-of-sample residuals are needed for a 90% empirical interval: forecast plus the 5th/95th residual quantiles. Smaller samples show unavailable. These intervals use the same retrospective evaluation sample, not a separate prospective calibration set. Model ranking is explicitly retrospective; choosing the best displayed score is not an unbiased test of that selected strategy.

Monte Carlo uses 1,000 independent paths with IID Gaussian daily log returns, sample mean and sample standard deviation from the eligible sample. A seeded xorshift32 generator and Box–Muller transform reproduce results for the same retained data/config/runtime. Charts show 5/25/50/75/95 percentile bands, the first 12 seeded paths and a 30-bin terminal distribution. They describe the assumed process, not validated forecast probabilities. Jumps, regimes, costs, taxes, serial dependence and parameter uncertainty are excluded. No HMM/GARCH/boosting/factor models were added.

## Audit and export

The local SQLite run stores listing/type/currency/timezone, provider/retrieval timestamp, cutoff, last completed session, raw and adjusted normalized observations, corporate actions where supplied, omitted/excluded rows, model version, parameters, seed, training/evaluation periods, scored predictions/errors, result/data/config/source hashes, implementation hash and worker runtime on new runs. Earlier validation runs made before runtime recording explicitly lack that field. Hashes establish consistency, not provider authenticity or a digital signature.

**Export this analysis** saves the complete retained run. Standalone analysis exports are audit files; they do not yet have a separate import screen. **Export records** includes every linked completed run with observations and results. Restoring that records backup into a connected vault restores records and absent linked runs atomically. Unlinked runs remain in the local archive and require their own export if you want an audit copy.

Results charts have expandable exact-value tables. Both themes, desktop/mobile layouts, keyboard interaction and reduced motion were checked. Animations do not refit or alter model results.

## Market Atlas reference audit

Inspected [Ridwanns/market-atlas](https://github.com/Ridwanns/market-atlas) at `dc8279db2942a060fbd982c117f74c782f40a3f4`, including README, QUANT_REFRESH, DECISION_MATH, ai_quant.py, decision_math.py and the tree/notices.

The analytical guidance on matured labels, training-only scaling, nonoverlapping evaluation, retrospective selection and seeded scenarios was useful. Its published snapshot is frozen at 30 September 2026, with fixed focus instruments/illustrative allocations; those are not this user's positions or live analyses.

`ai_quant.py` imports NumPy, SciPy and threadpoolctl, plus repository-external `fetch_data`, `models` and `visual_scenarios`. README also references an original `market_models/combined-market-report.html` build environment. Those dependencies are not supplied by the repository tree. We did not pretend the runner was independently runnable, copy frozen fits, or execute its publishing scripts.

No general top-level source-code license was present in the inspected tree. Font and design-asset notices apply to their named assets, not blanket source-code reuse. Longhand's mathematical implementation, SVG and UI additions were authored independently. No Market Atlas source code, fonts, frozen allocations or rendered assets were copied into this application. Existing system serif/sans fonts remain.

## Reproduction

`npm test` runs offline model/storage/adapter tests with clearly labelled synthetic fixtures. Start `npm run start:test` before `npm run test:api`. `python scripts/reference-quant.py` independently verifies the retained isolated AAPL run using Python statistics and a Cholesky Ridge solver, distinct from the JS elimination solver. Browser workflow and layout evidence are described in RELEASE_VALIDATION.md.
