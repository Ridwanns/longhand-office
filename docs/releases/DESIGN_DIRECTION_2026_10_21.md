# Economic and Quant chart direction

Editable design review: https://www.figma.com/design/tHGUiJxvYHJz8ba6EBuxS5

## Element choices

- Macro focus: at most six connected priority indicators per economy, compact source-exact line/dot cards, precise consecutive changes and historical ranges available on demand. Additional records stay in a searchable disclosure. GDP/CPI/policy are no longer duplicated in a separate monitor strip; annual fallbacks are explicitly background data. Independent scales are explicit. Short records remain short; there is no invented composite health score.
- Quant scenarios: two distinct panels: 120 seeded colored sample paths with median and restrained 5–95% shading, plus a separate terminal-price histogram with its own count axis. Histogram counts retain all 5,000 advanced or 1,000 core draws, with an explicit full-horizon label during playback. A dashed starting-price reference is not an expected-value forecast. Display paths replay the original RNG sequence and reconcile against all 12 saved paths; model outputs and storage versions are unchanged. Neither is labelled validated forecast accuracy.
- Model comparisons: lollipop/dot marks compare RMSE on the same units and chronological origins, with the numerical audit retained.
- Market regime: the existing zero-to-one filtered-state curve gains a session-tile heatmap of the last 120 retained probabilities. It is not a recession or future-loss probability.
- Market prices: preserve the native watchlist, price readouts and source-backed historical charts; update their data separately. No additional black quote widget.
- Across views: screen-sized 11px chart labels, lighter grids, rounded restrained panels and consistent cyan/teal/violet/amber accents in both themes. No smoothing or distortion of observed prices.

## Boundaries behind the references

Reference images guide composition and visual hierarchy. Donuts require valid part-to-whole quantities. Candlesticks require source OHLC. Monthly strategy-return calendars, Q–Q diagnostics, PDE surfaces and binomial trees are not represented as existing capabilities merely because they appeared in a reference. An observed price chart is not relabelled strategy performance. Existing mathematical models, saved inputs and forecasts remain unchanged.

Figma contains editable desktop/mobile macro cards and four source-backed Quant panels. Quant design examples use the retained NVDA source cutoff 19 October 2026 and its reproducible model result. Figma uses Arimo as an Arial-compatible design fallback because the service did not offer the application's installed Segoe UI/Arial fonts. The application keeps its existing system typography.

## High-impact selection and source boundaries

The stars label an Office editorial focus, not scraped or licensed per-event ratings. [Investing.com’s calendar FAQ](https://www.investing.com/economic-calendar/) identifies GDP, CPI, central-bank decisions, payrolls and unemployment as typical high-impact categories; its ratings describe expected market volatility, not data quality or direction. The UI keeps this distinction visible.

Every economy prioritizes connected GDP, headline CPI and its own policy instrument; national unemployment is used for the US and explicitly annual ILO-modelled background elsewhere. The US also includes the original payroll employment level (not silently relabelled monthly NFP change) and nominal retail sales. Indonesia adds monthly trade balance, reserve assets and core inflation. Missing national releases are not manufactured to fill six slots. World is an aggregate and has no invented policy rate.

Economic values continue to come from the connected official statistical releases and their established World Bank/BIS/FRED distribution series. Source periods, retrieval dates, missing observations, stale flags and independent definitions remain intact. Official examples of release coverage: [US BLS](https://www.bls.gov/bls/newsrels.htm), [China NBS](https://www.stats.gov.cn/english/PressRelease/), and [Malaysia DOSM](https://open.dosm.gov.my/publications/upcoming). These links do not assert that every national release is connected.
