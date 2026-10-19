"""Independent Decimal/calendar audit of all published automatic valuations and chart windows.

JavaScript exports application outputs; Python calculates expected answers from the
retained inputs, without importing application formulas. No private records read.
This verifies arithmetic, not the correctness of provider financial statements.
"""
import calendar
import datetime as dt
from decimal import Decimal as D, localcontext
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'validation'
OUT.mkdir(exist_ok=True)
js = """
import {readFileSync} from 'node:fs';
import {autoValuation} from './auto-valuation-math.js';
import {historyWindow} from './market-history-contract.js';
const load=n=>JSON.parse(readFileSync('.pages-data/'+n+'.json','utf8'));
const market=load('market'), funds=load('fundamentals'), long=load('market-history');
const asOf=Date.now(), valuations=[];
for(const f of funds.records){const q=market.quotes[(f.market==='IDX'?'idx:':'us:')+f.ticker]?.quote;
 if(q)valuations.push({id:f.market+':'+f.ticker,result:autoValuation(f,q,undefined,asOf)});}
const windows=[];
for(const e of long.entries){if(!e.quote)continue;for(const r of ['1M','3M','6M','1Y','3Y','5Y','10Y','20Y','ALL'])for(const f of ['daily','weekly','monthly'])windows.push({id:e.category+':'+e.symbol,range:r,frequency:f,rows:historyWindow(e.quote.history,r,f)});}
console.log(JSON.stringify({asOf,valuations,windows}));
"""
actual = json.loads(subprocess.run(['node', '--input-type=module', '-e', js], cwd=ROOT,
                    capture_output=True, text=True, check=True, timeout=180).stdout)
load = lambda n: json.loads((ROOT / '.pages-data' / (n + '.json')).read_text(encoding='utf8'))
market, fundamentals, histories = load('market'), load('fundamentals'), load('market-history')
funds = {f['market']+':'+f['ticker']: f for f in fundamentals['records']}
series = {e['category']+':'+e['symbol']: e['quote']['history'] for e in histories['entries'] if e.get('quote')}
failures, checks = [], 0

def verify(ok, label):
    global checks
    checks += 1
    if not ok:
        failures.append(label)

def near(expected, value, label):
    if expected is None or value is None:
        verify(expected is None and value is None, label)
    else:
        expected, value = D(str(expected)), D(str(value))
        verify(abs(expected-value) <= D('1e-9') * max(D(1), abs(expected)), label)

quote_changes = 0
for identity, packet in market['quotes'].items():
    q = packet.get('quote')
    if not q:
        continue
    price = D(str(q['price']))
    prior = [h for h in q['history'] if h['date'] < q['marketDate']]
    change = q.get('change')
    if prior:
        reference = D(str(prior[-1]['close']))
        verify(reference > 0 or change is None, identity+' nonpositive reference withheld')
        if reference > 0:
            verify(change is not None, identity+' missing usable change')
            if change:
                verify(change['referenceDate'] == prior[-1]['date'], identity+' previous session')
                near(reference, change['referenceClose'], identity+' reference price')
    elif change:
        reference = D(str(change['referenceClose']))
        verify(reference > 0 and change['referenceKind'] == 'provider-previous-close', identity+' provider reference')
    if change:
        reference = D(str(change['referenceClose']))
        near(price-reference, change['value'], identity+' absolute change')
        near((price/reference-D(1))*100, change['percent'], identity+' percent change')
        quote_changes += 1

