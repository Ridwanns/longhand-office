"""Retain only reviewed public JSON for a later source-vintage comparison.
No archive paths are extracted. No browser records or code are read or copied.
"""
import importlib.util,json,sys,tarfile
from pathlib import Path

def capture(archive,destination):
    spec=importlib.util.spec_from_file_location('public_snapshot',Path(__file__).with_name('reuse-public-snapshot.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    files,manifest=module.retained_snapshot(Path(archive))
    with tarfile.open(archive,'r:*') as package:
        for member in package:
            if member.name.removeprefix('./')!='data/market-history.json':continue
            if not member.isfile() or not 0<member.size<16_000_000 or 'market-history.json' in files:raise ValueError('Invalid long-history baseline')
            raw=package.extractfile(member).read(member.size+1)
            if len(raw)!=member.size:raise ValueError('Truncated long-history baseline')
            data=json.loads(raw)
            if data.get('format')!='longhand-market-histories' or data.get('version')!=1:raise ValueError('Unexpected long-history baseline format')
            files['market-history.json']=raw
    root=Path(destination).resolve();root.mkdir(parents=True,exist_ok=True)
    for name,raw in files.items():
        target=(root/name).resolve()
        if not target.is_relative_to(root):raise ValueError('Unsafe baseline target')
        target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
    print(json.dumps({'baselineAt':manifest['publishedAt'],'histories':len(manifest['histories']),'policy':'Public observations retained unchanged; no model result or private record included.'}))

if __name__=='__main__':capture(sys.argv[1],sys.argv[2] if len(sys.argv)>2 else '.tools/source-baseline')
