# Macro workspace and reference-led Office refresh

Verified locally on 16 October 2026. Public research and personal investment records remain separate.

## Working experience

The main sidebar contains thirteen working destinations, grouped into Workspace, Market data, Investment, Research and Records. Paper and Real are separate destinations. Ctrl+K finds actual pages; it does not claim to search private notes or the market universe. Mobile has a modal navigation drawer, inert closed navigation, contained keyboard focus and Escape/close controls. Opening page search is blocked while a record editor is open.

The user's three supplied dashboard references guide the white/grey surfaces, blue accent, labelled navigation, typography and spacing. Light and dark themes use the same structure. The original architectural building stays at the entrance. No reference balances, user identities, expenses, maps or decorative curves are inserted.

Macro has Indonesia, US, Europe, ASEAN and Global selections, with Overview, Rates & currency, Markets & flows, Economy and Sources. Europe is explicitly the euro area with changing composition. ASEAN is a selector for six named countries, not a claimed regional aggregate. GDP and CPI keep their separate observation periods and frequencies.

**Prepare thesis note** opens the established thesis editor with factual observations, exact periods and provenance. The owner writes the investment argument, chooses any related portfolio and saves explicitly. Existing thesis → decision → outcome-review workflows and complete backups retain this evidence using the existing schema.

## Data coverage and acquisition

| Coverage | Numerical source | Frequency and transformation |
|---|---|---|
| Indonesia | Four official BPS release abstracts, reviewed in the local browser | Q1/Q2 2026 real GDP YoY; August/September 2026 headline CPI YoY. Source release dates retained |
| US | BEA GDPC1 and BLS CPIAUCSL via FRED CSV | GDP YoY = 100 × (quarterly level / exact quarter four quarters earlier − 1). CPI YoY = 100 × (monthly seasonally adjusted level / exact month twelve months earlier − 1). The latter may differ from unadjusted headline CPI |
| Euro area | Eurostat `namq_10_gdp`, `EA`, `CLV_PCH_SM`, `SCA`; ECB `HICP.M.U2.N.000000.4D0.ANR` | Reported quarterly real GDP YoY and monthly HICP annual change. Estimates/provisional statuses stay visible; discontinued ICP is not used |
| Six ASEAN countries / World | World Bank WDI `NY.GDP.MKTP.KD.ZG`, `FP.CPI.TOTL.ZG` | Annual provider observations. No gap filling, cross-country averaging, synthetic ASEAN index or inference of current-quarter conditions |
| US rates | Existing official US Treasury feed | Published daily par yields, not bond prices or central-bank policy rates. Reload reads the published file |
| Market context | Existing separate market sources | Global index snapshots retain their own timestamps. Prices do not establish foreign/broker flows |

The tested public macro file contained twenty independent series without acquisition errors. These observations are source snapshots, not exchange-certified streaming data. Official source outages can change this availability.

Source ledger fields distinguish period, official release date where supplied, retrieval/review time, source URL, method, unit and SHA-256. BPS hashes refer to the reviewed transcription, not an independently downloaded HTML response. Automatic BPS HTTP acquisition returned 403; browser access allowed direct verification. Running collection does not renew the BPS review time or manufacture new observations. CSV observation dates are not represented as release dates. Other feeds are retrieval vintages subject to revision, not point-in-time release archives.

## Refresh versus real time

- Local price boards can auto-check every sixty seconds while visible and idle. Owner can pause them. Source dates remain authoritative; IDX Flowless is daily data, Yahoo delay/real-time entitlement remains unverified. The additional personal MSN desk retains its explicit manual-read/two-minute-cache boundary.
- Macro checks every five minutes while visible/idle. Its local endpoint coalesces concurrent requests and acquires official numerical sources at most every fifteen minutes. Source failures remain explicit; a previous result is not relabelled as a successful fresh acquisition.
- Public Pages checks published files. Its publication pipeline is scheduled every six hours and can be delayed or fail. Polling the file cannot turn it into a live data service.
- Treasury files have their existing publication cadence. BI/ECB/Fed policy-rate feeds, FX, consensus, a numerical release calendar, liquidity and ownership/flow data are not connected here. There are no invented rates, release dates, risk scores or causal claims.
- Public providers do not give this release verified all-US/all-IDX real-time exchange entitlements. This remains a limitation, not a feature that automatic checking can solve.

