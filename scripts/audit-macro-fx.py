"""Independent Python standard-library reconciliation of base macro and FX sources.
Reviewed BPS records are compared with the retained review file, not called live.
"""
import csv, datetime as dt, io, json, math, ssl, subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
load=lambda n:json.loads((ROOT/'.pages-data'/n).read_text(encoding='utf8'))
macro, fx = load('macro.json'), load('fx-history.json')
reviewed=json.loads((ROOT/'sources/macro-indonesia-reviewed.json').read_text(encoding='utf8'))
checks,failures=[],[]
def get(url):
    try:
        with urlopen(Request(url,headers={'User-Agent':'LonghandOffice-independent-audit/1.0'}),timeout=30) as r:
            return r.read().decode('utf-8-sig')
    except Exception as e:
        if 'CERTIFICATE_VERIFY_FAILED' not in str(e):raise
        # Node uses this host's working certificate store; TLS remains verified.
        result=subprocess.run(['node','--input-type=module','-e',
            "const r=await fetch(process.argv[1],{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);process.stdout.write(await r.text());",url],
            capture_output=True,text=True,encoding='utf8',check=True,timeout=35)
        return result.stdout
urls={s['sourceUrl'] for s in macro['series'] if s['acquisition']!='reviewed-release'}|{s['sourceUrl'] for s in fx['entries'] if not s.get('error')}
def fetch(url):
    try:return url,get(url)
    except Exception as e:return url,e
with ThreadPoolExecutor(max_workers=4) as pool:
    sources=dict(pool.map(fetch,urls))
def same(a,b):return a is None and b is None or a is not None and b is not None and math.isclose(a,b,rel_tol=1e-9,abs_tol=1e-9)
for stored in macro['series']:
    try:
        if stored.get('error'):raise ValueError(stored['error'])
        identity=stored['id'];raw=sources.get(stored['sourceUrl']);expected={}
        if stored['acquisition']=='reviewed-release':
            expected={o['period']:o['value'] for s in reviewed['series'] if s['id']==identity for o in s['observations']}
            assert stored['retrievedAt']==reviewed['reviewedAt'],'review date was relabeled'
        else:
            if isinstance(raw,Exception):raise raw
            if identity.startswith('annual-'):
                _,country,metric=identity.split('-');code='NY.GDP.MKTP.KD.ZG' if metric=='gdp' else 'FP.CPI.TOTL.ZG'
                body=json.loads(raw);assert body[0]['pages']==1
                expected={o['date']:o['value'] for o in body[1] if o['countryiso3code']==country and o['indicator']['id']==code}
            elif identity.startswith('us-'):
                rows=list(csv.DictReader(io.StringIO(raw)));code='GDPC1' if identity=='us-gdp' else 'CPIAUCSL'
                levels={o['observation_date']:None if o[code] in ['.',''] else float(o[code]) for o in rows}
                for date,value in levels.items():
                    previous=levels.get(str(int(date[:4])-1)+date[4:])
                    period=date[:4]+'-Q'+str((int(date[5:7])-1)//3+1) if identity=='us-gdp' else date[:7]
                    expected[period]=100*(value/previous-1) if value is not None and previous is not None and previous>0 else None
            elif identity=='eu-gdp':
                body=json.loads(raw)
                assert list(body['dimension']['unit']['category']['index'])==['CLV_PCH_SM']
                assert list(body['dimension']['s_adj']['category']['index'])==['SCA']
                expected={p:body['value'].get(str(i)) for p,i in body['dimension']['time']['category']['index'].items()}
            elif identity=='eu-cpi':
                for row in csv.DictReader(io.StringIO(raw)):
                    assert row['KEY']=='HICP.M.U2.N.000000.4D0.ANR' and row['UNIT']=='PCCH'
                    expected[row['TIME_PERIOD']]=None if row['OBS_STATUS']=='M' or row['OBS_VALUE']=='' else float(row['OBS_VALUE'])
            else:raise ValueError('Unexpected macro identity')
        for o in stored['observations']:
            assert o['period'] in expected and same(o['value'],expected[o['period']]),identity+' '+o['period']
        checks.append({'id':identity,'observations':len(stored['observations']),'verification':'retained reviewed BPS file; separate official web check required' if stored['acquisition']=='reviewed-release' else 'independent current institution source'})
    except Exception as e:failures.append({'id':stored['id'],'error':str(e)})
for stored in fx['entries']:
    try:
        raw=sources[stored['sourceUrl']]
        if isinstance(raw,Exception):raise raw
        result=json.loads(raw)['chart']['result'][0];meta=result['meta']
        assert meta['symbol']==stored['symbol'] and meta['currency']==stored['currency'] and meta['instrumentType']=='CURRENCY'
        zone=ZoneInfo(meta['exchangeTimezoneName']);expected={}
        for stamp,value in zip(result['timestamp'],result['indicators']['quote'][0]['close']):
            date=dt.datetime.fromtimestamp(stamp,zone).date().isoformat()
            assert date not in expected,'Duplicate provider date'
            expected[date]=value
        for row in stored['observations']:
            assert row['date'] in expected and same(row['value'],expected[row['date']]),stored['id']+' '+row['date']
        checks.append({'id':stored['id'],'observations':len(stored['observations']),'verification':'independent current provider source; retained dates only'})
    except Exception as e:failures.append({'id':stored['id'],'error':str(e)})
report={'auditedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'checks':checks,'failures':failures,'observations':sum(c['observations'] for c in checks),'scope':'All retained base macro/FX observations; BPS review file reconciliation is explicitly distinct from live source verification.'}
(ROOT/'validation/macro-fx-independent-audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps({**report,'checks':len(checks)}))
raise SystemExit(bool(failures))
