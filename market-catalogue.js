export const MARKET_CATEGORIES={
 us:{label:'US',title:'US stocks & ETFs',description:'Look up US stocks and ETFs by ticker.',source:'Yahoo Finance · regular-session snapshots · real-time unverified.',examples:['AAPL','MSFT','NVDA','BRK-B']},
 idx:{label:'Indonesia',title:'Indonesian stocks',description:'IDX stocks from your local Flowless data.',source:'Local Flowless · daily closing prices (EOD).',examples:['BBCA','BBRI','TLKM','ASII']},
 bonds:{label:'Bonds',title:'Bonds',description:'US bond ETFs for an initial fixed-income view.',source:'ETF prices per share in USD. Official US Treasury par yields appear below. Individual bond prices and Indonesian government bond yields are not connected.',instruments:[
  {symbol:'TLT',name:'US Treasury 20+ years · ETF',type:'ETF',currency:'USD',unit:'USD / ETF share'},
  {symbol:'IEF',name:'US Treasury 7–10 years · ETF',type:'ETF',currency:'USD',unit:'USD / ETF share'},
  {symbol:'LQD',name:'Investment-grade corporate bonds · ETF',type:'ETF',currency:'USD',unit:'USD / ETF share'}]},
 commodities:{label:'Commodities',title:'Commodities',description:'Futures quotes from Yahoo, with explicit units and source times.',source:'Futures quotes, not spot prices. Contract series may roll; real-time is unverified.',instruments:[
  {symbol:'GC=F',name:'Gold · futures',type:'FUTURE',currency:'USD',unit:'USD / troy ounce'},
  {symbol:'SI=F',name:'Silver · futures',type:'FUTURE',currency:'USD',unit:'USD / troy ounce'},
  {symbol:'CL=F',name:'WTI crude oil · futures',type:'FUTURE',currency:'USD',unit:'USD / barrel'}]},
 macro:{label:'Macro / Indices',title:'Macro & indices',description:'Major index levels and official macroeconomic releases.',source:'Index levels in points. US Treasury par yields are published below; other numerical macro releases are not connected.',instruments:[
  {symbol:'^GSPC',name:'S&P 500',type:'INDEX',currency:'USD',unit:'index points'},
  {symbol:'^IXIC',name:'Nasdaq Composite',type:'INDEX',currency:'USD',unit:'index points'},
  {symbol:'^DJI',name:'Dow Jones Industrial Average',type:'INDEX',currency:'USD',unit:'index points'},
  {symbol:'^JKSE',name:'IHSG / IDX Composite',type:'INDEX',currency:'IDR',unit:'index points'},
  {symbol:'^VIX',name:'CBOE VIX',type:'INDEX',currency:'USD',unit:'index points'}]}
};
