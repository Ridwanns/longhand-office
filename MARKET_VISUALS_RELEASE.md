# Market charts and instrument clarity — 16 October 2026

The Macro overview now leads with reported GDP bars and inflation history. Interpretation, source methods and exact observations remain available in disclosures. Annual World Bank history is separate from BPS quarterly GDP and monthly inflation. Indonesia currently has two reviewed observations per BPS series; no extra releases were invented to fill the charts.

A geographic GDP comparison covers Indonesia, Malaysia, Singapore, Thailand, the Philippines and Vietnam. The six latest annual values and their individual years remain visible in a keyboard-accessible comparison table. Missing values stay unavailable and uncolored. The map uses Natural Earth 1:110m public-domain boundaries, projected to an approximate regional view; Singapore has a location marker because it is absent at that boundary resolution. Geography is an overview, not a political boundary authority. Country links open the corresponding annual Macro context.

The dark theme uses neutral graphite surfaces instead of blue-green backgrounds. Native plot labels remain readable at tested widths from 320 to 1440 pixels, with reduced-motion preferences retained. The original courtyard entrance, Quant calculations and record schemas are unchanged.

## Instruments and sources

- Index names lead the snapshot table: S&P 500, Nasdaq Composite, Dow Jones Industrial Average, IDX Composite and Cboe VIX. Yahoo identifiers remain secondary source identifiers, not fund names.
- Bonds opens with the official US Treasury daily par yield curve in percent, followed by the separately labelled iShares bond ETFs. The graph uses actual maturity on a logarithmic axis, joins only reported adjacent tenors and breaks at missing values. It is neither a live bond quote nor a discount-factor curve. Original exact tenor values and source dates remain visible.
- Charts load automatically inside Office, with no Load chart or Open on TradingView step. Selecting a symbol, range or observation frequency updates the same panel. Watchlist stock selections also update the chart; supported source venue mappings are retained. The chart follows the Office theme.
- Actual provider checks rendered Apple, Microsoft, NVIDIA, Berkshire Hathaway Class B, BBCA, BBRI, TLKM, ADRO and IDX Composite. S&P 500, Nasdaq Composite, Dow Jones, VIX, the three Treasury yields and the three tested continuous futures were restricted by the public widget. Restricted indices and futures now render separately labelled Yahoo Finance histories inline; their source and contract-roll basis are explicitly different from TradingView. Treasury yields use the official par-yield curve. Bond ETFs have their own inline history panel. No index/yield is relabelled as an ETF or CFD. USD/IDR (ICE) and EUR/USD (FXCM) also rendered in the public widget; policy-rate economic symbols and DXY did not, so their numerical feeds are not invented. Availability can change.
- TradingView's [North America widget data table](https://www.tradingview.com/widget-docs/markets/north-america/) lists US stocks as **delayed Cboe One**. Its [Asia/Pacific table](https://www.tradingview.com/widget-docs/markets/asia-pacific/) lists IDX stocks and indices as **end-of-day**. Automatic chart updates are not proof of exchange real-time entitlement. The [data FAQ](https://www.tradingview.com/widget-docs/faq/data/) explains exchange licensing and widget limits. An upgraded personal TradingView plan does not license real-time redistribution on this website.
- TradingView is a visual source here. Chart values do not feed retained models, portfolio valuations, backup records or macroeconomic calculations. Office snapshot data retains its existing independent acquisition and publication schedules. There is no newly implemented real-time exchange feed.

## Privacy

Third-party code executes in a sandboxed, cross-origin TradingView iframe, not in the Office document. The frame URL contains only public symbol/display settings and the Office hostname. Normal third-party technical information (for example IP address and browser information) can reach the provider when the chart is loaded. The iframe has no access to Office local storage or the parent document; no portfolio, thesis, decision, model input, authentication token or API key is passed. Referrers are suppressed. Source and market collectors remain separate from personal records.

Office's local and Pages content policies allow only the observed official chart frame hosts, while keeping Office script execution restricted to its own origin. Restricted embedding uses its independently sourced Office history panel. Retrieval failure shows an unavailable state and an in-place retry; it never alters records or substitutes a zero price.

