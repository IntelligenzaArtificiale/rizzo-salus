#!/usr/bin/env python3
"""Crea template autonomo della skill e pacchetto finale con checksum."""
import argparse
import hashlib
import os
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent.parent
BASE_SKIP = {'node_modules', '.git', '.tokensave', '__pycache__', '.venv', '.deploy', 'backups', '.codex-attachments', '.DS_Store'}


def files(template=False):
    skip = BASE_SKIP | ({'.agents', 'dist'} if template else set())
    for current, directories, names in os.walk(ROOT):
        directories[:] = sorted(d for d in directories if d not in skip)
        for name in sorted(names):
            path = Path(current)/name
            if path.is_symlink():
                raise ValueError(f'File non portabile: {path}')
            if name in {'.DS_Store','SHA256SUMS.txt'} or path.suffix in {'.pyc','.tsbuildinfo'}:
                continue
            if name == '.env' or (name.startswith('.env.') and not name.endswith('.example')):
                raise ValueError(f'File privato nel pacchetto: {path}')
            if name.endswith(('-wal','-shm')):
                raise ValueError('Chiudere i processi TokenSave prima di creare lo ZIP')
            yield path


def archive(output, template=False):
    output.parent.mkdir(parents=True, exist_ok=True)
    entries = list(files(template))
    temporary = output.with_name(output.name+'.tmp')
    hashes = []
    with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED) as target:
        for path in entries:
            name = path.relative_to(ROOT).as_posix()
            data = path.read_bytes()
            target.writestr(name, data)
            hashes.append(hashlib.sha256(data).hexdigest()+'  '+name)
        target.writestr('SHA256SUMS.txt','\n'.join(hashes)+'\n')
    with zipfile.ZipFile(temporary) as check:
        if check.testzip():
            raise ValueError('Archivio corrotto')
    temporary.replace(output)
    output.with_suffix(output.suffix+'.sha256').write_text(hashlib.sha256(output.read_bytes()).hexdigest()+'  '+output.name+'\n')
    print(f'{output}: {len(entries)} file, {output.stat().st_size:,} byte')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--template-only', action='store_true')
    parser.add_argument('--out',type=Path)
    args = parser.parse_args()
    template = ROOT/'.agents/skills/piattaforma-boilerplate/assets/boilerplate-source.zip'
    archive(template, template=True)
    if not args.template_only:
        archive(args.out or ROOT.parent/'dist/boilerplate-piattaforma.zip')
