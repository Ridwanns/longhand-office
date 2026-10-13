import sqlite3, json, os
from pathlib import Path
root = Path(os.environ['LOCALAPPDATA']) / 'LonghandOffice'
def rows(path, table):
    con = sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True)
    value = con.execute('SELECT * FROM ' + table + ' ORDER BY 1').fetchall()
    con.close()
    return value
before = root / 'vault-backups/audit-20261013-153036/data/office.sqlite'
after = root / 'data/office.sqlite'
checks = []
for table in ['workspaces', 'backups']:
    old, new = rows(before, table), rows(after, table)
    assert old == new, 'Production ' + table + ' changed during audit'
    checks.append({'name': 'Production ' + table + ' unchanged byte-for-byte per SQL row', 'passed': True, 'rows': len(new)})
Path('validation/audit-preservation-results.json').write_text(json.dumps({'checks': checks}, indent=2), encoding='utf8')
print(json.dumps({'checks': checks}))
