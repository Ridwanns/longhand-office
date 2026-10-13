"""Read-only independent check. Never invokes ingest, transform, or schema creation."""
import argparse, json
from pathlib import Path
import duckdb
parser=argparse.ArgumentParser()
parser.add_argument('--database',required=True)
parser.add_argument('--symbol',default='BBCA')
parser.add_argument('--as-of',required=True)
args=parser.parse_args()
database=Path(args.database)
before=database.stat()
connection=duckdb.connect(str(database),read_only=True)
try:
    row=connection.execute('SELECT trade_date, close, volume FROM fact_daily WHERE ticker=? AND trade_date<=? ORDER BY trade_date DESC LIMIT 1',[args.symbol,args.as_of]).fetchone()
    print(json.dumps({'symbol':args.symbol,'row':None if row is None else {'date':row[0].isoformat(),'close':row[1],'volume':row[2]},'read_only':True,'file_metadata_unchanged':before.st_size==database.stat().st_size and before.st_mtime_ns==database.stat().st_mtime_ns}))
finally:
    connection.close()
