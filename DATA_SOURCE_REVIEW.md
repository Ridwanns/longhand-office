# Additional source review — 14 October 2026

## Published release receipt

App commit `c99a41773fb8d08fc86dc7d47dc2f4c63f005677` deployed successfully in [Pages run 38462609619](https://github.com/Ridwanns/longhand-office/actions/runs/38462609619); [CI 38462609157](https://github.com/Ridwanns/longhand-office/actions/runs/38462609157) passed. The live [Bonds screen](https://ridwanns.github.io/longhand-office/#market/bonds) passed all **19 rate browser checks**, and the final live Quant screen passed all **59 navigation checks**, with no JavaScript errors. Local API checks passed **4/4**; dark mode survived reload and all twelve rates remained visible at 390 px with reduced motion enabled.

Publication verified **5,268 model cases** across **1,346 source histories**, with zero model failures, missing core tickers or invalid quoted prices. **29 histories** are explicitly price-only because they lack an eligible cutoff. The **8,630 quote entries** retain explicit unavailable records where required; this is not a claim that every entry has a price. Fundamentals include **26 unavailable source prices**. The independently timed stock snapshot was published at `2026-10-13T20:26:24.970Z`; Treasury collection retained 196 observations through 13 October. No provider fallback was needed for this release. Counts and timestamps can change in later scheduled publications.

Pinned code inspection and bounded public endpoint probes; neither third-party MCP server nor embedded skill was installed or executed. No personal records or credentials were used.

| Repository | Revision | Decision |
| --- | --- | --- |
| [global-stock-data](https://github.com/simonlin1212/global-stock-data) | `cc6afb5bad45715a7395fcccb09d786d8a1c160d` | Apache-2.0 code; useful source catalogue. Add official Treasury observations using an independent adapter; do not activate the whole scraping toolkit. |
| [saham-mcp](https://github.com/baguskto/saham-mcp) | `b9956333309d08f677afc4f8a23644fbdc223cdf` | MIT server code; not connected as an automatic replacement or independent current IDX feed. |

## Why the complete servers were not connected

Global-stock-data is a Markdown toolkit containing Python functions, not a hosted market-data service. US quote sources include Sina, Tencent and Eastmoney, plus Yahoo history/fundamentals. Its README distinguishes code licenses from provider terms, with restrictions for several feeds. Those quotes were not added to Office. SEC requires a real contact in the User-Agent; none was invented or submitted. Its Taiwan APIs do not supply IDX data.

Saham-mcp uses `yahoo-finance2` for current prices, wrapping the Yahoo source Office already uses. Its history comes from Dataset-Saham-IDX. Read-only BBCA and ADRO probes both returned HTTP 200 but ended **2025-02-21**, despite newer repository updates. These CSVs have no adjusted-close field; they cannot silently replace adjusted-price models or be spliced into another provider's series.

Verified limitations in saham-mcp's reviewed source:

- `web-scraper.ts` returns null for stock info/history/sector/search; market overview fills unknown volume/value with zero.
- `yahoo-finance.ts` assigns retrieval time as `lastUpdated`, defaults missing volume to zero, selects movers from six stocks and approximates sectors using small stock groups.
- `csv-parser.ts` creates date-only observations in local time, then the dataset source serializes them with `toISOString()`. In Jakarta that can display the preceding UTC date. Unknown volume is also replaced by zero.
- Production lockfile audit (`npm audit --omit=dev --ignore-scripts --json`) reported **10 dependency findings: 4 moderate, 5 high, 1 critical**, including `proxy-addr` [GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h). This dated dependency assessment is not evidence of malicious code or that each advisory is exposed by every transport. No install or exploit was attempted.

## Working Treasury addition

**Markets → Bonds** and **Macro / Indices** now show official US Treasury par yields at twelve maturities, observation/retrieval dates, source metadata, ten recent observations and the 10Y−2Y spread in basis points. Desktop uses six columns of maturity/value pairs; narrow phones use two so every maturity is visible.

The fixed Treasury CSV endpoint returned **196 observations**, latest **2026-10-13**, in the initial local probe. These daily indicative **par yields** are percentages, not bond/ETF prices, a spot discount curve or executable real-time quotes. See [Treasury methodology](https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics/treasury-yield-curve-methodology).

Acquisition requires no package or API key. It has a 20-second deadline, 200 KB cap and fixed provider URL. Changed columns, malformed values, missing required tenor fields, duplicate/impossible/future dates and unexpected provenance are rejected. Missing cells stay null and display **Not reported**; missing tenors withhold spreads. Failure displays unavailable without a zero curve. Observations older than seven calendar days are flagged; this threshold is not a holiday calendar.

Independent arithmetic: 5.21% (10Y) − 4.79% (2Y) = 0.42 percentage points = **42 bp**. Inversion tests retain the negative sign. Reload reads the published JSON; new acquisition occurs in the publication workflow. Official-rate and stock-snapshot timestamps remain separate.

This is read-only data. It changes no trades, holding valuations, model assumptions, FX rates, private backup schemas or saved model results. Public observations are retained in `data/official-rates.json` with a hash of the received CSV. No private records are included.

## Verification and limits

- **241 Node tests passed**, including eight rate/parser/unit cases.
- **19 isolated local browser checks passed**, covering actual-source arithmetic/provenance, keyboard reload, error/missing/outdated states, escaped errors, preservation of record keys and no JavaScript errors.
- Responsive checks at 1440, 768, 390 and 320 px with reduced motion; all maturity values visible. Recent history uses contained table scrolling. Existing Office theme tokens retained; no new animation.
- Static build validates the official data before packaging. Provider failures generate an explicit unavailable record and do not prevent publication of the working Office.

Neither repository solves guaranteed free real-time US/IDX prices or universal ticker coverage. The existing dated Yahoo feed and explicit unavailable states remain. Its access/redistribution requirements remain a separate consideration for commercial or broader redistribution; the Treasury addition confers no rights to other providers' feeds. No Stockbit authentication or access-control bypass was attempted.
