# Local IDX source desk

15 October 2026 · optional personal MSN reader informed by [0xrsydn/idx-cli](https://github.com/0xrsydn/idx-cli/tree/a0471127374becb95b487ed660dad88a385222e1).

## Use it

1. Keep the local Office server running (`npm start`). Open [Markets → Indonesia](http://127.0.0.1:4173/#market/idx).
2. Under **Read an IDX ticker**, enter a four-letter ticker such as BBCA, ADRO or TLKM; `.JK` aliases also work. Select **Read IDX data**, or use a ticker shortcut. Reads require an explicit action; typing does not query MSN.
3. Inspect the observed IDR price, its original source timestamp, the reported company ratio frame and the dated diluted-EPS evidence. Expand **Inspect reported ratios and EPS evidence** for the periods and reconciliation. Missing data stays unavailable.
4. Select **Prepare thesis notes** to open the existing thesis editor. This prefills the ticker and source evidence only. Write your assumptions and risks, review the text, then save. Opening the editor does not save a thesis.
5. Saved evidence follows the existing record persistence and backup workflows. **Records → Back up everything** retains it verbatim; restore creates a separate workspace. Encrypted backup files remain available too.

The existing portfolio, Journal, Yahoo histories, valuation assumptions and retained Quant studies are unchanged. This desk does not execute orders, import transactions, change holdings, replace model inputs or apply a portfolio valuation automatically.

## Data boundaries and calculations

- The pinned directory contains **896 ticker/identifier pairs**, not a guarantee of 896 current quotes. Listing the directory makes no provider request. Unknown symbols reject before an upstream request; no similarly named company is substituted.
- Requests use three fixed HTTPS MSN endpoints, a declared Office User-Agent and the repository's public frontend client identifier. No owner account, browser cookies, install hook, downloaded CLI binary, impersonation or MCP registration is involved. The MIT notice for the reused mapping and source reference is in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- Quotes must match the requested symbol, pinned instrument identifier, XIDX exchange and IDR currency. A valid source timestamp is preserved separately from retrieval time. Unknown dates stay unknown; observations over seven calendar days old are flagged. No verified real-time delay or streaming entitlement is claimed.
- Change is independently derived from the provider's previous close. A synthetic price110 versus previous close100 yields change10 and change10%. Neither missing quotes nor absent optional fields become zero.
- P/E and P/B come from **one latest dated company frame**. The source quarter/annual/TTM designation stays visible. Missing fields do not borrow a different period or industry estimate; competing values are withheld. Current price is not combined with a historical ratio to imply a new valuation.
- Source diluted EPS is shown only when same-period income available to common shares divided by diluted weighted-average shares reconciles within source rounding. A synthetic income400/shares100 yields EPS4; a million-fold amount mismatch is withheld. EPS is not relabelled TTM and overlapping quarters are not added. Statement interval starts are not supplied.
- Currency is native to each observation: **ADRO's tested quote was IDR while its statement evidence was USD**. Office preserves that distinction. It does not infer FX or calculate a cross-currency earnings yield.
- Percentage/leverage fields, raw cash-flow amounts and generic bank FCFE are withheld where units or suitability are unverified. No MSN price chart is turned into synthetic OHLCV or admitted to HAR/range/volume models. Ownership, screening and trading features from the upstream CLI are not integrated.

## Storage and publication

The optional source reader runs only in the Node edition on loopback ports4173/4174. Upstream observations are held in server memory for two minutes, with a maximum128 cached symbols; fully unavailable responses have a ten-second cache. Concurrent reads are bounded to two distinct symbols and duplicate requests share work. Access/rate denials stop subsequent requests. Responses are bounded to2MB per endpoint and ten seconds per endpoint. No persistent provider dataset is created.

Saving a thesis stores its selected evidence through the existing Office record writer: browser local storage until a vault is connected, or the connected local SQLite vault under `%LOCALAPPDATA%\LonghandOffice\data\office.sqlite`. The isolated port4174 uses a separate test database. Source data is not written to the public Research website. Active browser/SQLite records remain unencrypted; the password option encrypts the downloaded backup file only.

Public GitHub Pages shows an explanatory **Open local IDX desk** link. It makes no MSN or loopback API requests automatically. The published artifact includes the UI and evidence validator; it excludes the Node adapter, ticker identifier map, provider samples, cache and SQLite database. Public source code contains the adapter and MIT mapping, but no collected MSN prices/statements or owner records. Code licensing does not establish public dataset redistribution rights; see the [source review](IDX_CLI_REVIEW.md) and its linked provider terms.

## Verification

- **305 Node checks passed**, including16 focused MSN contract/adapter tests: identity, units, date validation, nulls, independent arithmetic, conflicts, two-minute caching, fixed hosts, denial handling, response size and concurrency.
- **5 local API checks passed**, including foreign-origin/cross-site rejection, invalid400/unknown404 symbols, unsupported mutations, private backend-file denial, token protection and safe second-server startup.
- **32 isolated browser checks passed**: live BBCA/ADRO/TLKM identity and currency checks, ten statement periods per sample, independently reconciled EPS; synthetic stale/missing/wrong-issuer/access-denied cases; old-response invalidation; keyboard thesis preparation; persistence and complete isolated restore preserving original target records; dark mode, reduced motion, widths320/390/768/1440; static Pages makes no MSN requests.
- **40 existing-workflow browser checks passed** on the rebuilt static edition: automatic NVDA/AAPL research, retained model links, thesis → decision → paper purchase/sale → outcome review, oversell rejection, independent cash/cost/fees/realized-profit examples, complete isolated restore and unchanged original Paper/Real records. An earlier attempt reached a browser wait timeout; a fresh diagnostic read and complete fresh-context rerun succeeded without application errors. The first timeout's cause was not isolated; these checks do not establish universal timing or availability guarantees.
- Publication-boundary inspection confirmed the output contains neither the adapter/map nor the public frontend client identifier, ignored provider samples or database.

Only clearly labelled synthetic records were created in fresh browser contexts. Raw live responses and validation screenshots stay in ignored local folders. Sample endpoint success does not prove every ticker, future availability, source accuracy or real-time freshness. A consumer endpoint can change or deny access; unavailable sections stay visible and the established Yahoo/Office workflows remain available.
