# Free data and protected complete backups

14 October 2026. This release adds features that can operate without a new account or subscription. It preserves the architectural interface, existing records, Paper/Real separation, model mathematics and older exports. No private records are uploaded and no provider credentials are introduced.

## Using the encrypted backup

1. Open Records. Expand **Protect your backup with a password**.
2. Enter and confirm a long unique passphrase of at least 12 characters. Choose **Download encrypted backup**.
3. Keep the downloaded `.encrypted.json` file and password separately. Office has no password-reset or escrow service.
4. To restore, use **Inspect complete backup** and select that file. Enter its password and choose **Unlock & inspect**.
5. Inspection validates the decrypted complete bundle without modifying records. **Restore to a new workspace** then recomputes retained models and creates a separate workspace. The original workspace remains available.

The ordinary **Back up everything** JSON export remains available and unencrypted. Older complete and individual backup formats remain supported by their existing workflows. Encryption does not alter active records or archive data. An encrypted complete export includes the same records, links, retained datasets, models, valuations, forecasts, drafts and preferences as a plain complete export.

### Protection boundary

This encrypts the downloaded backup file, not the active browser IndexedDB/localStorage or Node SQLite vault. After explicit restoration, the new workspace uses ordinary unencrypted device storage. The decrypted bundle is held in memory for inspection and written to the existing local staging workflow only after the owner explicitly selects Restore. This does not provide an app login, protection against compromised local software, or account synchronization. Previously downloaded plain files remain plain.

Web Crypto derives a non-extractable AES-256-GCM key using PBKDF2-HMAC-SHA-256 with 600,000 iterations, a fresh random 16-byte salt and a fresh random 12-byte nonce. The GCM authentication tag is 128 bits; format, version, timestamp, algorithms, salt and nonce are authenticated as additional data. There is no password verifier, password storage or key upload. Password inputs are cleared after operations and navigation. JavaScript memory cleanup is not a guaranteed secure erasure mechanism.

