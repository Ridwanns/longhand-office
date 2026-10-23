"""Check installed package versions against PyPI's public vulnerability metadata.

Run in the project data venv. No application records, environment secrets or
brokerage accounts are read. Unavailable metadata fails the audit explicitly.
"""
import concurrent.futures
import datetime
import importlib.metadata
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request


def check_package(package):
    name, version = package
    url = 'https://pypi.org/pypi/' + urllib.parse.quote(name, safe='') + '/' + urllib.parse.quote(version, safe='') + '/json'
    try:
        with urllib.request.urlopen(url, timeout=25) as response:
            payload = response.read(5_000_001)
        if len(payload) > 5_000_000:
            raise ValueError('Advisory response exceeds limit')
        data = json.loads(payload)
        normalize = lambda value: re.sub(r'[-_.]+', '-', value).lower()
        if normalize(data['info']['name']) != normalize(name) or data['info']['version'] != version or not isinstance(data.get('vulnerabilities'), list):
            raise ValueError('Unexpected package identity or missing advisory metadata')
        advisories = {}
        for item in data['vulnerabilities']:
            if item.get('withdrawn'):
                continue
            ids = [item['id'], *item.get('aliases', [])]
            identity = next((x for x in ids if x.startswith('GHSA-')), item['id'])
            advisories[identity] = {'id': identity, 'aliases': sorted(set(ids)), 'fixedIn': item.get('fixed_in', []), 'url': item.get('link')}
        return {'name': name, 'version': version, 'advisories': list(advisories.values())}
    except Exception as error:
        return {'name': name, 'version': version, 'error': str(error)}


def main():
    packages = sorted({(d.metadata['Name'], d.version) for d in importlib.metadata.distributions() if d.metadata.get('Name')})
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        checks = list(pool.map(check_package, packages))
    findings = [p for p in checks if p.get('advisories')]
    unavailable = [p for p in checks if p.get('error')]
    report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'source': 'https://pypi.org/', 'python': sys.version.split()[0], 'packages': checks, 'findings': findings, 'unavailable': unavailable}
    destination = pathlib.Path('validation/security-dependencies.json')
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({'checked': len(checks), 'findings': findings, 'unavailable': unavailable}))
    return 1 if findings or unavailable else 0


if __name__ == '__main__':
    raise SystemExit(main())
