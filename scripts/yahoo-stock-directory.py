"""Publish public Yahoo screener responses through yfinance; no Office records read."""
import json, time, re
from datetime import datetime, timezone
from pathlib import Path
import yfinance as yf

output=Path('.pages-data');output.mkdir(exist_ok=True)
yf.set_tz_cache_location(str(Path('.tools/yfinance-cache').resolve()))
markets={'US':['NMS','NYQ','ASE','NGM','NCM','PCX','BTS'],'IDX':['JKT']}
result={'format':'longhand-yahoo-screener','version':1,'provider':'yfinance '+yf.__version__,'markets':{}}
for market,exchanges in markets.items():
    query=yf.EquityQuery('is-in',['exchange',*exchanges]) if len(exchanges)>1 else yf.EquityQuery('eq',['exchange',exchanges[0]])
    entries={};offset=0;pages=0;expected=None
    while expected is None or offset<expected:
        response=yf.screen(query,offset=offset,size=250,sortField='ticker',sortAsc=True)
        if not isinstance(response,dict) or not isinstance(response.get('quotes'),list): raise RuntimeError('Invalid Yahoo screener response for '+market)
        if expected is None: expected=response.get('total')
        if not isinstance(expected,int) or not 0<expected<=20000: raise RuntimeError('Invalid screener total')
        rows=response['quotes'];received=datetime.now(timezone.utc).isoformat()
        if not rows: raise RuntimeError('Empty page before the reported screener total')
        for q in rows:
            if isinstance(q,dict) and isinstance(q.get('symbol'),str): entries[q['symbol']]={'quote':q,'retrievedAt':received}
        offset+=len(rows);pages+=1;time.sleep(.2)
    result['markets'][market]={'reportedTotal':expected,'retrievedUnique':len(entries),'pages':pages,'entries':list(entries.values()),'query':query.to_dict()}
    print(json.dumps({'market':market,'reportedTotal':expected,'unique':len(entries),'pages':pages}),flush=True)
result['retrievedAt']=datetime.now(timezone.utc).isoformat()
(output/'screener.json').write_text(json.dumps(result,allow_nan=False,separators=(',',':')),encoding='utf8')
