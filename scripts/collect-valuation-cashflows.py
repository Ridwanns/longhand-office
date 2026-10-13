"""Read public Yahoo statements only. No Office files, credentials or Stockbit login."""
import argparse,json,math,os,re
from datetime import datetime,timezone
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import yfinance as yf

DEFAULTS={'US':['AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','AVGO','XOM','WMT','COST','JNJ','ORCL','AMD','CRM','ADBE','NFLX','QCOM','KO','PEP','PG','HD','CAT','PLTR'],
          'IDX':['BBCA','BBRI','BMRI','TLKM','ASII','UNTR','ICBP','INDF','ANTM','ADRO']}
def finite(v):
    try:return float(v) if math.isfinite(float(v)) else None
    except (TypeError,ValueError):return None
def cell(frame,key,period):return finite(frame.loc[key,period]) if key in frame.index and period in frame.columns else None
def project_cashflow(cash,income,period,currency):
    values={key:cell(cash,key,period) for key in ['OperatingCashFlow','CapitalExpenditure','NetIssuancePaymentsOfDebt']}
    shares=cell(income,'DilutedAverageShares',period)
    if any(v is None for v in values.values()) or shares is None or shares<=0:raise ValueError('Same-period CFO, signed capex, net debt issuance and diluted average shares are required.')
    if values['CapitalExpenditure']>0:raise ValueError('Capex sign is ambiguous; positive outflow fields cannot become FCFE automatically.')
    return {'periodEnd':str(period.date()),'frequency':'annual','currency':currency,'cfo':values['OperatingCashFlow'],'capex':values['CapitalExpenditure'],'netBorrowing':values['NetIssuancePaymentsOfDebt'],'dilutedAverageShares':shares,'definition':'Annual CFO + signed capex + net issuance/payments of debt; per diluted average quoted share. Not CFO minus capex alone.'}
def collect(market,ticker,entry):
    received=lambda:datetime.now(timezone.utc).isoformat()
    result={'market':market,'ticker':ticker,'retrievedAt':received(),'cashflow':None,'error':None}
    q=entry.get('quote',{})
    try:
        currency='USD' if market=='US' else 'IDR'
        if q.get('currency')!=currency or q.get('financialCurrency')!=currency:raise ValueError('Reporting and listing currencies differ or are undeclared. No automatic FX conversion.')
        source=q['symbol'];obj=yf.Ticker(source);info=obj.get_info()
        if info.get('symbol')!=source or info.get('currency')!=currency or info.get('financialCurrency')!=currency:raise ValueError('Statement metadata does not confirm the quoted instrument and reporting currency.')
        if not info.get('sector'):raise ValueError('Sector unavailable; financial-company FCFE suitability cannot be verified.')
        if info['sector']=='Financial Services':raise ValueError('Generic CFO-based FCFE is not used for banks or other financial companies.')
        cash=obj.get_cashflow();income=obj.get_income_stmt()
        periods=sorted(set(cash.columns)&set(income.columns),reverse=True)
        if not periods:raise ValueError('No matching annual cash-flow and income-statement periods.')
        # Never silently use an older financial year when the latest common year is incomplete.
        packet=project_cashflow(cash,income,periods[0],currency)
        if packet['periodEnd']>received()[:10]:raise ValueError('Future statement period rejected.')
        result['cashflow']={**packet,'sector':info['sector'],'provider':'Yahoo via yfinance '+yf.__version__,'sourceSymbol':source}
    except ValueError as exc:result['error']=str(exc)[:400]
    except Exception as exc:result['error']='Public Yahoo statement request failed ('+type(exc).__name__+'). No replacement cash flow was supplied.'
    result['retrievedAt']=received();print(json.dumps({'market':market,'ticker':ticker,'available':result['cashflow'] is not None}),flush=True);return result
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--tickers',default='');args=parser.parse_args()
    root=Path('.pages-data');directory=json.loads((root/'screener.json').read_text(encoding='utf8'));yf.set_tz_cache_location(str(Path('.tools/yfinance-cache').resolve()))
    requested=args.tickers.split(',') if args.tickers else [m+':'+t for m,ts in DEFAULTS.items() for t in ts]
    if not args.tickers:
        for market in ['US','IDX']:
            for raw in re.split(r'[,\s]+',os.environ.get('OFFICE_'+market+'_TICKERS','')):
                ticker=raw.strip().upper().removesuffix('.JK') if market=='IDX' else raw.strip().upper().replace('.','-')
                if ticker and re.fullmatch(r'[A-Z]{1,6}(?:-[A-Z])?',ticker):requested.append(market+':'+ticker)
    requested=list(dict.fromkeys(requested))
    tasks=[]
    for token in requested[:40]:
        market,ticker=token.split(':');source=ticker+('.JK' if market=='IDX' else '')
        found=next((e for e in directory['markets'][market]['entries'] if e['quote'].get('symbol')==source),None)
        if found:tasks.append((market,ticker,found))
    with ThreadPoolExecutor(max_workers=2) as workers:results=list(workers.map(lambda x:collect(*x),tasks))
    (root/'cashflows.json').write_text(json.dumps({'format':'longhand-public-cashflows','version':1,'retrievedAt':datetime.now(timezone.utc).isoformat(),'records':results},allow_nan=False,separators=(',',':')),encoding='utf8')
if __name__=='__main__':main()
