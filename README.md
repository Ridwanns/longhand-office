# Longhand Office

The [16 October market visual update](MARKET_VISUALS_RELEASE.md) adds GDP bars, inflation history, a sourced six-country GDP map/comparison and an official Treasury yield curve. Original instrument names lead market tables; bond ETFs are explicitly separate from yields. Charts now appear automatically inside Office. TradingView supplies supported US/IDX and FX instruments with explicit data status; restricted indices and futures use separately labelled Yahoo histories in the same panel. History controls offer up to ten years, with daily, weekly and monthly views. A neutral graphite dark palette replaces the blue-green surfaces. Personal records and numerical model contracts are preserved.

The [16 October retained-research audit](AUDIT_2026_10_16.md) prevents delayed archive reads, old errors and import callbacks from replacing a newer ticker or view. Valuation, ticker, advanced-model and manual-calculation archives now share the same interaction guard; normal saved-study calculations and additive restoration remain intact.

The [15 October Quant audit](AUDIT_2026_10_15.md) fixes a local automatic-source mismatch, hidden Simple-view run failures and a late-response ticker race. Automatic models now retain their published Yahoo source; existing Flowless runs remain intact and offer an explicit separate-run recovery. Source selection, visible run status and exact rerun behavior are checked alongside the established investment/backup workflows.

Markets → Indonesia now offers an optional **local MSN personal source** desk: enter an IDX ticker, inspect its dated IDR quote and reported ratio/EPS evidence, then prepare thesis notes for your review. No portfolio or retained model is changed automatically. [IDX_MSN_LOCAL_RELEASE.md](IDX_MSN_LOCAL_RELEASE.md) explains usage, currency/period checks, persistence, tests and why public Pages provides a local-entry link rather than redistributing MSN data.

Records now supports password-encrypted complete backup downloads and isolated restoration. The US Investment brief adds independently dated SEC annual evidence where available; annual facts never silently replace TTM or retained valuation inputs. See [FREE_DATA_AND_BACKUP_RELEASE.md](FREE_DATA_AND_BACKUP_RELEASE.md) for usage, cryptography, source availability and the distinction from active-vault encryption or account sync.

The Investment Lab opens in a simpler daily view with an Investment brief, retained-stock comparison and a guided thesis → decision → Paper transaction → review workflow. Advanced keeps the complete quantitative tools. Workspace status identifies archive capacity, known save failures and backup-generation activity. See [SIMPLE_OFFICE_RELEASE.md](SIMPLE_OFFICE_RELEASE.md) for behavior, preservation fixes and current verification. Method-aware drafts, complete isolated backups and registered forecasts remain available; [CONTINUITY_RELEASE.md](CONTINUITY_RELEASE.md) preserves their earlier release receipts.

A local private investment workspace with a courtyard entrance, research Library, separate Paper/Real portfolio ledgers, decision Journal, Markets desk and persistent Quant Lab. Treasury and Governance remain planned.

Quant Lab has a sticky desktop study directory and a compact mobile navigation menu connecting all analysis views, valuation/calculation desks and saved archives, with links to the existing Office spaces. Jumps preserve the run URL and draft fields within the Quant page. See [QUANT_NAVIGATION.md](QUANT_NAVIGATION.md) for the connected destinations and verified behavior.

Quant Lab now automatically fits a separate advanced engine after a completed ticker run: seven return comparisons, GARCH, forward HMM, two 5,000-path scenario processes, VaR/ES, eligible OHLC HAR and matched SPY Kalman beta. Graphs and plain-language evidence appear first; original model tables remain in a disclosure. Source dates, inadequate history, unsupported factors and optimizer diagnostics remain explicit. Advanced studies save in browser IndexedDB with a separate additive, recomputing backup. See [ADVANCED_MODELS.md](ADVANCED_MODELS.md) for the numerical contract, privacy boundaries, 233 application tests and 79 isolated browser checks.

## Run locally

At the user's request, source is now public in [Ridwanns/longhand-office](https://github.com/Ridwanns/longhand-office). A working [GitHub Pages browser edition](https://ridwanns.github.io/longhand-office/) is prepared with browser Quant workers, source-labelled market snapshots, local browser records and complete backups. See [GITHUB_PAGES.md](GITHUB_PAGES.md) for storage, publication policy and limitations. Personal investment records are excluded from Git and the published artifact. The complete Node/SQLite edition below remains available locally.

