#!/usr/bin/env python3
"""Pacchetto Apache/PHP con seed sintetico separato e archivio privato. Non pubblica."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent


def php_command():
    local = ROOT / '.runtime/php'
    binary = local / 'usr/bin/php8.3'
    if binary.exists():
        args = [str(binary)]
        for name in ['mbstring', 'dom', 'zip', 'gd']:
            args += ['-d', 'extension=' + str(local / f'usr/lib/php/20230831/{name}.so')]
        return args
    return [os.environ.get('PHP_BIN', 'php')]


def prepare(url, destination, with_ai):
    parsed = urlsplit(url)
    if parsed.scheme not in ['http', 'https'] or not parsed.netloc or parsed.query or parsed.fragment or parsed.username:
        raise ValueError('URL pubblico non valido')
    base = parsed.path.rstrip('/')
    if '..' in base.split('/') or '//' in base:
        raise ValueError('Percorso pubblico non valido')
    origin = f'{parsed.scheme}://{parsed.netloc}'
    dest = destination.resolve()
    if not dest.is_relative_to(ROOT / '.deploy') or dest.exists():
        raise ValueError('Usare una nuova cartella dentro .deploy, senza sovrascrivere release')
    if not (ROOT / 'dist/index.html').is_file():
        raise ValueError('Eseguire npm run build prima della preparazione')
    dest.mkdir(parents=True, mode=0o700)
    private = dest / 'private'
    private.mkdir(mode=0o700)
    for name in ['src', 'vendor', 'resources', 'bin']:
        shutil.copytree(ROOT / 'api' / name, private / 'api' / name)
    shutil.copy2(ROOT / 'api/index.php', private / 'api/index.php')
    shutil.copy2(ROOT / 'deploy/private.htaccess', private / '.htaccess')
    for source in (ROOT / 'dist').iterdir():
        target = dest / source.name
        if source.name == 'index.html':
            target = private / 'frontend/index.html'
            target.parent.mkdir()
        if source.is_dir():
            shutil.copytree(source, target)
        else:
            shutil.copy2(source, target)
    for name in ['index.php', '.htaccess', '.user.ini']:
        shutil.copy2(ROOT / 'deploy' / name, dest / name)
    runtime = private / 'runtime'
    runtime.mkdir(mode=0o700)
    for name in ['data', 'backup']:
        (runtime / name).mkdir(mode=0o700)
    env = '\n'.join([
        'APP_ENV=demo', 'APP_ORIGIN=' + origin, 'APP_BASE_PATH=' + base,
        'APP_URL=' + origin + base, 'APP_TIMEZONE=Europe/Rome',
        'DATA_DIR=../runtime/data', 'BACKUP_DIR=../runtime/backup',
        'DATA_ENCRYPTION_KEY=' + __import__('base64').b64encode(secrets.token_bytes(32)).decode(),
        'CRON_TOKEN=' + secrets.token_hex(24), 'MESSAGING_MODE=test', '',
    ])
    demo = private / 'demo'
    demo.mkdir()
    (demo / '.env.demo').write_text(env)
    (demo / '.env.demo').chmod(0o600)
    shutil.copy2(ROOT / 'demo/prepara.php', demo / 'prepara.php')
    process_env = {k: v for k, v in os.environ.items() if k not in ['APP_URL', 'APP_ORIGIN', 'APP_BASE_PATH', 'APP_ENV_FILE', 'DATA_DIR', 'BACKUP_DIR', 'OPENAI_API_KEY']}
    lib = ROOT / '.runtime/php/usr/lib/x86_64-linux-gnu'
    if lib.exists():
        process_env['LD_LIBRARY_PATH'] = str(lib)
    subprocess.run(php_command() + [str(demo / 'prepara.php')], check=True, cwd=private, env=process_env)
    shutil.move(demo / '.env.demo', runtime / '.env')
    shutil.rmtree(demo)
    subprocess.run(php_command() + [str(ROOT / 'deploy/configure-runtime.php'), str(runtime / '.env'),
                   str(ROOT / 'demo/.env.demo') if with_ai else ''], check=True, cwd=private, env=process_env)
    for directory in (runtime / 'data').iterdir():
        if directory.is_dir() and directory.name in ['_sessions', '_ratelimit']:
            shutil.rmtree(directory)
    manifest = {p.relative_to(dest).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                for p in sorted(dest.rglob('*')) if p.is_file()}
    (dest.parent / (dest.name + '-manifest.json')).write_text(json.dumps({'url': url, 'files': manifest}, indent=2))
    print(f'Release pronta: {len(manifest)} file. Nessun dato della demo in uso copiato.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--with-local-ai', action='store_true')
    args = parser.parse_args()
    prepare(args.url.rstrip('/'), args.output, args.with_local_ai)
