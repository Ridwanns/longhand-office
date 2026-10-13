# GitHub repository and Pages preview

The complete application belongs in a **private** source repository. Personal records, databases, backups, validation artifacts, exports and credentials are excluded from Git. Source control is not a backup of investment records; continue exporting records locally.

GitHub Pages is static hosting. It cannot run the local Node server, SQLite vault, market proxy or Quant workers. Publishing the existing application unchanged would leave important workflows broken and would not provide private authentication.

A separate **read-only design preview** is prepared in `pages/`. It retains the architecture, room navigation, light/dark themes and links the public research catalogue. It provides honest module descriptions with no private data entry, fabricated market prices or model results. The complete working application remains local.

Build it with `node scripts/build-pages.mjs`. The output is `dist/pages`, using an explicit eight-file allowlist. Only this output is uploaded by `.github/workflows/pages.yml`. The Pages workflow runs manually; pushing source never automatically publishes a site. `noindex` asks search engines not to list the preview; it is not access control.

Normal GitHub Pages sites can be **public even when their repository is private**. Pages from a private personal repository requires GitHub Pro or another eligible paid plan. Private-site access control requires an eligible GitHub Enterprise Cloud organization; a personal private repository does not provide that. See [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) and [private Pages access control](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site).

Do not change source visibility to public or publish the local application to bypass these limits. Before launching a hosted private working office, implement genuine authentication and workspace authorization on a supported backend. Browser storage in a Pages visitor's browser is neither authenticated server storage nor a synchronized private investment vault.
