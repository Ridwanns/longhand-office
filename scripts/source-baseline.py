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
        formats={'market-history.json':'longhand-market-histories','macro.json':'longhand-macro','macro-context.json':'longhand-macro-context','macro-releases.json':'longhand-macro-releases','macro-extended.json':'longhand-macro-extended'}
        for member in package:
            name=member.name.removeprefix('./')
            if name not in {'data/'+key for key in formats}:continue
            name=name[5:]
            if not member.isfile() or not 0<member.size<16_000_000 or name in files:raise ValueError('Invalid public baseline')
            raw=package.extractfile(member).read(member.size+1)
            if len(raw)!=member.size:raise ValueError('Truncated long-history baseline')
            data=json.loads(raw)
            if data.get('format')!=formats[name] or data.get('version')!=1:raise ValueError('Unexpected public baseline format')
            files[name]=raw
    root=Path(destination).resolve();root.mkdir(parents=True,exist_ok=True)
    for name,raw in files.items():
        target=(root/name).resolve()
        if not target.is_relative_to(root):raise ValueError('Unsafe baseline target')
        target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
    print(json.dumps({'baselineAt':manifest['publishedAt'],'histories':len(manifest['histories']),'policy':'Public observations retained unchanged; no model result or private record included.'}))

if __name__=='__main__':capture(sys.argv[1],sys.argv[2] if len(sys.argv)>2 else '.tools/source-baseline')
