#!/usr/bin/env bash
# Refresh the Office snapshot from the original sources, then rebuild every design sheet from it.
# Run from the repository root:  bash design/build/refresh-all.sh
# The snapshot lives in .pages-data (git-ignored). A copy of the previous snapshot is kept in .pages-data-previous.
set -euo pipefail
N=./.tools/security-node/node-v24.22.1-win-x64/node.exe
PY=.tools/yfinance/Scripts/python.exe
rm -rf .pages-data-previous && cp -r .pages-data .pages-data-previous

# 1. sources (each script validates and writes atomically)
$PY -I scripts/yahoo-stock-directory.py                 # stock screener: names, quotes, fundamentals
for s in official-rates-data market-history-data macro-data macro-context-data macro-extended-data \
         macro-indicators-data macro-releases-data fx-history-data pages-data; do
  echo "== $s"; $N scripts/$s.mjs
done
# a source that failed keeps its previous value and date (the app's own retention rule)
$N -e "import('./scripts/retain-macro-data.mjs').then(m=>m.retainMacroData('.pages-data','.pages-data-previous'))"
$N scripts/data-coverage.mjs

# 2. sheets (every figure computed from the snapshot; atlas uses the app's own selection code)
R="$(pwd -W 2>/dev/null || pwd)"; NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
$N design/build/build_atlas_rates.mjs "$R" .pages-data "$NOW"
$N design/build/build_atlas.mjs "$R" .pages-data "$NOW"
$N design/build/build_countries.mjs "$R" "$R/design"
$N design/build/build_cycles.mjs "$R"
$N design/build/build_macro_sheet.mjs "$R" .pages-data "$NOW"
$N design/build/build_markets_sheet.mjs "$R"
$N design/build/build_overview.mjs "$R"
$N design/build/build_calendar.mjs "$R"
$N design/build/build_research_sheet.mjs "$R"   # reads the isolated test workspace (4174) read-only
$N design/build/build_records_sheet.mjs "$R" "$NOW"
echo "Done. Snapshot: $(date)"