dcfs = 0
with localcontext() as ctx:
    ctx.prec = 42
    for v in actual['valuations']:
        f, result = funds[v['id']], v['result']
        p, s = D(str(result['price'])), {k:D(str(x)) for k,x in result['settings'].items()}
        n = int(s['years'])
        compatible = f['financialCurrency'] == f['currency']
        eps = D(str(f['epsTtm'])) if compatible and f['epsTtm'] is not None and f['epsTtm'] > 0 else None
        pe = p/eps if eps is not None else None
        near(pe, result['currentPe'], v['id']+' PE')
        near(eps/p if eps is not None else None, result['earningsYield'], v['id']+' earnings yield')
        book = f['bookValue']
        near(p/D(str(book)) if compatible and book is not None and book > 0 else None, result['priceToBook'], v['id']+' PB')
        cash = None
        c = f.get('cashflow')
        if c:
            raw = sum(D(str(c[k])) for k in ['cfo','capex','netBorrowing']) / D(str(c['dilutedAverageShares']))
            age = (actual['asOf']/1000-dt.datetime.fromisoformat(c['periodEnd']).replace(tzinfo=dt.timezone.utc).timestamp())/86400
            if raw > 0 and age <= 550:
                cash = raw
                dcfs += 1
        near(cash, result['baseFcfePerShare'], v['id']+' FCFE/share')
        for direction, row in zip([-1,0,1], result['rows']):
            label = v['id']+' '+row['name']
            growth = direction*s['growthSpread']
            exit_pe = pe*(1+direction*s['peSpread']) if pe is not None else None
            terminal_eps = eps*(1+growth)**n if eps is not None else None
            target = terminal_eps*exit_pe if terminal_eps is not None else None
            entry = target/(1+s['requiredReturn'])**n if target is not None else None
            cagr = (target/p)**(D(1)/n)-1 if target is not None else None
            cost = s['requiredReturn']-direction*s['discountSpread']
            for key, expected in [('epsGrowth',growth),('fcfeGrowth',growth),('exitPe',exit_pe),('terminalEps',terminal_eps),('terminalPrice',target),('discountedEntry',entry),('priceCagr',cagr),('costOfEquity',cost)]:
                near(expected,row[key],label+' '+key)
            forecast = terminal = total = share = None
            if cash is not None:
                forecast = sum(cash*(1+growth)**t/(1+cost)**t for t in range(1,n+1))
                terminal = cash*(1+growth)**n*(1+s['terminalGrowth'])/(cost-s['terminalGrowth'])/(1+cost)**n
                total = forecast+terminal
                share = terminal/total
            for key, expected in [('pvForecast',forecast),('pvTerminal',terminal),('dcf',total),('terminalShare',share)]:
                near(expected,row[key],label+' '+key)

for window in actual['windows']:
    rows, range_ = series[window['id']], window['range']
    last = dt.date.fromisoformat(rows[-1]['date'])
    if range_ == 'ALL':
        start = rows[0]['date']
    else:
        count = int(range_[:-1])
        index = last.year*12+last.month-1 - (count if range_.endswith('M') else count*12)
        year, month = divmod(index,12)
        month += 1
        start = dt.date(year,month,min(last.day,calendar.monthrange(year,month)[1])).isoformat()
    selected = [r for r in rows if r['date'] >= start]
    if window['frequency'] != 'daily':
        buckets = {}
        for row in selected:
            date = dt.date.fromisoformat(row['date'])
            key = (date-dt.timedelta(days=date.weekday())).isoformat() if window['frequency']=='weekly' else row['date'][:7]
            buckets[key] = row
        selected = list(buckets.values())
    verify(selected == window['rows'], window['id']+' '+range_+' '+window['frequency']+' actual dates/closes')

report = {'auditedAt':dt.datetime.now(dt.timezone.utc).isoformat(), 'checks':checks,
          'quoteChanges':quote_changes,'pricedValuations':len(actual['valuations']),
          'fcfeValuations':dcfs,'chartWindows':len(actual['windows']),
          'failures':failures,'tolerance':'1e-9 relative or absolute; Decimal precision 42 for valuations',
          'scope':'All published priced automatic valuations at default settings; retained daily changes; all 51 market chart windows. Provider input truth, unpriced records, future outcomes, and every manual setting are not certified.'}
(OUT/'independent-finance-audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report))
raise SystemExit(bool(failures))
