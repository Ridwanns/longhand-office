"""Build interface-only releases from a prior successful Pages artifact.
Only explicitly named public JSON is read; no archive member is extracted.
Original source timestamps, hashes and observations are preserved byte-for-byte.
"""
import importlib.util,json,sys,tarfile
from pathlib import Path

FORMATS={
    'market-history.json':'longhand-market-histories',
    'official-rates.json':'longhand-official-rates','fx-history.json':'longhand-fx-history',
    'macro.json':'longhand-macro','macro-context.json':'longhand-macro-context',
    'macro-releases.json':'longhand-macro-releases','macro-extended.json':'longhand-macro-extended',
    'macro-indicators.json':'longhand-macro-indicators','sec-fundamentals.json':'longhand-sec-annual-facts',
    'source-integrity.json':'longhand-source-integrity','idx-primary.json':'longhand-idx-primary-evidence',
    'native-prices.json':'longhand-native-prices'
}

def reuse_interface(archive,destination):
    spec=importlib.util.spec_from_file_location('public_snapshot',Path(__file__).with_name('reuse-public-snapshot.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    files,manifest=module.retained_snapshot(Path(archive));total=sum(map(len,files.values()))
    with tarfile.open(archive,'r:*') as package:
        for member in package:
            name=member.name.removeprefix('./')
            if name not in {'data/'+key for key in FORMATS}:continue
            name=name[5:]
            if not member.isfile() or not 0<member.size<16_000_000 or name in files:raise ValueError('Invalid or duplicate interface source file')
            total+=member.size
            if total>500_000_000:raise ValueError('Public interface snapshot exceeds its size limit')
            raw=package.extractfile(member).read(member.size+1)
            if len(raw)!=member.size:raise ValueError('Truncated public interface source')
            data=json.loads(raw)
            if data.get('format')!=FORMATS[name] or data.get('version')!=1:raise ValueError('Unexpected interface source format')
            files[name]=raw
    missing=set(FORMATS)-{'native-prices.json'}-files.keys()
    if missing:raise ValueError('Verified public artifact is incomplete: '+', '.join(sorted(missing)))
    root=Path(destination).resolve();root.mkdir(parents=True,exist_ok=True)
    for name,raw in files.items():
        target=(root/name).resolve()
        if not target.is_relative_to(root):raise ValueError('Unsafe interface output path')
        target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
    result={'sourcePublishedAt':manifest['publishedAt'],'histories':len(manifest['histories']),'files':len(files),'policy':'Interface-only release. Exact prior verified public bytes; no source reacquisition or refreshed source dates.'}
    print(json.dumps(result));return result

if __name__=='__main__':reuse_interface(sys.argv[1],sys.argv[2] if len(sys.argv)>2 else '.pages-data')
