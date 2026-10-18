"""Read-only reconciliation using Python csv/JSON, independent of Node projections."""
import csv
import io
import json
import hashlib
import subprocess
import urllib.request
import concurrent.futures
import calendar
import datetime
import argparse
from pathlib import Path

registry = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {EXTENDED_SERIES} from './macro-extended-contract.js';process.stdout.write(JSON.stringify(EXTENDED_SERIES))"
]).decode('utf8'))
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--snapshot', default='.pages-data/macro-extended.json', help='Local public snapshot to reconcile')
args = parser.parse_args()
feed = json.loads(Path(args.snapshot).read_text(encoding='utf8'))
review = json.loads(Path('sources/macro-extended-reviewed.json').read_text(encoding='utf8'))
sources = {}
urls = sorted({s['url'] for s in registry.values() if s['provider'] != 'reviewed'})

def acquire(url):
    accept = 'application/vnd.sdmx.data+csv;version=1.0.0' if 'stats.bis.org' in url else 'application/json,text/csv'
    request = urllib.request.Request(url, headers={'Accept': accept})
    with urllib.request.urlopen(request, timeout=35) as response:
        data = response.read(15000001)
    if len(data) > 15000000:
        raise ValueError('Source exceeds audit limit')
    text = data.decode('utf8')
    parsed = json.loads(text) if 'ec.europa.eu' in url else list(csv.DictReader(io.StringIO(text, newline='')))
    return url, (hashlib.sha256(text.encode()).hexdigest(), parsed)

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    for url, source in executor.map(acquire, urls):
        sources[url] = source

def number(value):
    return None if value is None or str(value) in ['', '.', 'NaN'] else float(value)

checks, failures = [], []
for item in feed['series']:
    spec = registry[item['id']]
    try:
        expected = []
        if spec['provider'] == 'reviewed':
            entry = next(r for r in review['series'] if r['id'] == item['id'])
            assert item['retrievedAt'] == entry.get('reviewedAt', review['reviewedAt'])
            expected = [(o['date'], o['value']) for o in entry['observations']]
            assert item['sourceHash'] == hashlib.sha256(Path('sources/macro-extended-reviewed.json').read_bytes()).hexdigest()
        else:
            digest, raw = sources[spec['url']]
            assert item['sourceHash'] == digest, 'Acquired source response changed; recollect before reconciliation'
            if spec['provider'].startswith('bis'):
                expected = [(r['TIME_PERIOD'] + ('-01' if spec['frequency'] == 'M' else ''), number(r['OBS_VALUE']))
                            for r in raw if r['REF_AREA'] == spec['area'] and r['FREQ'] == spec['frequency']]
                selected = [r for r in raw if r['REF_AREA'] == spec['area'] and r['FREQ'] == spec['frequency']]
                assert all(r['UNIT_MEASURE'] == ('771' if spec['metric'] == 'inflation' else '368')
                           and r['UNIT_MULT'] == '0' and r['OBS_CONF'] == 'F' for r in selected)
            elif spec['provider'].startswith('euro'):
                dimensions = raw['id']
                area = raw['dimension']['geo']['category']['index'][spec['area']]
                for month, offset in raw['dimension']['time']['category']['index'].items():
                    positions = {'freq': 0, 'int_rt': 0, 'maturity': 0, 'geo': area, 'time': offset}
                    flat, stride = 0, 1
                    for dim, size in reversed(list(zip(dimensions, raw['size']))):
                        flat += positions[dim] * stride
                        stride *= size
                    expected.append((month + '-01', number(raw.get('value', {}).get(str(flat)))))
            else:
                assert raw and list(raw[0]) == ['observation_date', spec['code']]
                expected = [(r['observation_date'], number(r[spec['code']])) for r in raw]
        cutoff = item['retrievedAt'][:10]
        def completed(date):
            if spec['frequency'] == 'D':
                return date <= cutoff
            year, month = int(date[:4]), int(date[5:7])
            if spec['frequency'] == 'Q':
                month += 2
            return datetime.date(year, month, calendar.monthrange(year, month)[1]).isoformat() <= cutoff
        expected = sorted((d, v) for d, v in expected if d >= '2000-01-01' and completed(d))
        assert not item.get('error'), item.get('error')
        assert len(expected) == len(item['observations']), 'Observation count differs'
        for (date, value), actual in zip(expected, item['observations']):
            assert date == actual['date'], 'Period differs'
            assert (value is None and actual['value'] is None) or (
                value is not None and actual['value'] is not None
                and abs(value - actual['value']) <= 1e-10 * max(1, abs(value))), date
        checks.append({'id': item['id'], 'observations': len(expected)})
    except Exception as exc:
        failures.append({'id': item['id'], 'error': str(exc)})

report = {'snapshot': feed['generatedAt'], 'series': len(checks),
          'observations': sum(c['observations'] for c in checks), 'checks': checks, 'failures': failures}
Path('validation').mkdir(exist_ok=True)
Path('validation/macro-extended-source-audit.json').write_text(json.dumps(report, indent=2), encoding='utf8')
print(json.dumps({k: v for k, v in report.items() if k != 'checks'}))
raise SystemExit(bool(failures))
