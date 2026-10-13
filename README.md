# Longhand Office

A local private investment workspace with a courtyard entrance, research Library, separate Paper/Real portfolio ledgers, decision Journal, Markets desk and persistent Quant Lab. Treasury and Governance remain planned.

## Run locally

At the user's request, source is now public in [Ridwanns/longhand-office](https://github.com/Ridwanns/longhand-office). A working [GitHub Pages browser edition](https://ridwanns.github.io/longhand-office/) is prepared with browser Quant workers, source-labelled market snapshots, local browser records and complete backups. See [GITHUB_PAGES.md](GITHUB_PAGES.md) for storage, publication policy and limitations. Personal investment records are excluded from Git and the published artifact. The complete Node/SQLite edition below remains available locally.

Requires Node.js 24 (verified with 24.19.0 and built-in SQLite). No npm packages, bundler, account keys or hosted service are needed to run the office.

```powershell
cd 'C:\Users\user\OneDrive\Documents\Longhand Office'
npm start
```

Open [Longhand Office](http://127.0.0.1:4173/#overview). Keep the command running. For the separate test environment use `npm run start:test` and port 4174. Your existing Flowless data service on port 8000 is optional for IDX and is neither started nor changed by Office.

## Everyday workflow

1. **Markets:** inspect multiple US/IDX stocks, bond ETFs, commodity futures and indices. Source type, currency/unit, observation date and unverified real-time status stay visible. Refresh changes only the market desk.
2. **Quant Lab:** type one US / IDX ticker and pause, or press Enter. The ticker desk detects the market, loads dated prices and historical risk, starts available models and saves the study automatically. Optional custom model settings remain available below. See [AUTOMATIC_TICKER_RESEARCH.md](AUTOMATIC_TICKER_RESEARCH.md) for source/backup boundaries. In those custom settings, choose market, ticker and scenario horizon. **Run models** displays results below the controls on the same page, with a persistent analysis URL. Advanced settings retain date, price basis and seed; seed fixes random simulation draws for reproducibility. The Pages market picker searches 7,686 US stock/ETF names and 837 IDX names at the tested publication. Quant has 1,315 eligible histories, including ADRO; prices and model coverage stay distinct. Local or browser workers run historical risk, AR(1), Ridge, zero/mean baselines, chronological evaluation and seeded scenarios. Save an immutable link to a thesis or decision. Below the archive, the Market Atlas desk adds complete decision arithmetic and clearly dated original advanced studies; see [MARKET_ATLAS_MATH.md](MARKET_ATLAS_MATH.md).
3. **Portfolios:** choose Paper for simulations or Real for manual actual-investment records. Record opening cash where known, purchases/sales with your prices/fees, and dated deposits, withdrawals or dividends. The app never places orders.
4. **Valuation:** supply your own dated prices or explicitly review and confirm a matching Markets observation. Prices append to history. Cost, realized trading profit, dividends and unrealized P/L are separate. Complete value/concentration require current compatible prices and known cash. Currencies are never consolidated through invented exchange rates.
5. **Theses/Journal:** write assumptions, evidence, horizon, invalidation conditions and review dates; link a portfolio/instrument, public report and completed Quant run. Add outcome/lessons/next action and a reasoning assessment as a separate review. Original text and prior explicit edit versions are retained.
6. **Local Records:** export a complete backup or explicitly connect the durable local vault. Migration preserves the existing browser key and a recovery copy before creating a new workspace.

The public [Longhand Research](https://longhandresearch.github.io/) catalogue remains separate. Refresh reads its public JSON metadata as text, without executing its scripts or uploading private records. Disappearing report IDs stay retained.

## Persistence and privacy

Existing browser records remain in `longhand-office.v1` on port 4173 until explicit migration. Loading never rewrites them. Themes/watchlists use separate keys. Legacy backups without optional fields or with older trade precision remain supported.

Quant runs persist in `%LOCALAPPDATA%\LonghandOffice\data\office.sqlite`. After **Back up & connect local vault**, portfolios/theses/decisions persist there too, with validated atomic writes, revision checks and recoverable snapshots. Port 4174 uses `%LOCALAPPDATA%\LonghandOffice\test-data\office.sqlite`. These databases are outside the OneDrive source folder; backups saved to synced locations can still sync under your settings.

New JSON exports contain all private records and every linked completed analysis, including normalized datasets/results/hashes. Analysis-bearing restores require the vault so the operation is atomic. Old browser-only record backups remain restorable. Unlinked runs can be exported individually as audit files; no standalone analysis-import screen is provided yet.

The server binds only to 127.0.0.1, checks local Host/Origin, bounds requests/jobs and requires a same-origin request token for writes. It uses fixed data hosts, an explicit static-file allowlist and CSP. It does not send holdings/notes to data providers. Browser/SQLite data is not application-encrypted. These measures are not authentication or safe private hosting.

## Honest limits

- Best-effort public Yahoo data, with no guaranteed real-time entitlement or availability. Free US histories worked for AAPL/MSFT/SPY. IDX requires sufficient owner-local history; BBCA currently has 288 completed observations, below the 350-session Quant minimum.
- Adjusted closes are retrieval-vintage proxies. Yahoo includes split/dividend adjustments; Flowless handles confirmed split-like corporate actions and excludes dividends. Raw closes exclude dividends and can show split jumps.
- Forecasts are retrospective statistical studies, with 90% residual intervals only when at least 20 eligible errors exist. Monte Carlo bands represent an assumed process, not validated probabilities. No extra model families were added for appearance.
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

The current suite has **209 passing automated checks** and **4 local API checks**. The expanded publication validates **5,260 model cases** across **1,315 eligible histories**, plus **8,534 browser quote entries** (8,514 valid and 20 explicitly unavailable). The expanded **40-check browser workflow**, **22 same-page usability checks**, **20 availability/failure/recovery checks**, **22-step records/backup workflow** and **51 browser safety checks** pass. Restores use fresh isolated contexts; existing records are preserved. Historical audit reports keep their original dated counts.

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

The refined entrance and differentiated rooms use the existing architectural SVG, system fonts, warm stone/ivory, forest/charcoal and copper. Both themes, reduced motion, conventional navigation, keyboard-accessible rooms/modals and responsive tables remain available.
