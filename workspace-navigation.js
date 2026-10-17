// Presentation metadata only. Routes, record identifiers and financial engines are unchanged.
export const WORKSPACES=[
 {id:'overview',label:'Overview',route:'#overview',icon:'office'},
 {id:'markets',label:'Markets',route:'#market/us',icon:'market'},
 {id:'research',label:'Research Lab',route:'#quant',icon:'quant'},
 {id:'portfolio',label:'Portfolio',route:'#portfolios',icon:'portfolio'}
];
export const WORKSPACE_PAGES=[
 {id:'overview',group:'Overview',label:'Daily workspace',route:'#overview',icon:'office',aliases:'overview dashboard summary recent research completeness courtyard office'},
 {id:'us',group:'Markets',label:'US stocks & ETFs',route:'#market/us',icon:'market',aliases:'US stocks America prices watchlist markets'},
 {id:'idx',group:'Markets',label:'Indonesia',route:'#market/idx',icon:'market',aliases:'IDX Indonesian stocks saham MSN Flowless'},
 {id:'macro',group:'Markets',label:'Macro monitor',route:'#market/macro',icon:'macro',aliases:'macro GDP CPI inflation economy indices index'},
 {id:'bonds',group:'Markets',label:'Bonds',route:'#market/bonds',icon:'bonds',aliases:'treasury yields fixed income ETF'},
 {id:'commodities',group:'Markets',label:'Commodities',route:'#market/commodities',icon:'commodity',aliases:'gold silver oil futures'},
 {id:'instrument',group:'Research Lab',label:'Instrument research',route:'#quant/section/ticker',icon:'quant',section:'ticker',aliases:'ticker analyse analyze company research'},
 {id:'quant',group:'Research Lab',label:'Quant Lab',route:'#quant',icon:'quant',aliases:'quant models quantitative simulation Monte Carlo risk'},
 {id:'valuation',group:'Research Lab',label:'Company valuation',route:'#quant/section/valuation',icon:'thesis',section:'valuation',aliases:'valuation intrinsic earnings DCF FCFE assumptions'},
 {id:'theses',group:'Research Lab',label:'Investment theses',route:'#theses',icon:'thesis',aliases:'thesis theses argument evidence research'},
 {id:'library',group:'Research Lab',label:'Research Library',route:'#library',icon:'library',aliases:'reports published library research'},
 {id:'saved',group:'Research Lab',label:'Saved studies',route:'#quant/section/models',icon:'records',section:'models',aliases:'saved studies archive analyses core history'},
 {id:'tools',group:'Research Lab',label:'Advanced tools',route:'#quant/section/research',icon:'quant',section:'research',aliases:'advanced tools options Greeks implied volatility bond calculator portfolio risk'},
 {id:'paper',group:'Portfolio',label:'Paper portfolios',route:'#portfolios',icon:'portfolio',aliases:'paper portfolio portfolios simulation holdings positions transactions'},
 {id:'real',group:'Portfolio',label:'Real portfolios',route:'#portfolios/real',icon:'real',aliases:'real actual investment portfolio holdings positions transactions'},
 {id:'decisions',group:'Portfolio',label:'Decision journal',route:'#decisions',icon:'journal',aliases:'decision journal reasoning'},
 {id:'reviews',group:'Portfolio',label:'Investment reviews',route:'#decisions',icon:'journal',target:'.review-queue',aliases:'review reviews outcome due monitor'},
 {id:'records',group:'Workspace',label:'Records & Backups',route:'#records',icon:'records',aliases:'records backup backups export import restore encrypted storage vault'},
 {id:'data-sources',group:'Workspace',label:'Data Sources',route:'#data-sources',icon:'library',aliases:'data sources provider providers Pluang Yahoo Flowless SEC import CSV quality provenance'},
 {id:'sources',group:'Workspace',label:'Source information',route:'#market/macro/id/sources',icon:'library',aliases:'source sources provenance data freshness'},
 {id:'forecasts',group:'Research Lab',label:'Registered forecasts',route:'#quant/section/predictions',icon:'quant',section:'predictions',finderOnly:true,aliases:'forecast forecasts prediction predictions outcomes'},
 {id:'manual',group:'Research Lab',label:'Saved manual studies',route:'#quant/section/manual',icon:'records',section:'manual',finderOnly:true,aliases:'saved manual calculator toolkit archive'},
 {id:'advanced',group:'Research Lab',label:'Advanced model archive',route:'#quant/section/advanced',icon:'records',section:'advanced',finderOnly:true,aliases:'advanced saved model archive'},
 {id:'valuations',group:'Research Lab',label:'Saved company valuations',route:'#quant/section/valuations',icon:'records',section:'valuations',finderOnly:true,aliases:'saved valuation valuations archive'},
 {id:'tickers',group:'Research Lab',label:'Saved ticker studies',route:'#quant/section/tickers',icon:'records',section:'tickers',finderOnly:true,aliases:'saved ticker studies archive'},
 {id:'calculators',group:'Research Lab',label:'Decision calculators',route:'#quant/section/calculator',icon:'quant',section:'calculator',finderOnly:true,aliases:'calculator manual stress budget fees'},
 {id:'reference',group:'Research Lab',label:'Atlas reference studies',route:'#quant/section/reference',icon:'library',section:'reference',finderOnly:true,aliases:'Atlas historical reference studies'},
 {id:'appearance',group:'Preferences',label:'Appearance · light / dark',route:null,action:'appearance',icon:'office',aliases:'preferences theme dark light appearance'},
 {id:'detail',group:'Preferences',label:'Study view · Simple / Advanced',route:'#quant/section/ticker',section:'ticker',target:'.desk-mode',icon:'quant',aliases:'preferences simple advanced detail study view'},
 {id:'watchlists',group:'Preferences',label:'US watchlist preferences',route:'#market/us',target:'#watchlist-form',icon:'market',aliases:'preferences watchlist stocks list'}
];
export const sectionDestination=route=>WORKSPACE_PAGES.find(p=>p.section&&p.route==='#'+route);
export function navigationState(route='overview',portfolioMode=null){
 const exact=WORKSPACE_PAGES.find(p=>p.route==='#'+route)||WORKSPACE_PAGES.find(p=>p.id==='data-sources'&&route.startsWith('data-sources/'));
 const page=exact||WORKSPACE_PAGES.find(p=>p.id===(route.startsWith('portfolio/')?(portfolioMode==='real'?'real':'paper'):route.startsWith('theses/')?'theses':route.startsWith('decisions/')?'decisions':route.startsWith('quant')?'quant':route.startsWith('market/')?route.split('/')[1]==='macro'?'macro':route.split('/')[1]:route==='market'?'us':'overview'))||WORKSPACE_PAGES[0];
 const workspace=WORKSPACES.find(w=>w.label===page.group)||(route.startsWith('market/')?WORKSPACES.find(w=>w.id==='markets'):null);
 return {page,workspace};
}
export function findDestinations(query=''){
 const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return WORKSPACE_PAGES.filter(p=>words.every(w=>(p.label+' '+p.aliases).toLowerCase().includes(w)));
}