Freshness prompts use observation age above 75 days monthly / 210 quarterly / 550 annual, or acquisition age above ten days. This is a transparent review rule, not proof that the snapshot contains the latest official release. Missing observations remain null; consecutive calendar periods are required for a percentage-point change. Stale/insufficient series withhold a quadrant. GDP/inflation directions describe their separate latest observations, not a synchronized regime, forecast or allocation recommendation.

## Scientific Quant charts

Core and advanced line charts share an original native-SVG presentation: aligned axes, five horizontal grid references, explicit units, responsive ticks, consistent legends, a stronger median and restrained sample paths, clear 5–95% shading, and a zero reference where relevant. HMM probability is bounded from zero to one and displayed as percent; volatility percentages are explicitly annualized. Error bars display RMSE in log-return percentage points; original numerical outputs remain unchanged.

Pointer inspection and a native keyboard/touch observation slider report the retained values. Exact-value tables remain accessible. Histograms show counts per actual source bin rather than a probability density. Session-zero replay shows observed starting points. Missing line values break the path; there is no smoothing, synthetic observation, refit or new random draw. Model data, output hashes and backups are unchanged by presentation interactions. These are MATLAB-inspired plotting conventions, not a claim to use MATLAB or proprietary Arthara mathematics.

## Verification receipt

- 339 Node checks, including 23 Macro and 8 chart checks, and 5 local API checks passed.
- Macro browser checks: 86 local + 86 static. Covers all regions/countries, independent percentage-point comparisons, estimates, source/date identity, source failures, nulls, gaps, stale vintages, late-response races, public export, reload, keyboard, reduced motion and 320–1440 px layouts.
- Shell checks: 99 local + 99 static. Covers all thirteen route selections, page finder, mobile focus/close behavior, 320–1600 px layouts, preserved records, Macro note saving/reload and exact evidence in complete export.
- Automatic refresh: 13 local + 13 static. Clock-controlled tests verify actual requests, pause/interaction behavior, original BPS review date, unchanged DOM for identical Macro data, and unchanged private record keys.
- Scientific charts: 74 local + 74 static. Includes independent retained-value inspection, all 5,000 histogram counts, RMSE conversion, probability/volatility units, single-point replay, every main analysis view at six widths, unchanged study contents and no CSP violations or JavaScript errors.
- Selected existing regressions: 19 official Treasury, 40 complete Simple Office workflow/isolated restore, 59 Quant navigation/graphs and 25 research-intent race checks passed.
- Total: 687 isolated browser checks across these suites. Screenshots and JSON receipts are retained in ignored `validation/`; test records are confined to fresh contexts and the separate test environment.

Verified defects fixed during this work: a failed Macro series attempted to read an absent period; mobile chart text was too small; the page finder did not consistently close on Escape; inherited module-row styles caused 320 px overflow; SVG inline styles conflicted with CSP; and session-zero line rendering needed visible points. Existing data schema, trade arithmetic, immutable model results, Paper/Real grouping, linked decisions and backups were preserved.

Tests establish the documented cases, not the absence of every possible bug. Application-level encryption at rest, authenticated private hosting, device synchronization and verified streaming market data remain outside this release.

See [EXTERNAL_MACRO_REFERENCE_REVIEW.md](EXTERNAL_MACRO_REFERENCE_REVIEW.md) for the public-site review and the boundary between visible product descriptions, working Office features and unverified proprietary content.

## Publication receipt

Application commit `a5ec602e7ded62b5773dcb678b53d76758f5ea18` is deployed at [Longhand Office](https://ridwanns.github.io/longhand-office/#market/macro). [CI 38878238944](https://github.com/Ridwanns/longhand-office/actions/runs/38878238944) and [Pages 38878239217](https://github.com/Ridwanns/longhand-office/actions/runs/38878239217) completed successfully.

The publication independently passed **5,272 model cases across 1,346 histories**, with 28 histories explicitly price-only, plus validation of 8,421 quote entries. The verifier reported no model failures, missing required core histories, invalid quote objects or failed required core quotes. These publication checks are additional to the local checks above; they do not establish complete fundamental coverage or verified streaming prices.

The deployed page was inspected in a fresh browser context: thirteen navigation destinations; twenty Macro series without acquisition errors; correct static-only data URL (no local Macro endpoint); Macro assembly `2026-10-16T09:14:35.028Z`; market publication `2026-10-16T09:09:10.644Z`. A further **74 scientific-chart checks passed on the actual hosted site**, including retained-value inspection, responsiveness, unchanged study data and zero CSP/JavaScript errors. This brings the recorded browser assertions to **761** (687 local/static + 74 hosted), with the separate hosted Macro smoke inspection.
