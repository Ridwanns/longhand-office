# Longhand Office

A private investment workspace with a courtyard entrance, an Investment Command Center, a Markets desk (US/IDX stocks, bond ETFs, commodities, indices and official Treasury yields), Global Macro, a persistent Quant Lab, separate Paper/Real portfolio ledgers, a thesis and decision Journal, and encrypted complete backups. Treasury and Governance remain planned.

There are two editions:

- **Local edition**: a Node/SQLite server on `127.0.0.1`, with the durable local vault. See [Run locally](#run-locally).
- **GitHub Pages edition**: [ridwanns.github.io/longhand-office](https://ridwanns.github.io/longhand-office/). It has browser Quant workers, source-labelled market snapshots refreshed by GitHub Actions, and personal records kept only in each browser profile. See [GITHUB_PAGES.md](docs/guides/GITHUB_PAGES.md).

Personal investment records are excluded from Git and from the published artifact. Source is public in [Ridwanns/longhand-office](https://github.com/Ridwanns/longhand-office).

## Run locally

Requires Node.js 24.22.1 or newer in the 24.x line, which provides built-in SQLite. [scripts/node-security.mjs](scripts/node-security.mjs) refuses older runtimes. No npm packages, bundler, account keys or hosted service are needed.

```powershell
cd 'C:\Users\user\OneDrive\Documents\Longhand Office'
npm start
```

Open [Longhand Office](http://127.0.0.1:4173/#overview) and keep the command running. For the separate test environment use `npm run start:test` and port 4174. The Flowless data service on port 8000 is optional for IDX and is neither started nor changed by Office.

## Everyday workflow

1. **Markets:** inspect US/IDX stocks, bond ETFs, commodity futures and indices. Source type, currency/unit, observation date and unverified real-time status stay visible. Refresh changes only the market desk.
2. **Quant Lab:** type one US/IDX ticker and pause, or press Enter. The ticker desk loads dated prices and historical risk, runs the available models and saves the study automatically. Custom settings (date, price basis, seed) and the Market Atlas valuation desk sit on the same page. See [AUTOMATIC_TICKER_RESEARCH.md](docs/guides/AUTOMATIC_TICKER_RESEARCH.md), [QUANT_LAB.md](docs/guides/QUANT_LAB.md), [ADVANCED_MODELS.md](docs/guides/ADVANCED_MODELS.md), [AUTO_VALUATION.md](docs/guides/AUTO_VALUATION.md) and [MARKET_ATLAS_MATH.md](docs/guides/MARKET_ATLAS_MATH.md).
3. **Portfolios:** choose Paper for simulations or Real for manual actual-investment records. Record opening cash where known, purchases/sales with your prices/fees, and dated deposits, withdrawals or dividends. The app never places orders.
4. **Valuation:** supply your own dated prices or explicitly confirm a matching Markets observation. Cost, realized trading profit, dividends and unrealized P/L are separate. Currencies are never consolidated through invented exchange rates.
5. **Theses/Journal:** write assumptions, evidence, horizon, invalidation conditions and review dates; link a portfolio/instrument, public report and completed Quant run. Reviews are added separately and earlier text is retained.
6. **Records:** export a complete (optionally password-encrypted) backup or explicitly connect the durable local vault.

The public [Longhand Research](https://longhandresearch.github.io/) catalogue remains separate. Refresh reads its public JSON metadata as text, without executing its scripts or uploading private records.

## Persistence and privacy

Existing browser records remain in `longhand-office.v1` on port 4173 until explicit migration. Loading never rewrites them. Themes/watchlists use separate keys. Legacy backups without optional fields or with older trade precision remain supported.

Quant runs persist in `%LOCALAPPDATA%\LonghandOffice\data\office.sqlite`. After **Back up & connect local vault**, portfolios/theses/decisions persist there too, with validated atomic writes, revision checks and recoverable snapshots. Port 4174 uses `%LOCALAPPDATA%\LonghandOffice\test-data\office.sqlite`. These databases are outside the OneDrive source folder; backups saved to synced locations can still sync under your settings. See [LOCAL_VAULT.md](docs/guides/LOCAL_VAULT.md).

**Records → Back up everything** includes active Office records, completed core analyses, advanced and ticker studies, valuations, drafts, saved manual studies, registered forecasts, theme and watchlists. Restoration creates a separate scoped workspace and activates it only after verification. See [CONTINUITY_RELEASE.md](docs/releases/CONTINUITY_RELEASE.md) and [FREE_DATA_AND_BACKUP_RELEASE.md](docs/releases/FREE_DATA_AND_BACKUP_RELEASE.md).

The server binds only to 127.0.0.1, checks local Host/Origin, bounds requests/jobs and requires a same-origin request token for writes. It uses fixed data hosts, an explicit static-file allowlist and CSP. It does not send holdings/notes to data providers. These measures are not authentication or safe private hosting. The Pages edition encrypts its device workspace; see [PRIVACY_HARDENING_2026_10_23.md](docs/releases/PRIVACY_HARDENING_2026_10_23.md) and [PRIVATE_VAULT.md](docs/guides/PRIVATE_VAULT.md).

## Honest limits

- Best-effort public Yahoo data, with no guaranteed real-time entitlement or availability. Quotes and eligible histories have different coverage. Local owner-provided IDX history can be below the 350-session Quant minimum even when a price exists; published browser histories have their own dated coverage receipts.
- Adjusted closes are retrieval-vintage proxies. Yahoo includes split/dividend adjustments; Flowless handles confirmed split-like corporate actions and excludes dividends. Raw closes exclude dividends and can show split jumps.
- Historical model comparisons remain retrospective studies, with 90% residual intervals only when at least 20 eligible errors exist. Eligible fresh core forecasts can be frozen separately and observed over five/twenty future source sessions. Device clocks and imported provenance are unverified; pending outcomes are never scored as zero. Advanced forecasts remain retrospective. Monte Carlo bands represent an assumed process, not validated probabilities.
- Weighted-average cost includes fees. No shorting, automatic corporate-action trade changes, broker synchronization, tax-lot accounting or FX conversion.
- TWR/MWR remain unavailable without complete dated boundary valuations and a documented policy. Value minus contributions is never presented as a percentage return.
- SQLite save snapshots have no automatic retention/pruning; keep exports and monitor local disk usage. Clearing browser site data removes the vault connection marker, though the database remains. JSON restoration reconnects records to a new workspace.
- A private synchronized hosted vault still needs genuine server authentication, workspace authorization, sessions, TLS, encryption and managed backups. The Pages edition does not host the private Node/SQLite vault.

## Tests

```powershell
npm test
# With the isolated server running (npm run start:test):
npm run test:api
python scripts/reference-quant.py
```

`tests/*.test.mjs` are Node unit tests; `tests/*-browser.mjs` are isolated browser checks; `scripts/reference-*.py` and `scripts/verify-*` recompute results independently. CI runs `npm test` on every pull request.

## Project layout

- Root `*.js` / `*.css` / `index.html`: the Office frontend (plain ES modules, no build step).
- `scripts/`: local server, data adapters, publication and audit scripts.
- `pages/`: the GitHub Pages shell; `npm run build:pages` assembles the published site.
- `sources/`: reviewed macro source snapshots.
- `tests/`: unit, integration and browser checks.
- `.github/workflows/`: CI, Pages publication, scheduled price refresh and security checks.
- `docs/`: guides, release notes, audits and source reviews. Start at [docs/README.md](docs/README.md).
