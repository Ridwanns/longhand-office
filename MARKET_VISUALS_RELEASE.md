# Market charts and instrument clarity — 16 October 2026

The Macro overview now leads with reported GDP bars and inflation history. Interpretation, source methods and exact observations remain available in disclosures. Annual World Bank history is separate from BPS quarterly GDP and monthly inflation. Indonesia currently has two reviewed observations per BPS series; no extra releases were invented to fill the charts.

A geographic GDP comparison covers Indonesia, Malaysia, Singapore, Thailand, the Philippines and Vietnam. The six latest annual values and their individual years remain visible in a keyboard-accessible comparison table. Missing values stay unavailable and uncolored. The map uses Natural Earth 1:110m public-domain boundaries, projected to an approximate regional view; Singapore has a location marker because it is absent at that boundary resolution. Geography is an overview, not a political boundary authority. Country links open the corresponding annual Macro context.

The dark theme uses neutral graphite surfaces instead of blue-green backgrounds. Native plot labels remain readable at tested widths from 320 to 1440 pixels, with reduced-motion preferences retained. The original courtyard entrance, Quant calculations and record schemas are unchanged.

## Instruments and sources

- Index names lead the snapshot table: S&P 500, Nasdaq Composite, Dow Jones Industrial Average, IDX Composite and Cboe VIX. Yahoo identifiers remain secondary source identifiers, not fund names.
- Bonds opens with the official US Treasury daily par yield curve in percent, followed by the separately labelled iShares bond ETFs. The graph uses actual maturity on a logarithmic axis, joins only reported adjacent tenors and breaks at missing values. It is neither a live bond quote nor a discount-factor curve. Original exact tenor values and source dates remain visible.
- An optional TradingView chart desk supports the public symbols that successfully rendered during this release check. Selecting an instrument and pressing **Load chart** opens the chart within Office. It follows the Office light/dark theme. A direct TradingView link remains available.
- Actual provider checks rendered Apple, Microsoft, NVIDIA, Berkshire Hathaway Class B, BBCA, BBRI, TLKM, ADRO and IDX Composite. S&P 500, Nasdaq Composite, Dow Jones, VIX, the three Treasury yields and the three tested continuous futures were restricted by the public widget. Those entries offer their original direct links; Office does not embed a known error panel or silently replace an index/yield/future with a CFD or ETF. Availability can change.
- TradingView's [North America widget data table](https://www.tradingview.com/widget-docs/markets/north-america/) lists US stocks as **delayed Cboe One**. Its [Asia/Pacific table](https://www.tradingview.com/widget-docs/markets/asia-pacific/) lists IDX stocks and indices as **end-of-day**. Automatic chart updates are not proof of exchange real-time entitlement. The [data FAQ](https://www.tradingview.com/widget-docs/faq/data/) explains exchange licensing and widget limits. An upgraded personal TradingView plan does not license real-time redistribution on this website.
- TradingView is a visual source here. Chart values do not feed retained models, portfolio valuations, backup records or macroeconomic calculations. Office snapshot data retains its existing independent acquisition and publication schedules. There is no newly implemented real-time exchange feed.

## Privacy

Third-party code executes in a sandboxed, cross-origin TradingView iframe, not in the Office document. The frame URL contains only public symbol/display settings and the Office hostname. Normal third-party technical information (for example IP address and browser information) can reach the provider when the chart is loaded. The iframe has no access to Office local storage or the parent document; no portfolio, thesis, decision, model input, authentication token or API key is passed. Referrers are suppressed. Source and market collectors remain separate from personal records.

Office's local and Pages content policies allow only the observed official chart frame hosts, while keeping Office script execution restricted to its own origin. Failed or restricted embedding always has a direct provider link and never alters a record or substitutes a numerical value.

## Validation

- **343 Node checks** and **5 API integration checks** passed. Four new independent plotting tests cover zero baselines/negative GDP, missing observation gaps, annual cadence and map coverage without fabricated zero values.
- **273 local browser assertions** passed: Macro 86, chart/name/privacy/layout checks 56, workspace navigation/persistence 99, official rates 19, automatic-refresh behavior 13.
- **387 static browser assertions** passed: the same five suites, plus 74 scientific Quant plot assertions and 40 complete investment workflow/isolated backup restore assertions. No Office JavaScript errors were reported in these suites.
- The 56 chart-desk checks isolate external HTML with a clearly labelled test response to make keyboard, privacy and layout checks reproducible. Provider rendering was also checked independently against the real TradingView service for the nine supported and ten restricted symbols above. A successful canvas render alone was not counted as available: the source chart had to contain the original instrument and a numerical quote, without the provider's restricted-symbol message.
- A transient ECB HTTP 504 was observed during acquisition. The app withheld its CPI value and directional classification; a subsequent official collection returned valid observations. External providers and future releases can fail, so the checks do not guarantee permanent data availability or absence of every possible bug.

Tests use new browser contexts, local test port 4174 or the generated static build. Owner records on port 4173 were not edited. Public Research was not changed. Personal backups, databases and validation screenshots are excluded from the public artifact.

Invalid market categories, including inherited object-property names, now open the US market fallback instead of producing a blank screen. Five browser assertions per edition cover this verified navigation defect.
