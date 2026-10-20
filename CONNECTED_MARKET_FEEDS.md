# Native market price updates

Market prices stay in the original Office watchlist and detail view. Automatic TradingView quote panels have been removed. Office does not extract quote numbers from external frames or send private records to a provider.

## Acquisition and publication

The separate native-price workflow is scheduled every five minutes and can be dispatched manually. It refreshes every instrument key in the published catalogue: US equities/ETFs, IDX equities, bond ETFs, exact cash indices and exact commodity futures. It requests Yahoo spark batches of at most 20 verified source symbols, with two concurrent requests. Responses are mapped by their symbol, never their order. Identity, exchange, currency, instrument type, timestamps, daily-close references and change arithmetic are validated by the existing quote adapters and public contract. The start-of-window chartPreviousClose is never treated as yesterday's close.

A price-only run restores the newest verified site artifact for the current main revision, replaces only public price JSON and republishes that artifact. It skips interface releases in progress and rechecks the main revision before publishing. No market JSON is committed to Git history. No analytical history, model result, forecast registration, portfolio valuation or private vault record is rewritten by price collection. If an interface release starts during publication, its later full deployment remains authoritative.

The client checks every 60 seconds while visible and idle. It reads one small deterministic bucket per selected instrument rather than downloading the complete 11 MB price snapshot each minute. A quote with an older source timestamp, or an older retrieval for an identical timestamp, cannot displace a newer published quote. Failed or incompatible source responses retain a valid older quote with an explicit status, or remain unavailable. No replacement symbol, zero, guessed currency or synthetic price is used.

Five-minute scheduling is not a guarantee of five-minute delivery or exchange real-time entitlement. GitHub scheduling, collection, publication, caching and source delivery all add latency. Source observation time remains the freshness reference. Bond ETF share prices are not individual-bond yields. Gold futures are not retail gold or spot XAU/USD. Source delay is unknown unless the source supplies it.

## Checks on 21 October 2026 (Jakarta)

An actual complete collection attempted 8,641 published instrument keys in 432 source requests: 8,619 refreshed, one retained older valid quote and 21 unavailable. The 22 refresh failures were explicitly retained, including unsupported warrant listings; there was no rate-limit response during this check. These are observed acquisition results, not a guarantee of later coverage. Browser and contract checks cover native rendering, source identity, dated arithmetic, missing symbols, batch reordering, rate restrictions, source regression and private-record preservation.

GitHub schedule and release behavior: [workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
