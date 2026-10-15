# idx-cli applicability to Longhand Office

15 October 2026 · source review and bounded, read-only endpoint evaluation.

Subsequent implementation: the optional personal/local source desk is now available; see [IDX_MSN_LOCAL_RELEASE.md](IDX_MSN_LOCAL_RELEASE.md) for the implemented subset, tests and publication boundaries. The findings below describe the earlier review stage.

Repository: [0xrsydn/idx-cli](https://github.com/0xrsydn/idx-cli), inspected at [`a0471127374becb95b487ed660dad88a385222e1`](https://github.com/0xrsydn/idx-cli/tree/a0471127374becb95b487ed660dad88a385222e1). The top-level/crate source is MIT licensed. This is a selective review, not a complete audit of the repository, its dependencies or all supported instruments.

## What it adds

The Rust CLI and MCP share a provider layer: MSN supplies quotes, company metrics, financial statements and screening; Yahoo supplies the default OHLCV history. The separate ownership module consumes a maintained KSEI snapshot and supports local shareholder queries. These are relevant to the owner's request for additional free IDX data. They do not establish a real-time market-data entitlement or solve Office account authentication, active-vault encryption or cross-device synchronization.

## Observed endpoint checks

Fresh personal research requests used a declared Longhand Office User-Agent, ordinary HTTPS GETs and the public MSN client identifier documented in the pinned repository. No cookies, account credentials, browser/TLS impersonation, Cloudflare workarounds, provider sessions or private Office records were used. No npm/Cargo install, bootstrap script, downloaded binary or MCP registration was executed.

| Check | Observed result |
| --- | --- |
| MSN quote request for BBCA, BMRI and ADRO | HTTP200; each resolved to its requested ticker, XIDX exchange and IDR currency, with an explicit last-traded timestamp. This proves sample availability, not coverage of every issuer or real-time delay. |
| Single-symbol quote request | HTTP200 with the flat array shape expected by the CLI. The multi-ID endpoint returned one nested array per requested ID, so a future Office adapter must normalize batching deliberately. |
| BBCA company ratios | HTTP200; company-specific metrics and reporting-period fields were present. The first array entry was historical, not the newest period; array order must not determine recency. |
| BBCA financial statements | HTTP200; bank-specific statement type, quarterly/annual periods, IDR currency and report/source dates were present. Independently dividing same-period income for common shareholders by diluted average shares agreed with the reported diluted EPS within its displayed rounding. Raw statement values were not assumed to share one universal scale. |
| Maintained ownership manifest | HTTP200; schema1, snapshot period **30 September 2026**, generated **14 October 2026 UTC**, declared size and SHA-256 field present. Only manifest metadata was read: the SQLite file was not downloaded, verified or opened. |

Quote/ratio/statement checks were made on 15 October 2026, around **21:06–21:10 WIB**. A returned quote timestamp describes the observation, not a guarantee of streaming or absence of delay. The ownership registry is periodic source evidence, not live beneficial-owner tracking.

Raw provider samples and local probe scripts are retained only under ignored `.tools/idx-cli-review/`. They are excluded from Git and Pages. This public review deliberately does not redistribute MSN market prices or financial statement values.

## Integration rules for Office

1. **Keep provenance separate.** An MSN observation must carry its own ticker, exchange, currency, last-traded time, retrieval time and missing-data state. It must not be relabelled Yahoo, SEC, exchange-certified or real-time. Expired offline cache needs an explicit stale flag.
2. **Use actual OHLCV for range/volume models.** The repository's documented MSN history conversion sets open/high/low/close to one chart price and volume to zero. Office must treat that as price-only evidence and exclude it from HAR/range/volume calculations. Yahoo history remains a separate source with its existing adjustment definition.
3. **Preserve metric dates and explicit units.** The source mapper chooses values per metric, potentially from different reporting periods, and normalizes percentage-like values with an absolute-value threshold. Office should retain each selected period and verify the provider's units. For example, if a field is expressed in percentage points, a synthetic value0.5 means0.005 as a fraction; the mapper's magnitude heuristic would leave0.5. That is a reason to avoid copying its normalization blindly, not proof that every live metric is wrong.
4. **Keep quarterly, annual and TTM distinct.** Source EPS must retain its reporting interval and share definition. A quarterly EPS value cannot silently replace TTM EPS. Cash-flow units, capex sign, net borrowing and diluted shares still need same-period reconciliation. Generic CFO-based FCFE remains unsuitable for the bank examples already gated in Office.
5. **Treat valuation signals as heuristics.** The repository labels valuation from fixed P/E, P/B and related cutoffs. Those labels are not a substitute for Office's explicit scenarios, sector suitability, assumptions and observed-outcome checks. Do not automatically turn them into an investment decision.
6. **Separate code licensing from data permissions.** MIT applies to the code. Microsoft's current agreement limits financial information to personal, noncommercial use and imposes separate restrictions on reuse. This review does not establish permission to republish MSN datasets through public GitHub Pages. A bounded personal/local evaluation is the appropriate initial scope; public redistribution requires its own rights assessment.

## Decision

**Useful candidate for a local IDX source adapter, especially company statements and dated ownership evidence.** The tested MSN endpoints worked without an owner's Stockbit or Alpaca account, giving a concrete additional acquisition path to evaluate. They remain consumer-site endpoints with availability/schema risk, not an exchange SLA or proof of complete free real-time coverage.

The running Office, existing data providers, records, models, backups and public dataset publication were not changed by this review. No permission to redistribute MSN data is inferred from the repository's MIT license. A later integration should begin with an optional local, read-only adapter and fixture tests for schema, identity, currency, period, scale, nulls, staleness and model suitability before changing production calculations.

Sources: [README](https://github.com/0xrsydn/idx-cli/blob/a0471127374becb95b487ed660dad88a385222e1/README.md), [architecture and price-only history](https://github.com/0xrsydn/idx-cli/blob/a0471127374becb95b487ed660dad88a385222e1/docs/ARCHITECTURE.md), [MSN mapping](https://github.com/0xrsydn/idx-cli/blob/a0471127374becb95b487ed660dad88a385222e1/crates/idx-core/src/api/msn/map.rs), [fundamental signals](https://github.com/0xrsydn/idx-cli/blob/a0471127374becb95b487ed660dad88a385222e1/crates/idx-core/src/analysis/fundamental.rs), [ownership contract](https://github.com/0xrsydn/idx-cli/blob/a0471127374becb95b487ed660dad88a385222e1/docs/OWNERSHIP_SYNC.md), [Microsoft agreement: Bing/MSN and financial information](https://www.microsoft.com/en-us/servicesagreement).
