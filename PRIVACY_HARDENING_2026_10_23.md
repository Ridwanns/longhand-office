# Encrypted device workspace — 23 October 2026

## Scope and activation

The public GitHub Pages build starts with `secure-bootstrap.js`. It imports neither the application nor the browser job controller until the user unlocks an encrypted workspace or explicitly starts an empty temporary session. The desktop Node edition retains its existing local backend; this change does not claim to encrypt that backend.

A user chooses the passphrase on their own device. No owner records or passwords were inspected or migrated during development. Existing plaintext is protected only after that user completes the on-device migration flow: close other Office tabs, choose the password, download and confirm the encrypted full-vault recovery file, then explicitly remove the old plaintext copies. The UI withholds the application during incomplete migration. There is no password reset.

## Storage and encryption

The device container uses a dedicated versioned format, PBKDF2-SHA256 with 600,000 iterations, a random 128-bit salt, and AES-256-GCM with a fresh random 96-bit IV per committed revision. The format, vault identifier, revision, timestamp and derivation settings are authenticated as additional data. The nonextractable key is derived once per unlock and retained in memory; no passphrase is written to storage or sent over the network. A tagged codec preserves own `undefined` values, sparse arrays, dates and binary fields that ordinary JSON would lose. Unsupported data or limits stop migration rather than truncating it.

Private localStorage and sessionStorage calls use in-memory facades. Six private IndexedDB archive families use explicit encrypted transaction adapters: records/core runs/recovery backups, continuity drafts/manual studies/predictions, ticker studies, advanced studies, automatic valuations, and complete-backup staging. All UUID workspace scopes under the current application path are included. Shared Longhand preference keys are retained as well. Unknown databases are left alone. Temporary guest sessions use memory only and do not load existing records; their notice explicitly overrides older per-tool wording about browser saves.

Encrypted commits serialize globally across archives and storage changes. Record and valuation saves resolve after the encrypted write commits. Failed commits retain the previous durable revision; optimistic local preferences roll back and report failure. A subsequent retry verifies the durable snapshot before clearing that failure. Web Locks allow one active workspace session per application path. Locking flushes pending drafts and checkpoints before reloading; inactivity locks after ten minutes, or after one minute in the background. The active app cannot silently fall back to plaintext storage after locking.

## Migration and recovery

Migration reads original rows, keys and store metadata, encrypts them, writes the container and independently decrypts its durable readback before offering cleanup. Cleanup requires an export of the current encrypted revision and explicit confirmation. It rechecks legacy values and archive fingerprints. A blocked legacy connection prevents cleanup through an abortable upgrade; closing it later does not leave a deferred destructive deletion of edited records. Partial cleanup remains retryable, including empty archive tombstones. Auto-increment allocation resumes above the largest retained numeric key; a formerly deleted high key's internal historical counter cannot be recovered from the old API.

The full encrypted recovery envelope can restore into an empty destination using the original passphrase. Existing encrypted vaults or legacy private records are never overwritten by this recovery route. Recovery files do not carry authority to delete plaintext on another device. Downloaded older unencrypted exports, browser/OS backups and forensic disk remnants are outside this cleanup.

## Browser restrictions and limits

The public edition permits network connections only to its own origin and the GitHub public-source hosts used for research. Arbitrary HTTPS endpoints and localhost private-service connections are removed from its policy. The optional unconfigured remote checkpoint UI is disabled in this build. JavaScript remains restricted to same-origin files, with no inline-script or eval allowance. An iframe cannot unlock this edition. No Pluang account or trading authorization is added.

This protects data at rest while the vault is locked. It does not protect decrypted data from malicious code executing while unlocked, browser extensions, device malware, screenshots, or compromise of the publishing account. Other pages on `ridwanns.github.io` share an origin; moving to a dedicated trusted origin remains a separate hosting improvement. GitHub account/branch protection is not changed by this release. This is a tested application hardening change, not an independent penetration-test certification.

## Verification

733 unit tests and 58 dedicated real-browser checks passed. Dedicated real-browser checks cover lossless migration of every archive family, recovery copies and restored scopes; exact key matching; concurrent writes; transaction rollback; simulated failed commits; blocked cleanup and retry; wrong passwords; tampered envelopes; cross-profile recovery; single-session locking; ephemeral guests; application import gating; portfolio and valuation persistence; complete ticker analytics; responsive controls at 320–1440 px; and manual/inactivity locking. Tests use disposable synthetic browser profiles and record request URLs/bodies to check that test passwords and private sentinels are not sent. The owner's browser profile, portfolio, private exports and vault remain untouched.
