export const MARKET_CATEGORIES={
 us:{label:'US',title:'US stocks & ETFs',description:'Look up US stocks and ETFs by ticker.',source:'Yahoo Finance · regular-session snapshots · real-time unverified.',examples:['AAPL','MSFT','NVDA','BRK-B']},
 idx:{label:'Indonesia',title:'Indonesian stocks',description:'IDX stocks from your local Flowless data.',source:'Local Flowless · daily closing prices (EOD).',examples:['BBCA','BBRI','TLKM','ASII']},
 bonds:{label:'Bonds',title:'Bond ETFs · separate from Treasury yields',description:'Exchange-traded funds holding bonds. These are fund share prices, not individual bonds or government yields.',source:'ETF prices per share in USD. Official US Treasury par yields appear above. Individual bond prices and Indonesian government bond yields are not connected.',instruments:[
  {symbol:'TLT',name:'iShares 20+ Year Treasury Bond ETF',type:'ETF',currency:'USD',unit:'USD / ETF share'},
  {symbol:'IEF',name:'iShares 7–10 Year Treasury Bond ETF',type:'ETF',currency:'USD',unit:'USD / ETF share'},
  {symbol:'LQD',name:'iShares iBoxx $ Investment Grade Corporate Bond ETF',type:'ETF',currency:'USD',unit:'USD / ETF share'}]},
 commodities:{label:'Commodities',title:'Commodities',description:'Futures quotes from Yahoo, with explicit units and source times.',source:'Futures quotes, not spot prices. Contract series may roll; real-time is unverified.',instruments:[
  {symbol:'GC=F',name:'Gold · futures',type:'FUTURE',currency:'USD',unit:'USD / troy ounce'},
  {symbol:'SI=F',name:'Silver · futures',type:'FUTURE',currency:'USD',unit:'USD / troy ounce'},
  {symbol:'CL=F',name:'WTI crude oil · futures',type:'FUTURE',currency:'USD',unit:'USD / barrel'}]},
 macro:{label:'Macro and indices',title:'Global index context',description:'Major index levels from separate market snapshots.',source:'Index levels in points, not macroeconomic growth rates. Each quote has its own timestamp. These global instruments do not represent a complete regional market or capital-flow feed.',instruments:[
  {symbol:'^GSPC',name:'S&P 500',type:'INDEX',currency:'USD',unit:'index points'},
  {symbol:'^IXIC',name:'Nasdaq Composite',type:'INDEX',currency:'USD',unit:'index points'},
  {symbol:'^DJI',name:'Dow Jones Industrial Average',type:'INDEX',currency:'USD',unit:'index points'},
  {symbol:'^JKSE',name:'IHSG / IDX Composite',type:'INDEX',currency:'IDR',unit:'index points'},
  {symbol:'^VIX',name:'CBOE VIX',type:'INDEX',currency:'USD',unit:'index points'}]}
};
