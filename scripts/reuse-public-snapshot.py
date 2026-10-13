"""Read only normalized public JSON from a previously verified Pages artifact.

Source publication/retrieval timestamps remain unchanged. No scripts, private
records, databases, credentials or browser backups are extracted or uploaded.
"""
import argparse
import json
import re
import tarfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
allowed = re.compile(r'data/(?:manifest\.json|market\.json|fundamentals\.json|history/(?:US|IDX)-[A-Z]{1,6}(?:-[A-Z])?\.json)')

def retained_snapshot(archive):
    files = {}
    total = 0
    with tarfile.open(archive, 'r:*') as package:
        for member in package:
            name = member.name[2:] if member.name.startswith('./') else member.name
            if not allowed.fullmatch(name):
                continue
            if not member.isfile() or name in files or not 0 < member.size <= 12_000_000:
                raise ValueError('Invalid or duplicate normalized public file in artifact')
            total += member.size
            if total > 500_000_000 or len(files) >= 6000:
                raise ValueError('Public snapshot exceeds 500 MB or 6000 files')
            data = package.extractfile(member).read(member.size + 1)
            if len(data) != member.size:
                raise ValueError('Incomplete public artifact')
            files[name[5:]] = data
    manifest = json.loads(files['manifest.json'])
    market = json.loads(files['market.json'])
    fundamentals = json.loads(files['fundamentals.json'])
    if (manifest.get('format') != 'longhand-public-market-data' or manifest.get('version') != 1
            or not manifest.get('publishedAt') or market.get('publishedAt') != manifest['publishedAt']
            or fundamentals.get('format') != 'longhand-public-fundamentals'
            or fundamentals.get('version') != 1 or not fundamentals.get('records')):
        raise ValueError('Incompatible or inconsistent public snapshot')
    histories = manifest.get('histories')
    if not isinstance(histories, list) or not 1 <= len(histories) <= 5000:
        raise ValueError('Invalid public history directory')
    needed = {'manifest.json', 'market.json', 'fundamentals.json'}
    for entry in histories:
        file = entry.get('file', '')
        if not allowed.fullmatch('data/' + file) or not file.startswith('history/') or file not in files:
            raise ValueError('Missing or unsafe referenced public history')
        payload = json.loads(files[file])
        meta = payload.get('metadata', {})
        if any(meta.get(k) != entry.get(k) for k in ('ticker', 'market', 'currency', 'retrievedAt')):
            raise ValueError('Public history identity/vintage mismatch')
        needed.add(file)
    return {name: files[name] for name in needed}, manifest

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    args = parser.parse_args()
    files, manifest = retained_snapshot(args.archive)
    destination = (root / '.pages-data').resolve()
    for name, data in files.items():
        target = (destination / name).resolve()
        if not target.is_relative_to(destination):
            raise ValueError('Target must stay inside generated public snapshot directory')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    print(json.dumps(dict(histories=len(manifest['histories']), publishedAt=manifest['publishedAt'],
                          policy='Reused previously verified public data; dates and prices unchanged.')))
