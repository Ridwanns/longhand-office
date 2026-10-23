# Longhand macro research desk

19 October 2026. Incremental presentation and navigation change over release `8ebb071`.

## Direction

The macro workspace now starts with a compact economic briefing rather than a row of region tabs and a large world map. The design uses Longhand's existing serif headings, restrained colours, tabular numbers and architectural sidebar. It is an original workspace arrangement; no claim is made to reproduce any bank or hedge fund's internal software.

The user's subsequent feedback specifically rejected oversized numbers. The final scale is **20 px summary readings, 11 px chart-axis labels, and 240 px briefing charts**, with two charts side by side when there is enough space. The compact design removes the oversized editorial opening and the instructional sidebar from the first prototype.

## Navigation and retained capabilities

- Primary Macro destinations: Briefing, Economy, Rates, Cross market, Evidence. Existing route names and legacy deep links remain valid.
- A single shared economy control supports all 46 existing economies/aggregates. Country selection updates the address and destination links, including new country-specific global routes such as `#market/macro/global/economy/KOR`.
- Initial legacy URLs retain their original address. Changing a filter replaces the current scope in the URL; moving between workspaces creates normal navigation history. Country selection survives refresh and workspace Back/Forward.
- Briefing presents growth, inflation, the connected policy instrument and government yield with their own source periods, frequencies and freshness flags. It uses the existing source-selection functions.
- Growth and inflation charts retain source boundaries, exact observations, pointer/touch inspection and keyboard inspection. A newer national reading is not appended to a different historical series.
- Research tools retain annual histories, growth/inflation analysis, liquidity and the published release calendar. The full interactive map, comparisons, map table and chart gallery remain accessible through Explore the world map.
- Research Lab, investment theses and decision journal links lead to existing workspaces. They do not claim to copy selected observations into records automatically. The existing original-monitor thesis-note action remains available with its existing source-scope guard.
- Evidence retains source methods, timestamps, original values and separate public-data downloads. Records and private backups remain in their existing workspace.

## Specific chart-number defect

SVG labels previously scaled with the entire graphic, which could produce very large percentage labels while a chart was being laid out or resized. Chart inspection now observes the rendered SVG size and compensates label font size and marker radius for its actual screen transform. Axis labels stay at 11 screen CSS pixels and the selection marker at 3 px. The sizing observer releases removed SVGs and disconnects on workspace removal or abort.

Briefing charts use a compact presentation height; this changes plotting coordinates, not source values or model outputs. Pointer inspection uses the inverse SVG screen transform so that selecting a date remains accurate when a height-limited SVG has unused space around its content.

A separate layout defect came from the original generic `header` rule's fixed 100 px height. The new macro headers explicitly use content height, preventing a tall opening from overlapping the Research tools buttons. This fix is scoped to Macro.

## Preservation and validation

No portfolio calculations, Quant mathematics, financial-data contracts, storage schemas, database migrations, saved studies, original research inputs, private records or backup formats are changed. No provider or new market feed is introduced.

Validation covers the original Node suite plus new presentation/navigation tests, legacy macro suites, failure/retry behaviour, exact source values, shared scope, refresh and Back/Forward, keyboard/touch, dark/reduced-motion layouts and mobile widths down to 320 px. A deliberate SVG-enlargement test checks that axis text and markers remain fixed in screen pixels, and that touch inspection still selects the correct date. Synthetic records are created only in fresh isolated browser profiles.

Executed before publication: **541 Node tests, 6 API tests and 869 browser assertions passed**, with no uncaught browser exceptions in those runs. The browser count includes 34 compact-briefing checks on the built Pages preview and another 34 on the isolated local Node edition, plus the retained macro, workspace, Quant-navigation and investment/backup workflows. Existing browser suites were updated to explicitly open the now-folded map or Research tools; source-value and preservation assertions remain in place. A source-outage assertion now checks visible briefing values rather than hidden map text.

The source-data limitations from the previous release remain: some economies lack connected indicators, some latest observations are old, and longer histories may use a different source from the newest national reading. The new briefing exposes those limits rather than adding forecasts, causal claims, investment scores or invented values.
