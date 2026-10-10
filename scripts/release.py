"""Create deterministic, unsigned preview ZIPs using only Python's standard library."""
import hashlib
import json
from pathlib import Path
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent.parent
VERSION = json.loads((ROOT / 'package.json').read_text())['version']
if not re.fullmatch(r'\d+\.\d+\.\d+', VERSION):
    raise ValueError('Expected a numeric WebExtension version')
TAG = json.loads((ROOT / 'package.json').read_text())['previewTag']
if not re.fullmatch(rf'v{re.escape(VERSION)}-preview\.[1-9]\d*', TAG):
    raise ValueError('previewTag must match the numeric package version')
FILES = sorted(['LICENSE', 'content.js', 'manifest.json', 'popup.css', 'popup.html',
                'popup.js', 'privacy.html', 'src/settings.js', 'src/time.js',
                *[f'icons/icon-{size}.png' for size in [16, 32, 48, 128]]])
OUTPUT = ROOT / 'dist' / 'release'
if OUTPUT.exists():
    shutil.rmtree(OUTPUT)
OUTPUT.mkdir(parents=True, exist_ok=True)
checksums = []
for target in ['chromium', 'firefox']:
    source = ROOT / 'dist' / target
    actual = sorted(str(path.relative_to(source)) for path in source.rglob('*') if path.is_file())
    if actual != FILES or any(path.is_symlink() for path in source.rglob('*')):
        raise ValueError(f'{target}: unexpected package files')
    name = f'chatgpt-timekeeper-{TAG}-{target}.zip'
    archive = OUTPUT / name
    # Fixed timestamps, permissions, ordering and stored bytes avoid host/zlib variation.
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_STORED) as bundle:
        for filename in FILES:
            entry = zipfile.ZipInfo(filename, date_time=(1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            bundle.writestr(entry, (source / filename).read_bytes())
    with zipfile.ZipFile(archive) as bundle:
        if bundle.testzip() is not None or bundle.namelist() != FILES:
            raise ValueError(f'{name}: archive validation failed')
        for filename in FILES:
            if bundle.read(filename) != (source / filename).read_bytes():
                raise ValueError(f'{name}: archive content differs')
    checksums.append(f'{hashlib.sha256(archive.read_bytes()).hexdigest()}  {name}\n')
    print(f'Prepared dist/release/{name} (unsigned preview)')
(OUTPUT / 'SHA256SUMS').write_text(''.join(checksums), encoding='utf-8')