## Validation

- **350 Node checks** and **6 API integration checks** passed. Four new independent plotting tests cover zero baselines/negative GDP, missing observation gaps, annual cadence and map coverage without fabricated zero values.
- **275 local browser assertions** passed: Macro 86, chart/name/privacy/layout checks 58, workspace navigation/persistence 99, official rates 19, automatic-refresh behavior 13.
- **389 static browser assertions** passed: the same five suites, plus 74 scientific Quant plot assertions and 40 complete investment workflow/isolated backup restore assertions. No Office JavaScript errors were reported in these suites.
- The 58 inline chart checks isolate external HTML with a clearly labelled test response to make keyboard, privacy and layout checks reproducible. Provider rendering was also checked independently against the real TradingView service for the nine supported and ten restricted symbols above. A successful canvas render alone was not counted as available: the source chart had to contain the original instrument and a numerical quote, without the provider's restricted-symbol message.
- A transient ECB HTTP 504 was observed during acquisition. The app withheld its CPI value and directional classification; a subsequent official collection returned valid observations. External providers and future releases can fail, so the checks do not guarantee permanent data availability or absence of every possible bug.

Tests use new browser contexts, local test port 4174 or the generated static build. Owner records on port 4173 were not edited. Public Research was not changed. Personal backups, databases and validation screenshots are excluded from the public artifact.

Invalid market categories, including inherited object-property names, now open the US market fallback instead of producing a blank screen. Five browser assertions per edition cover this verified navigation defect.

## Long histories and automatic inline charts

The local collector acquired roughly 2,400–2,500 real daily observations for each of eleven indices, futures and bond ETFs, spanning October 2016 to October 2026 where available. A separate bounded public historical feed retains up to 6,000 source observations per instrument; it does not enlarge every quote in the 8,000+ stock catalogue or overwrite the model history files. Office quote snapshots keep their original 20-observation bound. Saved Quant inputs, prior results and personal records are unchanged.

The initial chart requests ten years with weekly observations. Range controls provide 1Y, 5Y, 10Y and All available; frequency controls provide daily, weekly and monthly. Native weekly/monthly charts retain the last actual source close of each reported period, preserving its actual date. Empty periods are omitted, never filled or averaged into a fictional price. Source Close histories are not a total-return calculation. A listing or source with less than ten years of history cannot show invented earlier observations.

The long-history file is collected separately during publication and remains dated on Pages. Locally, an existing file is reused for at most fifteen minutes before a new read requests collection. A long-history outage can show the existing short snapshot with an explicit warning; it cannot silently claim a ten-year series. Late history responses are prevented from replacing a newer chart selection. FX widgets are display sources only and never convert portfolio currencies.

Seven new Node checks independently verify historical quote identity and daily changes, invalid/missing data rejection, original snapshot bounds, explicit ten-year request bounds, weekly/monthly last-close grouping and calendar range selection. Actual TradingView rendering was independently checked at the ten-year weekly configuration, including visible pre-2020 history, rather than inferring availability from an iframe load.

## Published verification

Application commit `ef95026242609c7a6bd009ea6231e614a9a9db3b` passed [application checks](https://github.com/Ridwanns/longhand-office/actions/runs/38909824614) and [Pages publication](https://github.com/Ridwanns/longhand-office/actions/runs/38909824612). After deployment, the actual hosted site passed another **144 browser assertions** (58 inline-history checks and 86 Macro checks), with no Office JavaScript errors. The hosted historical feed contained all eleven valid series, beginning 17 October 2016 and ending 16 October 2026, with 2,412–2,516 observations per series; all twenty Macro series were available in that publication.

The publication independently checked **5,264 core model cases across 1,345 histories** and **8,438 quote records**, with no invalid quotes, missing core instruments or model failures. Twenty-nine histories remain explicitly price-only where the source does not supply enough completed observations for the models. Data availability and future releases can change. Existing retained analyses are not replaced by a new publication.
