import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {readFlowlessPrice,readFlowlessStatus} from './flowless-adapter.mjs';
import {readUsSnapshot} from './us-market-adapter.mjs';
import {readMarketSnapshot} from './market-adapter.mjs';
import {createLocalAPI} from './local-api.mjs';
import {readLocalMsn,localMsnSymbols} from './idx-msn-adapter.mjs';
import {readMarketHistories} from './market-history-data.mjs';
import {readMacroSnapshot} from './macro-adapter.mjs';
import {readFxHistory} from './fx-history-data.mjs';
const root = process.cwd();
const portIndex=process.argv.indexOf('--port'),port=portIndex<0?4173:Number(process.argv[portIndex+1]);
if(![4173,4174].includes(port))throw Error('Only local workspace port 4173 and isolated test port 4174 are supported.');
const files = new Set(['index.html','style.css','app.js','model.js','theme.js','market-terminal.js','market-catalogue.js','building.svg','catalogue.json']);
['macro-atlas.js','macro-atlas-data.js','macro-atlas-labels.js','macro-atlas.css','office-visual-system.css','motion-system.js'].forEach(f=>files.add(f));
['chart-typography.js','macro-forecast.js','macro-forecast-ui.js','macro-indicators-contract.js','macro-indicators-ui.js','macro-chart.js','macro-context-contract.js','macro-context-math.js','macro-context-ui.js','macro-context.css'].forEach(f=>files.add(f));
['macro-releases-contract.js','macro-releases-ui.js','macro-extended-contract.js','macro-extended-ui.js','macro-navigation.js','macro-briefing.js'].forEach(f=>files.add(f));
['idr-valuation.js','idx-quant-context.js','valuation-analysis.js','valuation-analysis-ui.js'].forEach(f=>files.add(f));
files.add('chart-design.css');files.add('fx-history-contract.js');files.add('rooms.css');files.add('workflow-continuity.js');
files.add('macro-cycle.js');files.add('workspace-navigation.js');files.add('workspace-refinement.css');
['research-layout.js','research-lab.js','research-lab.css'].forEach(f=>files.add(f));
files.add('research-intent.js');files.add('quant-charts.js');files.add('workspace-shell.js');files.add('workspace-shell.css');
['macro-ui.js','macro-contract.js','macro.css','macro-visuals.js','macro-map-data.js','market-view.js','market-history-contract.js'].forEach(f=>files.add(f));
files.add('idx-msn-ui.js');files.add('idx-msn-contract.js');
files.add('encrypted-backup.js');
files.add('sec-fundamentals-contract.js');files.add('official-fundamentals.js');
files.add('official-rates.js');files.add('official-rates-contract.js');
files.add('quant-navigation.js');
['investment-context.js','investment-brief.js','investment-flow.js','workspace-health.js','stock-comparison.js','quant-mode.js','manual-archive.js','workspace-preferences.js','workspace-scope.js','continuity-store.js','data-status.js','drafts.js','complete-backup.js','prediction-math.js','prediction-ui.js','ticker-summary.js'].forEach(f=>files.add(f));
['advanced-math.js','advanced-worker.js','advanced-storage.js','advanced-ui.js'].forEach(f=>files.add(f));
files.add('research-history.js');
['auto-valuation-math.js','auto-valuation-ui.js','public-quote-contract.js','ticker-study.js','ticker-storage.js','ticker-ui.js','research-math.js','research-ui.js','atlas-math.js','atlas-ui.js','atlas.css','quant-math.js','quant-contract.js','quant-history.js','analysis-contract.js','quant-ui.js','office-storage.js','office-extensions.js','office-workflows.js'].forEach(f=>files.add(f));
['model-accountability.js','portfolio-performance.js','performance-ui.js','research-workspace.css','quarterly-regime.js','private-vault-client.js','private-vault-ui.js'].forEach(f=>files.add(f));
['portfolio-events.js','portfolio-reconciliation.js','prediction-review.js','data-coverage.js','data-coverage-ui.js','portfolio-close-prices.js','portfolio-prices-ui.js','data-workflows.css'].forEach(f=>files.add(f));
let local;
if(port===4174){files.add('valuation-example.json');files.add('flowless-example.json');}
['market-data-contract.js','market-data-adapters.js','market-data-research.js','market-data-worker.js','market-data-storage.js','market-data-service.js','market-data-ui.js','market-data.css'].forEach(f=>files.add(f));
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
  let url;try{if(!req.url?.startsWith('/')||req.url.startsWith('//'))throw Error('Invalid local path');url=new URL(req.url,'http://localhost');}catch{res.writeHead(400);return res.end('Invalid request path');}
  const allowedHosts=new Set([`127.0.0.1:${port}`,`localhost:${port}`]);
  if(!allowedHosts.has(req.headers.host)){res.writeHead(403);return res.end('Local host required');}
  if(await local.handle(req,res,url))return;
  if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});return res.end('Read-only server');}
  if(url.pathname.startsWith('/api/market/')){
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    const allowedOrigins=new Set([`http://127.0.0.1:${port}`,`http://localhost:${port}`]);
    if(req.headers['sec-fetch-site']==='cross-site'||req.headers.origin&&!allowedOrigins.has(req.headers.origin)){res.writeHead(403);return res.end(JSON.stringify({error:'Use the local office page for market reads.'}));}
    try{
      let value;
      if(url.pathname==='/api/market/history')value=await readMarketHistories();
      else if(url.pathname==='/api/market/macro/snapshot')value=await readMacroSnapshot();
      else if(url.pathname==='/api/market/idx-msn/symbols')value={tickers:await localMsnSymbols(),source:'Pinned IDX/MSN mapping; listing does not guarantee current data.'};
      else if(url.pathname==='/api/market/idx-msn/read')value=await readLocalMsn(url.searchParams.get('symbol'));
      else if(url.pathname==='/api/market/flowless/status')value=await readFlowlessStatus();
      else if(url.pathname==='/api/market/flowless/price')value=await readFlowlessPrice(url.searchParams.get('symbol'),url.searchParams.get('asOf'));
      else if(url.pathname==='/api/market/us/price')value=await readUsSnapshot(url.searchParams.get('symbol'));
      else if(url.pathname==='/api/market/category/price')value=await readMarketSnapshot(url.searchParams.get('category'),url.searchParams.get('symbol'));
      else{res.writeHead(404);return res.end(JSON.stringify({error:'Unknown market-data route.'}));}
      return res.end(JSON.stringify(value));
    }catch(error){if(url.pathname==='/api/market/history'){res.writeHead(502);return res.end(JSON.stringify({error:'Historical collection unavailable. No substitute observations were used.'}));}
      if(url.pathname==='/api/market/macro/snapshot'){res.writeHead(502);return res.end(JSON.stringify({error:'Macro collection unavailable. No substitute observations were used.'}));}if(url.pathname.startsWith('/api/market/idx-msn/')){res.writeHead(error.status||502);return res.end(JSON.stringify({error:error.message}));}res.writeHead(502);return res.end(JSON.stringify({error:error.name==='TimeoutError'?'Flowless read timed out. Keep its local server running on port 8000.':error.name==='TypeError'?'Flowless is unavailable. Start its existing local server on port 8000; no ingestion is triggered by Longhand Office.':error.message}));}
  }
  if(url.pathname==='/data/fx-history.json'){
    if(req.headers['sec-fetch-site']==='cross-site'||req.headers.origin&&![`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(req.headers.origin)){res.writeHead(403);return res.end('Use the local office page for market reads.');}
    try{const value=await readFxHistory();res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(JSON.stringify(value));}catch{res.writeHead(503);return res.end('Currency history unavailable.');}
  }
  // Only generated public data is readable here; workspace/vault files remain outside this allowlist.
  if(/^\/data\/(data-coverage\.json|manifest\.json|market\.json|fundamentals\.json|sec-fundamentals\.json|official-rates\.json|macro\.json|macro-context\.json|macro-releases\.json|macro-extended\.json|macro-indicators\.json|fx-history\.json|market-history\.json|history\/(US|IDX)-[A-Z]{1,6}(-[A-Z])?\.json)$/.test(url.pathname)){
    try{const body=await readFile(path.join(root,'.pages-data',url.pathname.slice(6)));res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(body);}catch{res.writeHead(404);return res.end('Public snapshot unavailable.');}
  }
  const name = url.pathname.slice(1) || 'index.html';
  if (!files.has(name)) {res.writeHead(404);return res.end('Not found');}
  try {const body=await readFile(path.join(root,name));res.writeHead(200,{'Content-Type':types[path.extname(name)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; connect-src 'self' https: http://127.0.0.1:4176 http://localhost:4176; frame-src https://s.tradingview.com https://www.tradingview-widget.com; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});res.end(body);}catch{res.writeHead(500);res.end('Unable to read app file');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Longhand Office is already running on port '+port+'. Existing records and jobs were not reopened.':error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{
 try{local=createLocalAPI(port);console.log(`Longhand Office: http://127.0.0.1:${port}`);}
 catch(error){console.error('Unable to open the local office vault: '+error.message);server.close();process.exitCode=1;}
});