Requires Node.js 24 (verified with 24.19.0 and built-in SQLite). No npm packages, bundler, account keys or hosted service are needed to run the office.

```powershell
cd 'C:\Users\user\OneDrive\Documents\Longhand Office'
npm start
```

Open [Longhand Office](http://127.0.0.1:4173/#overview). Keep the command running. For the separate test environment use `npm run start:test` and port 4174. Your existing Flowless data service on port 8000 is optional for IDX and is neither started nor changed by Office.

## Macro and workspace refresh · 16 October 2026

The reference-led sidebar now connects all Office spaces, with a Ctrl+K page finder, mobile navigation drawer, and consistent light/dark surfaces. Macro has regional GDP/inflation readings, exact source/period evidence, a descriptive direction map and a **Prepare thesis note** bridge to the existing Investment Lab. Quant plots use precise axes, units, restrained scenario bands, pointer/keyboard inspection and exact tables.

Automatic checks do **not** establish real-time data: local price boards check every 60 seconds while visible/idle; Macro checks every five minutes with acquisition bounded to fifteen minutes. Public Pages still depends on dated publication files. BPS is explicitly a reviewed snapshot; annual ASEAN/World coverage is labelled annual. Missing policy/FX/flow/calendar/consensus inputs remain unavailable.

The latest receipt is **339 Node checks, 5 local API checks and 761 isolated browser checks**. See [MACRO_WORKSPACE_RELEASE.md](MACRO_WORKSPACE_RELEASE.md) for sources, transformations, refresh boundaries, preservation evidence and limitations, and [ARTHARA_REFERENCE_REVIEW.md](ARTHARA_REFERENCE_REVIEW.md) for what could actually be inspected on the reference site. Earlier counts below are historical release receipts.

## Everyday workflow

1. **Markets:** inspect multiple US/IDX stocks, bond ETFs, commodity futures and indices. Source type, currency/unit, observation date and unverified real-time status stay visible. Refresh changes only the market desk.
2. **Quant Lab:** type one US / IDX ticker and pause, or press Enter. The ticker desk detects the market, loads dated prices and historical risk, starts available models and saves the study automatically. Optional custom model settings remain available below. See [AUTOMATIC_TICKER_RESEARCH.md](AUTOMATIC_TICKER_RESEARCH.md) for source/backup boundaries. In those custom settings, choose market, ticker and scenario horizon. **Run models** displays results below the controls on the same page, with a persistent analysis URL. Advanced settings retain date, price basis and seed; seed fixes random simulation draws for reproducibility. The Pages market picker searches 7,686 US stock/ETF names and 837 IDX names at the tested publication. Quant has 1,315 eligible histories, including ADRO; prices and model coverage stay distinct. Local or browser workers run historical risk, AR(1), Ridge, zero/mean baselines, chronological evaluation and seeded scenarios. Save an immutable link to a thesis or decision. Below the archive, the Market Atlas desk starts with automatic source-backed earnings/FCFE scenarios, with explicit presets, autosave and independent additive backups; see [AUTO_VALUATION.md](AUTO_VALUATION.md). Advanced manual calculators add complete decision arithmetic and clearly dated original advanced studies; see [MARKET_ATLAS_MATH.md](MARKET_ATLAS_MATH.md).
3. **Portfolios:** choose Paper for simulations or Real for manual actual-investment records. Record opening cash where known, purchases/sales with your prices/fees, and dated deposits, withdrawals or dividends. The app never places orders.
4. **Valuation:** supply your own dated prices or explicitly review and confirm a matching Markets observation. Prices append to history. Cost, realized trading profit, dividends and unrealized P/L are separate. Complete value/concentration require current compatible prices and known cash. Currencies are never consolidated through invented exchange rates.
5. **Theses/Journal:** write assumptions, evidence, horizon, invalidation conditions and review dates; link a portfolio/instrument, public report and completed Quant run. Add outcome/lessons/next action and a reasoning assessment as a separate review. Original text and prior explicit edit versions are retained.
6. **Local Records:** export a complete backup or explicitly connect the durable local vault. Migration preserves the existing browser key and a recovery copy before creating a new workspace.

**Quant Lab navigation** now includes Stock overview, Registered forecasts and Saved manual studies. Calculator/toolkit drafts save by method; completed manual studies retain reproducible inputs. Quote/model dates stay separate, and shared snapshot, stale, missing-fundamental and insufficient-history labels explain availability.

The public [Longhand Research](https://longhandresearch.github.io/) catalogue remains separate. Refresh reads its public JSON metadata as text, without executing its scripts or uploading private records. Disappearing report IDs stay retained.

## Persistence and privacy

Existing browser records remain in `longhand-office.v1` on port 4173 until explicit migration. Loading never rewrites them. Themes/watchlists use separate keys. Legacy backups without optional fields or with older trade precision remain supported.

Quant runs persist in `%LOCALAPPDATA%\LonghandOffice\data\office.sqlite`. After **Back up & connect local vault**, portfolios/theses/decisions persist there too, with validated atomic writes, revision checks and recoverable snapshots. Port 4174 uses `%LOCALAPPDATA%\LonghandOffice\test-data\office.sqlite`. These databases are outside the OneDrive source folder; backups saved to synced locations can still sync under your settings.

**Records → Back up everything** now includes active Office records, all completed core analyses (linked or unlinked), advanced studies, ticker studies, valuations, calculator/toolkit drafts, saved manual studies, registered forecasts, theme and US/IDX watchlists. Inspection validates the file; restoration creates a separate scoped workspace and activates it only after verification. Incomplete requests remain audit notes and never restart. Existing individual record/analysis exports and older browser-only backups remain supported. See [CONTINUITY_RELEASE.md](CONTINUITY_RELEASE.md) for storage boundaries and capacity limits.

The server binds only to 127.0.0.1, checks local Host/Origin, bounds requests/jobs and requires a same-origin request token for writes. It uses fixed data hosts, an explicit static-file allowlist and CSP. It does not send holdings/notes to data providers. Browser/SQLite data is not application-encrypted. These measures are not authentication or safe private hosting.

## Honest limits

- Best-effort public Yahoo data, with no guaranteed real-time entitlement or availability. Quotes and eligible histories have different coverage. Local owner-provided IDX history can be below the 350-session Quant minimum even when a price exists; published browser histories have their own dated coverage receipts.
- Adjusted closes are retrieval-vintage proxies. Yahoo includes split/dividend adjustments; Flowless handles confirmed split-like corporate actions and excludes dividends. Raw closes exclude dividends and can show split jumps.
- Historical model comparisons remain retrospective studies, with 90% residual intervals only when at least 20 eligible errors exist. Eligible fresh core forecasts can now be frozen separately and observed over five/twenty future source sessions. Device clocks and imported provenance are unverified; pending outcomes are never scored as zero. Advanced forecasts remain retrospective. Monte Carlo bands represent an assumed process, not validated probabilities.
- Weighted-average cost includes fees. No shorting, automatic corporate-action trade changes, broker synchronization, tax-lot accounting or FX conversion.
- TWR/MWR remain unavailable without complete dated boundary valuations and a documented policy. Value minus contributions is never presented as a percentage return.
- SQLite save snapshots have no automatic retention/pruning; keep exports and monitor local disk usage. Clearing browser site data removes the vault connection marker, though the database remains. JSON restoration reconnects records to a new workspace.
- A private synchronized hosted vault still needs genuine server authentication, workspace authorization, sessions, TLS, encryption and managed backups. The public Pages edition is deployed, with computation and personal records confined to each browser profile; it does not host the private Node/SQLite vault.

## Verification and documentation

```powershell
npm test
# With the isolated server running:
npm run test:api
python scripts/reference-quant.py
```

The earlier free-data release suite had **289 passing Node checks** and **4 local API checks**. The free-data/encrypted-backup release passed **115 isolated local browser checks**; see [FREE_DATA_AND_BACKUP_RELEASE.md](FREE_DATA_AND_BACKUP_RELEASE.md) for its publication receipt. The preceding Simple Office release and security review passed **264 live browser checks** (213 workflow/regression + 51 browser safety), **5,276 core model cases / 1,319 eligible histories**, **16 representative advanced publication cases**, and validation of **8,599 quote entries** (8,573 priced; 26 explicitly unavailable). See [SIMPLE_OFFICE_RELEASE.md](SIMPLE_OFFICE_RELEASE.md) for that dated receipt. Restores use fresh isolated contexts; existing records are preserved. Historical counts do not imply that every stock has fundamentals or eligible history.

- [FREE_DATA_AND_BACKUP_RELEASE.md](FREE_DATA_AND_BACKUP_RELEASE.md): encrypted complete exports, isolated unlocking/restoration, official US annual evidence and free-service boundaries.
- [SIMPLE_OFFICE_RELEASE.md](SIMPLE_OFFICE_RELEASE.md): simpler daily navigation, investment briefs, linked Paper workflows, retained-stock comparison, workspace status and historical valuation preservation.
- [CONTINUITY_RELEASE.md](CONTINUITY_RELEASE.md): draft recovery, one complete isolated backup, consolidated ticker overview, forward observation and shared data states.
- [SECURITY_REPO_REVIEW.md](SECURITY_REPO_REVIEW.md): applicability of the requested Ghidra, reverse-skill and h4cker repositories, with scoped Office evidence and remaining boundaries.
- [AUTO_VALUATION.md](AUTO_VALUATION.md): automatic fundamental scenarios/FCFE, evaluated IDX/Yahoo Financials repositories, data coverage and backup verification.
- [AUTOMATIC_TICKER_RESEARCH.md](AUTOMATIC_TICKER_RESEARCH.md): ticker-only source loading, automatic calculations/saving, independent checks and missing-data limits.
- [QUANT_REPOSITORY_REVIEW.md](QUANT_REPOSITORY_REVIEW.md): four-repository review and working option/bond/portfolio-risk toolkit, source import, numerical checks and access limits.
- [MARKET_ATLAS_MATH.md](MARKET_ATLAS_MATH.md): reused calculators, complete retained Atlas studies, source fingerprints, independent checks and fresh-fitting limits.
- [BROAD_MARKET_COVERAGE.md](BROAD_MARKET_COVERAGE.md): broad yfinance coverage, source gaps, exact tested scope and publication procedure.
- [DATA_RELIABILITY_AUDIT.md](DATA_RELIABILITY_AUDIT.md): latest complete data/workflow audit, availability fixes and failure/recovery testing.
- [QUANT_USABILITY_VALIDATION.md](QUANT_USABILITY_VALIDATION.md): same-page results, expanded stock coverage and seed/search fixes.
- [WEB_RELEASE_VALIDATION.md](WEB_RELEASE_VALIDATION.md): working public browser release, data/privacy boundaries and deployment evidence.
- [AUDIT_2026-10-13.md](AUDIT_2026-10-13.md): preceding local audit, preservation evidence and remaining limits.
- [RELEASE_VALIDATION.md](RELEASE_VALIDATION.md): preceding release walkthrough and implementation evidence.
- [QUANT_LAB.md](QUANT_LAB.md): formulas, leakage protections, acquisition policy, audit and Market Atlas repository/license assessment.
- [LOCAL_VAULT.md](LOCAL_VAULT.md): actual storage paths, migration/recovery, backup policy, cash-flow and review rules.
- Earlier implementation evidence: VALIDATION.md, VALUATION.md, FLOWLESS.md, US_MARKET.md, MARKET_WORKSPACE.md and MARKET_TERMINAL.md. Their dated historical limits/counts are superseded by this release where functionality changed.

See [DATA_SOURCE_REVIEW.md](DATA_SOURCE_REVIEW.md) for the additional US/IDX repository assessment, official Treasury observations, verification and provider limitations.

The [idx-cli review](IDX_CLI_REVIEW.md) records successful personal/read-only MSN quote and BBCA fundamental probes, the dated ownership-manifest check, and the unit/history/data-rights boundaries required before a local IDX adapter. It does not change the running Office or republish MSN datasets.

The refined entrance and differentiated rooms use the existing architectural SVG, system fonts, warm stone/ivory, forest/charcoal and copper. Both themes, reduced motion, conventional navigation, keyboard-accessible rooms/modals and responsive tables remain available.
