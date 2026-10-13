# Quant repository review and applied research toolkit

Reviewed 13 October 2026. This review covers each repository's README, structure, license/dependency requirements and relevant numerical/provider modules and tests. It is not a claim to have executed every SDK or read every unrelated file.

| Repository / pinned commit | Role and inspected implementation | Applied in Office |
| --- | --- | --- |
| [awesome-quant](https://github.com/wilsonfreitas/awesome-quant/tree/48e48a76b2054b5fe6eede6852ffef7783b992ce) | Catalogue of pricing, portfolio/risk, numerical and data-provider projects. A reference list, not a runtime engine. | Guides selection of a focused pricing/risk toolkit. No claim that its many listed packages are installed. |
| [GS Quant](https://github.com/goldmansachs/gs-quant/tree/bbe7071653ccfc0d431e11c3a31dbd511afc394f) | `timeseries/statistics.py`, `econometrics.py`, econometrics tests, README and Apache-2.0 license. Sample statistics, returns, correlation and annualized volatility; SDK volatility convention is percent. | Independent sample covariance/correlation, annualized volatility, explicit-hurdle Sharpe/Sortino, diversification and variance contribution calculations. Office stores decimal rates and labels percentage displays. No Goldman API/SDK session is claimed. |
| [TF Quant Finance](https://github.com/google/tf-quant-finance/tree/003229c11852349ce1f95efd6e4d8d8199da04e6) | Black–Scholes `vanilla_prices.py` and tests, implied-volatility module, rate-analytics cashflows and setup/license. README says the library is no longer maintained; the GitHub API archived flag was false at inspection. | Independent scalar European call/put pricing, Greeks, bounded implied-volatility bisection, discounted coupon cash flows, yield solving, duration/convexity/DV01. No TensorFlow runtime, GPU features or full library parity claim. |
| [OpenBB](https://github.com/openbq-org/OpenBB/tree/7c9d4221bdf66965e3f6c7f4dc6ee848073e5ae2) | Current README, license, abstract Fetcher and standard equity-historical query/data models. Header says Apache-2.0; API reports NOASSERTION. This inspected tree does not contain the formerly documented bundled yfinance provider file. | Explicit query/extraction/normalization separation, compatible `results` JSON historical import, source/currency/basis validation and anonymous published-history extraction. No claim of an installed/connected OpenBB SDK or licensed feed. |

The numerical code in `research-math.js` is independently written from standard mathematical definitions. No SDK source, logos or third-party runtime code was bundled. Existing owner-authorized Atlas code and its separate provenance remain unchanged.

## Working interface

Open **Quant Lab → Research toolkit · options, fixed income & portfolio risk** below the Atlas desk. Calculations and results remain on the same page.

- **European option price and Greeks:** supplied spot/strike, ACT/365 years, constant annual volatility, continuous risk-free/dividend rates, and explicit currency. Prices are per quoted unit. Vega/rho are per +1 percentage point; theta is per calendar day. At expiry/zero volatility, deterministic payoff/value remains defined and unsupported Greeks remain unavailable. American early exercise, live chains, fees/spreads and contract multipliers are not modeled.
- **Implied volatility:** supplied premium and the same European assumptions. No-arbitrage bounds, expiry and the 1000% volatility solver ceiling are checked; numerical residual and iteration count are retained. This does not retrieve market IV.
- **Fixed coupon bonds:** nominal annual yield compounded at coupon frequency, regular annual/semiannual/quarterly/monthly coupons, whole periods, face repayment, price, Macaulay/modified duration, convexity and DV01. The inverse solver recovers yield from a supplied price and supports mathematically valid negative yields. Valuation is exactly on a coupon date before the next full period. No accrued interest, day-count/calendar settlement, credit/default, callable features or live bond yields. TF's continuously compounded PV is mathematically related by `r = frequency × ln(1 + nominalYield/frequency)`; the conventions are not silently interchanged.
- **Historical portfolio risk:** one to six supplied same-currency target exposures, price CSV, a normalized series bundle, an OpenBB-style historical results export, an Office analysis export, or published US/IDX histories. Source dates must align within the common window. Missing/nonpositive/duplicate/future prices, mixed currencies, invalid weights and long sampling gaps reject. No prices or FX rates are filled.

Published-history lookup supports market/class aliases such as ADRO.JK and BRK.B, reads the last 253 available completed source prices at a common eligible cutoff and then verifies alignment. It never reads your recorded holdings automatically. Locally, published Pages data is not served by the private backend: import an existing analysis or source file instead.

Covariance uses sample `n−1`. Volatility annualizes by the declared 252/52/12 periods. Returns are simple selected-price returns. Sharpe uses supplied annual effective risk-free return converted to each sampling period; downside RMS for Sortino includes all periods against that same hurdle. Blank hurdle means unavailable ratios, not an assumed zero. Zero variance/downside does not produce infinity. Variance contributions may legitimately be negative for hedges and are distinct from position weights. HHI is a 0–1 target-weight index; effective positions is its reciprocal.

Hypothetical cumulative return/drawdown are a constant-weight rebalanced sleeve study without costs/tax/FX, not actual ledger performance, optimized allocations or forecasts. Short samples are visibly labelled. Raw prices can contain split effects; adjusted history requires supplied adjusted fields, with no raw fallback. Sampling annualization is an explicit assumption, not an exchange-calendar reconstruction.

## Records, provenance and reproduction

Calculations remain in memory until **Export reproducible study**. The standalone study contains normalized source rows, settings, declared currency/basis, supplied label, outcomes and `longhand-research-1.0.0` formula version. Restore recomputes and checks outcomes before showing the study; foreign Office backups, altered results and injected method names reject. Study restoration cannot replace Office investment records. Provider text from user imports is unverified; unrelated export fields, including credentials, are not copied into normalized source rows.

Public extraction sends only anonymous GETs for existing public files, with no weights, notes or portfolio uploads. Missing providers/SDK entitlements stay missing. Actual portfolio prices/cash/trades, thesis/decision links, existing analyses, private databases and complete Office backup formats are unchanged.

## Validation

- **202 application tests** and **4 local API tests** pass.
- **21 independent Python numerical checks** across 17 cases use `math.erfc`, discounted cash-flow sums and yield recovery against the actual JS module, including three explicit TF option-price example fixtures.
- **38 browser checks** cover all five methods, keyboard access, 1440/768/390/320 px, isolated source-row export/restore, actual AAPL/MSFT and BBCA/ADRO histories, IDX alias normalization, genuine OpenBB-format file import, missing adjusted data, impossible premium, invalid weights, foreign/altered backup rejection and no record writes/uploads.
- The existing **22-step Investment Lab workflow** and **22 same-page core model checks** pass again, including complete backup restoration in a fresh context.

```powershell
npm test
python tests/research-reference.py
```

These checks establish the stated numerical/workflow behavior, not a guarantee of trading performance, every financial product's conventions, or live data entitlement. Institution-specific GS pricing/data requires appropriate credentials and access; none were requested, fabricated or exposed. The TensorFlow SDK is not a browser dependency. OpenBB connector architecture does not grant a provider's data rights or make a free feed real-time.
