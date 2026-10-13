# Working public Office — 13 October 2026

The subsequent [Quant usability update](QUANT_USABILITY_VALIDATION.md) supersedes the 20-instrument universe and separate result tab described in the initial release. Current defaults include 94 histories/105 quote entries, all model results stay below the controls, and the latest [data reliability audit](DATA_RELIABILITY_AUDIT.md) has 175 automated checks. The historical evidence below remains the initial public release record.

The user explicitly authorized public source/Pages and then required working models and market data. The earlier read-only preview was replaced with a functional browser edition. [Open Quant Lab](https://ridwanns.github.io/longhand-office/#quant) or [Markets](https://ridwanns.github.io/longhand-office/#market/us).

## Deployment verified

- Repository: [Ridwanns/longhand-office](https://github.com/Ridwanns/longhand-office), verified PUBLIC. Research remains separately public in the existing LonghandResearch organization.
- [Initial working deployment](https://github.com/Ridwanns/longhand-office/actions/runs/38378685119): successful tests, acquisition of 20 histories/31 quote entries with zero provider failures, static build and Pages deployment.
- [CI](https://github.com/Ridwanns/longhand-office/actions/runs/38378684901): all 157 core tests passed on Node 24/Ubuntu.
- Direct browser tests against the deployed HTTPS site passed, not only localhost. AAPL was also run in the user's in-app browser, visibly showing a completed archive/result with 1,254 observations and retained hashes.

## Verification evidence

| Test | Result |
| --- | --- |
| Automated model/accounting/storage/provider/contract suite | 157 passing tests |
| Live local API after restarting both local servers | 4 passing tests |
| Full working browser workflow at localhost | 22 passing assertions |
| Same complete workflow on the actual Pages URL | 22 passing assertions |
| Browser IndexedDB races, idempotency, cancellation, corrupted rehashed backup, request privacy, responsive routes and keyboard/motion | 51 passing assertions |
| Actual deployed AAPL/BBCA fits, reload, both forecast horizons/1,000 scenarios, mobile/desktop widths, five Markets categories and theme | 19 passing assertions |
| Independent Python verification of actual deployed AAPL | 34 passed, 1,254 observations |
| Independent Python verification of actual deployed BBCA | 34 passed, 361 observations |
| Compatibility with existing local completed analyses | All 12 completed test analyses pass shared validation |

No JavaScript exceptions were observed in these browser workflows. Screens fit 1,440/390/320 px; wide result tables scroll inside their own containers. Browser tests use fresh contexts, labelled TEST ONLY records and isolated restore targets. Screenshots and JSON receipts remain in the ignored local `validation/` directory to avoid publishing investment-workflow artifacts. These are Chromium/in-app-browser checks, not universal device or screen-reader certification.

The shared accounting example remains cash 844 USD, six AAPL shares, remaining recorded cost 303, realized trading profit 35, fees 8, dividends 12 and external contributions 100. At supplied price 70, value including cash is 1,264 and unrealized P/L 117. Invalid oversales/withdrawals do not change data. A confirmed market observation appends a second valuation without replacing the supplied price.

## What now runs online

The existing application screens are retained. Worker-backed Quant uses the same dependency-free mathematical implementation and shared configuration/history/backup validation contracts. Web Crypto hashes match the Node SHA-256 JSON implementation. Source observations, acquisition date, exclusions, forecast scores and scenario results remain in immutable browser runs. Both US and IDX models were genuinely computed against published provider observations.

The default source universe includes AAPL/MSFT/NVDA/AMZN/GOOGL/META/SPY/QQQ/BRK-B/TLT/IEF/LQD and BBCA/BBRI/BMRI/BBNI/TLKM/ASII/ICBP/UNVR. Bond ETF prices, GC=F/SI=F/CL=F futures and ^GSPC/^IXIC/^DJI/^JKSE/^VIX levels are shown with their actual currencies/units and timestamps. Numerical economic releases and individual bond yields are not connected.

The published IDX source contains an explicitly missing 12 October close. A recent completed row cannot be joined across that gap. The UI offers the explicit 9 October model cutoff, which yields 361 contiguous observations for BBCA; later unsuitable cutoffs reject instead of silently substituting data. Choosing an eligible date is visible and deliberate. No zero-fill, interpolation or fabricated prices were introduced. Yahoo adjustment provenance includes split/dividend proxies; it is distinct from local Flowless adjustments.

Private portfolio/research/journal data initially remains in browser localStorage; an explicit backed-up migration moves active records to a path-scoped IndexedDB vault. Complete exports retain all linked analyses. A fresh browser vault restores records/runs atomically after validation, and the exact original analysis opens after reload. Concurrent saves have one winner; stale/invalid writes leave records and snapshot counts unchanged. A rehashed empty histogram backup is rejected before mutation.

## Preserved local installation

Both localhost servers were restarted after extracting shared portable contracts. The existing Node/SQLite API still passes its checks. Ordinary SQLite workspace/backup tables match the closed pre-audit copy (currently both empty); all 12 existing test analyses remain compatible. No local browser portfolio, SQLite vault or user backup was uploaded, automatically migrated or replaced. The owner-local Flowless service was not changed. Local and web editions use separate browser origins and storage locations.

## Practical limits

- Public website/source; personal records stay on each browser profile. There is no account login, cross-device sync, hosted private vault or application encryption. Keep complete exports, especially before clearing site data or changing devices.
- The scheduled publication is roughly every six hours, not guaranteed real-time. A refresh reads the latest published artifact. GitHub scheduling/provider/CDN delays can leave an older snapshot visible; source/publication dates remain explicit. Failed data builds preserve the previous deployment.
- Published tickers and retained source dates bound the online data universe. Owner workflow inputs can add tickers for a publication; defaults must be edited to retain those additions in later scheduled publications.
- A worker abandoned by a closed owner tab is recoverable after its 20-second lease; inactive-browser throttling may delay work. Jobs remain local to the browser profile, not shareable server URLs.
- Forecasts are retrospective statistical studies; scenarios are assumed-process simulations. Missing sessions reduce usable contiguous histories; fewer than 20 scored errors yield no empirical interval. No validated forecast probability or execution entitlement is implied.
- No broker orders, tax lots, automatic corporate-action changes to recorded trades, FX conversion or TWR/MWR. Treasury/Governance remain planned. Backups above 50 MB are rejected; automatic pruning is not implemented.

Detailed usage/publication boundaries are in [GITHUB_PAGES.md](GITHUB_PAGES.md). Earlier audit/release documents retain their historical verification and local-only constraints; this report records the user-authorized public browser release.
