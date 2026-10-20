import {createHash} from 'node:crypto';
// Version the changed workspace and macro UI graph, without rewriting the core forecasting mathematics,
// worker mathematics, JSON acquisition URLs, page paths or personal-storage keys.
const macroModules=/(['"])(\.{1,2}\/(?:chart-typography|macro-forecast|macro-forecast-ui|macro-indicators-contract|macro-indicators-ui|portfolio-events|portfolio-reconciliation|prediction-review|data-coverage|data-coverage-ui|portfolio-close-prices|portfolio-prices-ui|model-accountability|portfolio-performance|performance-ui|quarterly-regime|private-vault-client|private-vault-ui|model|prediction-math|prediction-ui|complete-backup|market-data-storage|research-layout|auto-valuation-ui|quant-ui|atlas-ui|office-extensions|office-storage|office-workflows|browser-api|stock-comparison|workspace-health|advanced-ui|data-status|macro-visuals|quant-charts|market-terminal|official-rates|official-rates-contract|public-quote-contract|macro-cycle|market-catalogue|market-history-contract|workspace-navigation|workspace-shell|research-lab|market-data-ui|macro-chart|macro-ui|macro-atlas|macro-context-contract|macro-context-math|macro-context-ui|macro-releases-contract|macro-releases-ui|macro-extended-contract|macro-extended-ui|macro-navigation|macro-briefing|market-view|fx-history-contract)\.js)\1/g;
export function versionMacroAssets(input){
 // The import-rewrite policy is part of the identity, so a cache fix also
 // invalidates an otherwise unchanged entrypoint and its cached imports.
 const entries=Object.entries(input).sort(([a],[b])=>a.localeCompare(b)),version=createHash('sha256').update(JSON.stringify({importPolicy:macroModules.source,entries})).digest('hex').slice(0,16),assets={};
 for(const [file,source]of entries){let text=source;if(file.endsWith('.js'))text=text.replace(macroModules,(_,quote,url)=>quote+url+'?office='+version+quote);
  if(file==='index.html'){if(!text.includes('src="app.js"'))throw Error('Pages entrypoint changed before macro asset versioning.');text=text.replace('src="app.js"','src="app.js?office='+version+'"').replace('src="browser-controls.js"','src="browser-controls.js?office='+version+'"').replace('src="theme.js"','src="theme.js?office='+version+'"').replace(/href="([^"?]+\.css)"/g,(_,url)=>'href="'+url+'?office='+version+'"').replace('</head>','<meta name="office-macro-assets" content="'+version+'"></head>');}
  assets[file]=text;
 }
 return {version,assets};
}
