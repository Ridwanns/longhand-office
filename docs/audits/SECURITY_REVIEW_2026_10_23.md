# Longhand security exposure review — 23 October 2026

Scope: tracked Longhand code and manifests, its public Pages deployment, publication workflows, the project Python environment, and version-only checks of relevant local runtimes. This is an exposure assessment, not a full-device forensic investigation or a guarantee that no compromise has occurred. No owner portfolio, vault content, broker account, password, cookie or secret value was opened.

## Confirmed findings and disposition

| Component | Evidence and exposure | Disposition |
| --- | --- | --- |
| Node.js | System executable is 24.19.0, older than the October 21 security release 24.22.1. Source collection uses Node fetch/Undici; upstream Brotli and TLS issues are relevant to these processes. The public website serves static files and has no deployed Node request handler. | Added supported 24.x LTS minimum 24.22.1 to project engines and guards for local serving/build/data entrypoints. All Node workflow jobs request the latest 24.x patch and check the minimum. Downloaded a project-only 24.22.1 Windows runtime from nodejs.org, checked its official SHA-256 and valid OpenJS Authenticode signature, and ran verification with it. The system-wide Node installation remains 24.19.0 and needs updating separately. |
| Python certificate store | Project venv contained certifi 2026.7.22. Its PyPI vulnerability metadata and the certifi maintainer advisory report the compromised emSign/eMudhra root issue. | Updated the project venv to certifi 2026.10.19 and added that minimum to requirements-data.txt. |
| Python installer | Project venv contained pip 25.0.1, with multiple advisory records. Conditions differ by issue; for example the older tar extraction issue has a Python-version mitigation. | Updated the project venv to pip 26.2.2. Old installer remnants were reversibly archived outside site-packages; they are not active distributions. CI upgrades pip before installing data requirements. The separate system Python installer was not changed. |
| Chrome | Installed desktop version 155.0.8059.85 precedes Google's October 20 stable security update 156.0.8078.47/.48. | User action: update Chrome through Settings → About Google Chrome and relaunch after saving work. No browser restart was performed. |
| Edge | Installed version 155.0.4283.62 precedes Microsoft's October 22 stable release 156.0.4314.42. | User action: update Edge through Settings → About Microsoft Edge and relaunch after saving work. Chromium-based embedded apps need their own vendor updates; this review does not certify them. |
| GitHub protections | Dependabot alerts/security updates, secret scanning and push protection were initially disabled. | Enabled all four. API readback confirms enabled; no open Dependabot or secret-scanning alerts were returned at the post-enable check. A newly enabled historical scan may take time. |
| Workflow supply chain | Pages Actions used movable version tags and checkout's default credential persistence. | Pinned Actions in publication, native-price refresh, application checks and security checks to the current upstream tag's verified commit SHA. Disabled persisted checkout credentials. Added weekly Dependabot updates for Actions and pip. No automatic merging is enabled. |

## Other reports in the supplied list

- PHP and GitLab: neither is a runtime or dependency of this repository. Hosting is GitHub Pages, not a self-managed PHP or GitLab server. Their RCE advisories therefore do not establish a Longhand production exposure.
- Signal/RingRTC, Oracle products and Atlassian products: not used by the repository. No matching application was found in the queried ordinary Windows uninstall entries; Signal was also absent from the common desktop install path. This does not assess phones, other machines or every possible portable installation.
- Fortinet: no repository dependency or matching ordinary local installation was found. Routers, VPN gateways and other network appliances were not inspected; their status is unknown.
- Linux KVM guest escape: the checked workstation is Windows and no registered WSL distributions were found. The underlying hypervisors/kernel patches of GitHub-hosted infrastructure are provider-managed and not inspectable from this repository. No independent assurance of those hosts is claimed.
- eMudhra: the site's live, validated TLS chain was Let's Encrypt → ISRG, not the affected eMudhra chain. This does not resolve the separate local client trust-store exposure; that is why certifi was patched and browser/Node updates remain necessary.

The patch counts in the forwarded post are not treated as a count of vulnerabilities affecting Longhand. A product/version and reachable vulnerable feature must match first.

## Code and deployment checks

The package manifest has no third-party npm runtime dependencies. Browser code is built with an explicit file allowlist; server scripts, SQLite databases, credentials and owner records are outside the published files. The live page has a self-hosted script/worker Content Security Policy with no unsafe-eval, and data requests are restricted to same-origin plus the configured GitHub read endpoints. Provider widgets are separate frames. Chart legend colours were moved from inline styles to CSS classes to retain this policy.

The local server binds to 127.0.0.1, validates its Host header, rejects cross-site requests, and requires a current random session token plus an allowed Origin for mutations. Four integration checks confirmed these gates, unsupported method/route rejection, invalid backup envelope rejection and safe handling of a second server process. Ordinary password-free browser entry is retained; no new login barrier was introduced.

A limited tracked-file scan of 493 existing files found no matching private-key, GitHub-token or AWS-access-key patterns. This is not a full secret audit of every historical commit, every token format or ignored local files. GitHub secret scanning/push protection now supplements that check.

Verification: 755 unit tests passed under the verified patched Node runtime; 3 Python scanner tests passed (including unavailable metadata treated as unknown, identity verification and duplicate/withdrawn advisory handling); 28 installed project Python packages were checked against PyPI with zero active advisories returned and zero acquisition errors; pip check reported no broken requirements. The pre-security chart release passed 98 public asset/source checks and browser checks; the updated chart/ordinary-entry browser suites passed 25 and 11 checks locally. No claim of complete vulnerability coverage is made by those counts.

## Ongoing checks

- Codex thread heartbeat: every day at 09:00 Asia/Jakarta, checks official new disclosures against this baseline and the actual project/runtime inventory. It stays quiet when unchanged and reports relevant new findings, worsening risk, unavailable checks or required user action. This requires the local Codex automation executor to be available.
- GitHub security workflow: scheduled daily at 02:15 UTC (09:15 WIB), independently checks the patched Node baseline and all packages in a fresh project Python venv against PyPI vulnerability metadata. A network/metadata failure fails explicitly instead of reporting a clean scan. GitHub schedules can be delayed.
- Dependabot: weekly reviewable update pull requests for Actions and pip, plus enabled security alerts and security updates. No automatic deployment of an update PR.
- Publication pipeline: requests current supported patches, applies the Node guard, refreshes pip/certifi and audits Python packages before collecting fresh public data. A UI-only release reuses verified source observations with their original dates.

## Primary references

- [Node.js October 21 security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
- [Certifi maintainer advisory](https://github.com/certifi/python-certifi/security/advisories/GHSA-6q48-6c7w-9gw2)
- [Mozilla eMudhra incident](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449)
- [Chrome October 20 stable release](https://chromereleases.googleblog.com/2026/10/stable-channel-update-for-desktop_02018666648.html)
- [Microsoft Edge security release notes](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-relnotes-security)
- [PHP critical advisory](https://www.php.net/archive/2026.php)
- [GitLab critical patch release](https://docs.gitlab.com/releases/patches/patch-release-gitlab-19-5-1-released/)
- [Oracle October CPU](https://www.oracle.com/security-alerts/cpuoct2026.html)
- [Atlassian advisories](https://www.atlassian.com/trust/security/advisories)
- [Fortinet PSIRT](https://www.fortiguard.com/psirt)