The envelope has an explicit version and strict supported parameters. Wrong passwords and altered ciphertext/metadata reject. Unsupported expensive KDF parameters reject before derivation. Plain complete content remains limited to 100 MB; encrypted JSON allows encoding overhead up to 134 MB. A long passphrase remains important. This is a first-party implementation using platform cryptography, not an externally certified cryptographic product. References: [Web Crypto key derivation](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey), [OWASP password derivation guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

Navigation during an unfinished operation invalidates its UI generation. Old completion cannot download a file, redirect into a restoration, replace current status or block a new Records-view export. No investment record is rewritten by cancelling the reading view.

## Official US annual evidence

The Investment brief has a collapsed **Official annual financial evidence · SEC** section for US instruments. The public data workflow collects selected issuer facts from official SEC company-facts JSON, separately from Yahoo quotes and valuation inputs. Initial coverage: AAPL, MSFT, NVDA, AMZN, GOOGL, META, JPM and BRK-B, plus normalized explicitly requested US symbols up to 40 total.

The collector resolves exact ticker-to-CIK identity through the official directory, uses declared project identification, fixed SEC hosts, one request per second, response bounds and no redirects. An optional repository variable `OFFICE_SEC_USER_AGENT` can set the owner's truthful SEC identification/contact string. No email address or identity is fabricated. APIs require no API key, but access can still be blocked; [SEC documents access and CORS restrictions](https://www.sec.gov/search-filings/edgar-application-programming-interfaces).

Eight standard-tag metrics cover reported revenue, net income, diluted EPS, diluted average shares, operating cash flow, PP&E cash payments, assets and stockholders' equity. Selection uses a supported annual 10-K/10-K-A period, matching accession and exact reporting interval; it does not stitch values from different filings. Amendments remain tied to their own facts. Competing tag values are withheld. USD units are explicit, missing figures remain unavailable, and foreign/IFRS/custom-only/quarterly data is not converted to a made-up USD annual packet. A supported historical period is displayed with its actual dates rather than asserted to be the company's latest report.

Reported annual EPS is not substituted for TTM EPS. Share-class comparability is not assumed. These facts do not silently replace saved Yahoo fundamentals, price observations, FCFE inputs or DCF scenarios. The section links to the SEC filing and displays report, filing and retrieval dates. When available at the time the owner saves a brief to a thesis, the exact displayed facts and provenance travel in the thesis evidence and therefore in complete backups. Later feed updates do not rewrite that saved evidence.

### Actual source availability

Local requests to both the official ticker directory and AAPL company-facts endpoint returned HTTP403. The collector recorded eight explicit unavailable entries and no substitute figures. Synthetic test facts were supplied only inside isolated browser request fixtures; they were never placed in the public data directory. The GitHub Actions acquisition will independently report its actual availability, appended to this report after publication. No bypass, alternate proxy or market-provider session was used.

## What still needs an external account or another release

- Cross-device private sync: no configured Supabase project or owner account is available in this workspace. No public login facade, permissive database or automatic private-data upload is added. Proper authentication, owner-only authorization, conflict handling and migration must precede activation.
- US live IEX: no Alpaca account/key is configured; no invented live feed is shown.
- IDX: existing dated provider data and manual valuation continue. This release does not establish a free complete real-time IDX entitlement or automatically parse every issuer PDF.
- Active-vault encryption is distinct from this file-encryption release and requires its own migration, key recovery and storage integration.

## Verification

The complete Node suite passes **289 tests**, including five cryptographic tests and nine official-source projection/collector tests. Four isolated local API checks pass. Independent Node `pbkdf2Sync`/AES-GCM decryption reconciles to the Web Crypto envelope and exact Unicode content. A synthetic annual EPS example independently reconciles net income400 / diluted shares100 = EPS4. Amendment, mixed-period, conflicting-tag, future-period, incompatible-unit and HTTP403 cases pass.

All **115 isolated local browser checks** passed: encrypted export/unlock/restore23, official-fact fixtures13, Simple workflow40, complete continuity34 and historical valuation5. They verify completed retained core/advanced models, wrong-password and tampering rejection, old pending restore invalidation, record/ledger preservation, password-input clearing, keyboard operation, mobile layouts and navigation during unfinished encryption. Official-fact fixtures verify issuer matching, escaped source text, explicit missing values, separate annual/TTM meanings and thesis evidence retention. No browser exceptions were reported. Desktop light and mobile dark screenshots were visually inspected. Final CI and publication receipts follow below.

## Publication and live verification

Application commit `39a498c34f1b414418aa40f48d00e8999b60061e` passed [Application CI](https://github.com/Ridwanns/longhand-office/actions/runs/38540155832) and [Pages publication](https://github.com/Ridwanns/longhand-office/actions/runs/38540155868). The deployed [Records screen](https://ridwanns.github.io/longhand-office/#records) passed the 23-check encrypted workflow again with actual retained NVDA core/advanced runs. The 13-check official-evidence fixture and 34-check continuity/complete-restoration suite also passed on the deployed application. Three additional checks exercised the actual SEC failure path: visible HTTP403/unavailable with no synthetic table, separate existing Yahoo valuation still available, and no browser exceptions. **73 live checks passed**, all in fresh isolated browser contexts, with no owner workspace replacement. The 13 official-fact fixture checks demonstrate behavior, not successful source coverage.

Actual SEC acquisition on GitHub also returned HTTP403. Its published feed at **2026-10-14T09:15:37.165Z / 16:15 WIB** contains eight explicit unavailable entries and **zero available SEC issuer packets**. Both local and runner failures remain visible; the new integration is ready and tested but does not yet increase live official-fundamental coverage. No proxy, alternate provider attribution or authentication bypass was used.

The separate Yahoo market vintage at **2026-10-14T09:10:11.936Z / 16:10 WIB** contains 1,346 histories, with **1,318 eligible histories / 5,272 passing core cases** and 28 price-only/ineligible histories. Sixteen representative advanced cases passed. All **8,611 quote entries** validated: 8,585 priced and 26 explicitly unavailable. Provider errors, invalid quotes and mandatory core quote failures were empty at this publication. A public directory entry does not guarantee fundamental or model availability, and snapshots remain dated rather than streaming.
