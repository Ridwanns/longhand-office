"""Read exactly the complete public market-history feed from an earlier Pages artifact.
No archive paths are extracted. Source timestamps and observations stay unchanged.
"""
import json, subprocess, sys, tarfile
from pathlib import Path
archive=Path(sys.argv[1]);raw=None
with tarfile.open(archive,'r:*') as package:
    for member in package:
        if member.name.removeprefix('./')!='data/market-history.json':continue
        if raw is not None or not member.isfile() or not 0<member.size<16_000_000:raise ValueError('Invalid public history member')
        raw=package.extractfile(member).read(member.size+1)
        if len(raw)!=member.size:raise ValueError('Truncated public history')
if raw is None:raise ValueError('No long market history in prior artifact')
check="""import {readFileSync} from 'node:fs';import {validateMarketHistories} from './market-history-contract.js';const f=validateMarketHistories(JSON.parse(readFileSync(0,'utf8')));if(f.entries.some(e=>!e.quote))throw Error('Prior history is incomplete');console.log(JSON.stringify({series:f.entries.length,publishedAt:f.publishedAt}));"""
subprocess.run(['node','--input-type=module','-e',check],input=raw,check=True)
directory=Path('.pages-data');directory.mkdir(exist_ok=True)
temporary=directory/'retained-market-history.tmp';temporary.write_bytes(raw);temporary.replace(directory/'market-history.json')
