#!/usr/bin/env python3
"""Pubblica solo nel confine FTP configurato: backup, runtime conservato, ingresso per ultimo."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from ftplib import FTP, FTP_TLS, error_perm
import hashlib
import json
from pathlib import Path, PurePosixPath
import secrets
import ssl

ROOT = Path(__file__).resolve().parent.parent


def configuration(file):
    values = {}
    for line in file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ['"', "'"]:
            value = value[1:-1]
        values[key.strip()] = value
    remote = PurePosixPath(values['REMOTE_PATH'])
    if not remote.is_absolute() or '..' in remote.parts or str(remote) == '/':
        raise ValueError('Confine remoto dedicato mancante o non valido')
    values['REMOTE_PATH'] = str(remote)
    return values


def connect(cfg):
    protocol = cfg['TRANSFER_PROTOCOL']
    if protocol not in ['ftp', 'ftps']:
        raise ValueError('Questo rilascio richiede FTP/FTPS')
    client = FTP_TLS(context=ssl.create_default_context()) if protocol == 'ftps' else FTP()
    client.connect(cfg['TRANSFER_HOST'], int(cfg['TRANSFER_PORT']), timeout=45)
    client.login(cfg['TRANSFER_USERNAME'], cfg['TRANSFER_PASSWORD'])
    if protocol == 'ftps':
        client.prot_p()
    client.cwd(cfg['REMOTE_PATH'])
    if client.pwd().rstrip('/') != cfg['REMOTE_PATH']:
        client.close()
        raise ValueError('Directory remota effettiva diversa dal confine autorizzato')
    return client


def inventory(client, directory='', result=None):
    result = {} if result is None else result
    for name, facts in client.mlsd(directory or '.'):
        kind = facts.get('type', '')
        if kind in ['cdir', 'pdir']:
            continue
        if '/' in name or name in ['.', '..'] or kind not in ['dir', 'file']:
            raise ValueError('Risorsa remota non regolare: collegamenti non seguiti')
        path = (PurePosixPath(directory) / name).as_posix()
        result[path] = facts
        if kind == 'dir':
            inventory(client, path, result)
    return result


def backup(client, entries):
    folder = ROOT / '.deploy/backup' / datetime.now().strftime('%Y%m%d-%H%M%S')
    folder.mkdir(parents=True, mode=0o700)
    hashes = {}
    for name, facts in entries.items():
        if facts['type'] != 'file':
            continue
        file = folder / 'files' / name
        file.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        with file.open('wb') as stream:
            client.retrbinary('RETR ' + name, stream.write)
        file.chmod(0o600)
        hashes[name] = hashlib.sha256(file.read_bytes()).hexdigest()
    (folder / 'manifest.json').write_text(json.dumps({'remote_path': client.pwd(), 'files': hashes}, indent=2))
    return folder


def put(client, source, relative):
    if '..' in PurePosixPath(relative).parts or relative.startswith('/') or source.is_symlink():
        raise ValueError('File fuori dal pacchetto consentito')
    with source.open('rb') as stream:
        client.storbinary('STOR ' + relative, stream, blocksize=65536)


def upload(config_file):
    cfg = configuration(config_file)
    release = (ROOT / cfg['LOCAL_BUILD_PATH']).resolve()
    if not release.is_relative_to(ROOT / '.deploy') or not (release / 'index.php').is_file():
        raise ValueError('Pacchetto locale non valido')
    preflight = json.loads((ROOT / '.deploy/preflight.json').read_text())
    if not preflight.get('mapping_verificato') or not preflight.get('cartella_privata_negata'):
        raise ValueError('Verificare destinazione HTTP e protezione del privato prima della pubblicazione')
    client = connect(cfg)
    entries = inventory(client)
    saved = backup(client, entries)
    preserve_runtime = 'private/runtime/.env' in entries
    files = [p for p in sorted(release.rglob('*')) if p.is_file()]
    if any(p.is_symlink() for p in release.rglob('*')):
        raise ValueError('Il pacchetto non ammette collegamenti simbolici')
    directories = sorted([p.relative_to(release).as_posix() for p in release.rglob('*') if p.is_dir()], key=lambda x: (x.count('/'), x))
    for name in directories:
        if name in entries:
            if entries[name]['type'] != 'dir':
                raise ValueError('Directory richiesta occupata da un file')
        else:
            client.mkd(name)
    code = [p for p in files if not p.relative_to(release).as_posix().startswith('private/runtime/') and p.name != 'index.php']
    # L'index API privato fa parte del codice; soltanto l'ingresso pubblico è atomico.
    code += [p for p in files if p.name == 'index.php' and p.parent != release and not p.relative_to(release).as_posix().startswith('private/runtime/')]
    groups = [code[i::4] for i in range(4)]

    def transfer(group):
        worker = connect(cfg)
        try:
            for file in group:
                put(worker, file, file.relative_to(release).as_posix())
        finally:
            worker.quit()
        return len(group)

    with ThreadPoolExecutor(max_workers=4) as pool:
        for count in pool.map(transfer, groups):
            print('Caricati file applicativi:', count, flush=True)
    if not preserve_runtime:
        runtime = [p for p in files if p.relative_to(release).as_posix().startswith('private/runtime/')]
        runtime.sort(key=lambda p: p.name == '.env')
        for file in runtime:
            name = file.relative_to(release).as_posix()
            put(client, file, name)
            client.sendcmd('SITE CHMOD 600 ' + name)
    temporary = '.release-' + secrets.token_hex(8) + '.php'
    put(client, release / 'index.php', temporary)
    client.rename(temporary, 'index.php')
    client.quit()
    result = {'url': cfg['APP_URL'], 'remote_path': cfg['REMOTE_PATH'], 'backup_locale': str(saved.relative_to(ROOT)),
              'runtime_precedente_conservato': preserve_runtime, 'file_pacchetto': len(files), 'ingresso_pubblicato': True}
    (ROOT / '.deploy/pubblicazione.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))


def rollback(config_file, folder):
    cfg = configuration(config_file)
    folder = folder.resolve()
    if not folder.is_relative_to(ROOT / '.deploy/backup'):
        raise ValueError('Backup fuori dal progetto')
    saved = json.loads((folder / 'manifest.json').read_text())
    if saved['remote_path'] != cfg['REMOTE_PATH']:
        raise ValueError('Backup relativo a un’altra destinazione')
    client = connect(cfg)
    # Lo stato runtime non si riavvolge: potrebbe contenere nuovi dati dei tester.
    for name, digest in saved['files'].items():
        if name.startswith('private/runtime/'):
            continue
        file = folder / 'files' / name
        if hashlib.sha256(file.read_bytes()).hexdigest() != digest:
            raise ValueError('Backup alterato')
        put(client, file, name)
    if 'index.php' not in saved['files']:
        import io
        client.storbinary('STOR index.php', io.BytesIO(b'<?php http_response_code(503); echo "Demo in manutenzione";'))
    client.quit()
    print('Ripristinati file precedenti; runtime conservato. Nessuna cancellazione remota.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=ROOT / '.deploy/deploy.env')
    parser.add_argument('--rollback', type=Path)
    args = parser.parse_args()
    if args.rollback:
        rollback(args.config, args.rollback)
    else:
        upload(args.config)
