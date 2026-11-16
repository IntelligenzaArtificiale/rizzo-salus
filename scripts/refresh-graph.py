#!/usr/bin/env python3
"""Inizializza/sincronizza il grafo locale del progetto senza hook o dati privati."""
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
SKIP = ['node_modules', 'dist', '.agents', '.deploy', 'backups', '.git', '.runtime', 'vendor', 'dati', 'backup']
EXCLUDE = ['**/node_modules/**', '**/dist/**', '**/.agents/**', '**/.deploy/**',
           '**/backups/**', '**/*.zip', '**/*.png', '**/*.jpg', '**/.env', '**/.env.*',
           '**/SHA256SUMS.txt', '**/.runtime/**', '**/vendor/**', '**/demo/dati/**', '**/demo/backup/**', '**/chiave-openai.txt', '**/docs/redesign/originale-sha256.json']


def refresh():
    config = ROOT/'.tokensave/config.json'
    if not config.exists():
        subprocess.run(['tokensave', 'init', str(ROOT), '--no-git-hook', '--skip-folder', *SKIP], check=True)
    data = json.loads(config.read_text())
    # Consente di riprendere il DB dopo aver estratto il pacchetto in un nuovo path.
    data['root_dir'] = str(ROOT)
    data['exclude'] = list(dict.fromkeys(data.get('exclude', []) + EXCLUDE))
    config.write_text(json.dumps(data, indent=2)+'\n')
    subprocess.run(['tokensave', 'sync', str(ROOT), '--skip-folder', *SKIP], check=True)
    subprocess.run(['tokensave', 'status', '--json', str(ROOT)], check=True)


if __name__ == '__main__':
    refresh()
