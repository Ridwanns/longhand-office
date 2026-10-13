# GitHub repository and Pages preview

## Current status — 13 October 2026

Source was pushed to [Ridwanns/longhand-office](https://github.com/Ridwanns/longhand-office), verified **PRIVATE** with `main` as the default branch. [GitHub CI](https://github.com/Ridwanns/longhand-office/actions/runs/38374011045) passed all 152 application tests and the isolated Pages build on Ubuntu/Node 24.

Enabling Pages returned HTTP 422: **“Your current plan does not support GitHub Pages for this repository.”** The subsequent Pages read returned 404, confirming no Pages site is configured. Repository visibility was not changed, no public fallback repository was created, and the publication workflow was not dispatched.

The read-only preview passed 84 browser assertions across 13 routes at desktop/390/320 px, including dark-theme persistence, reduced motion, skip-link/building keyboard navigation, no private data inputs, no local API requests and no JavaScript exceptions. A local preview is available while its server is running at `http://127.0.0.1:4175/pages/`. No investment records were uploaded or restored.

After obtaining an eligible GitHub plan, Pages must be enabled with GitHub Actions as its source. Before manually dispatching **Publish public design preview**, understand that it publishes a publicly accessible preview; it does not provide private application hosting. A privately accessible Pages site requires an eligible Enterprise Cloud organization.

## Publication boundary

The complete application belongs in a **private** source repository. Personal records, databases, backups, validation artifacts, exports and credentials are excluded from Git. Source control is not a backup of investment records; continue exporting records locally.

GitHub Pages is static hosting. It cannot run the local Node server, SQLite vault, market proxy or Quant workers. Publishing the existing application unchanged would leave important workflows broken and would not provide private authentication.

A separate **read-only design preview** is prepared in `pages/`. It retains the architecture, room navigation, light/dark themes and links the public research catalogue. It provides honest module descriptions with no private data entry, fabricated market prices or model results. The complete working application remains local.

Build it with `node scripts/build-pages.mjs`. The output is `dist/pages`, using an explicit eight-file allowlist. Only this output is uploaded by `.github/workflows/pages.yml`. The Pages workflow runs manually; pushing source never automatically publishes a site. `noindex` asks search engines not to list the preview; it is not access control.

Normal GitHub Pages sites can be **public even when their repository is private**. Pages from a private personal repository requires GitHub Pro or another eligible paid plan. Private-site access control requires an eligible GitHub Enterprise Cloud organization; a personal private repository does not provide that. See [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) and [private Pages access control](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site).

Do not change source visibility to public or publish the local application to bypass these limits. Before launching a hosted private working office, implement genuine authentication and workspace authorization on a supported backend. Browser storage in a Pages visitor's browser is neither authenticated server storage nor a synchronized private investment vault.
