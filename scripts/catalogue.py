#!/usr/bin/env python3
"""Rigenera il catalogo reale di componenti, rotte e chiamate API dal sorgente."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def generate():
    sources = list((ROOT / 'src').rglob('*.tsx')) + list((ROOT / 'src').rglob('*.ts'))
    components = []
    for file in sorted((ROOT / 'src/components').rglob('*.tsx')):
        path = file.relative_to(ROOT).as_posix()
        alias = '@/'+file.relative_to(ROOT / 'src').with_suffix('').as_posix()
        users = [p.relative_to(ROOT).as_posix() for p in sources if p != file and alias in p.read_text()]
        kind = file.relative_to(ROOT / 'src/components').parts[0]
        components.append({'path': path, 'layer': kind,
                           'vendor': kind in ['atoms', 'primitives', 'site'],
                           'symbols': re.findall(r'export (?:default )?(?:function|const|class|type|interface) (\w+)', file.read_text()),
                           'used_by': users})
    routes = re.findall(r'<Route\s+path="([^"]+)"', (ROOT/'src/App.tsx').read_text())
    calls = []
    for file in sorted((ROOT/'src/clinic').glob('*.tsx')) + sorted((ROOT/'src/clinic').glob('*.ts')):
        for endpoint in sorted(set(re.findall(r'(?:api|download|run)(?:<[^;]*?>)?\(\s*[\"\'](/[^\"\']+)', file.read_text()))):
            calls.append({'endpoint':endpoint, 'file':file.relative_to(ROOT).as_posix()})
    data = {'components': components, 'routes': routes, 'api_calls': calls}
    (ROOT / 'docs/inventario.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
    lines = ['# Inventario del sorgente', '', 'Generato da `python3 scripts/catalogue.py`. Non sostituisce la lettura dei tipi e delle logiche.', '',
             '## Componenti', '', '| File | Livello | Esportazioni | Usato da |', '|---|---|---|---|']
    for c in components:
        label = c['path'].replace('src/components/', '')
        users = ', '.join('`'+u+'`' for u in c['used_by']) or 'Non importato direttamente'
        lines.append(f"| [{label}](../{c['path']}) | {c['layer']}{' · vendor' if c['vendor'] else ''} | {', '.join(c['symbols']) or 'default'} | {users} |")
    lines += ['', '## Rotte dichiarate', '', *['- `'+r+'`' for r in routes], '',
              '## Chiamate API', '', 'Percorsi relativi alla base configurata; payload e risultati sono tipizzati nei file indicati.', '',
              '| Endpoint | Sorgente |', '|---|---|']
    route_definitions = (ROOT / 'api/src/Http/Routes.php').read_text()
    get_paths = set(re.findall(r"\$r->add\(\s*'([^']+)'[^;]+?'GET'\s*\)", route_definitions))
    lines += [f"| {'GET' if c['endpoint'] in get_paths else 'POST'} `{c['endpoint']}` | [{c['file']}](../{c['file']}) |" for c in calls]
    (ROOT / 'docs/inventario.md').write_text('\n'.join(lines)+'\n')
    print(f"Catalogo: {len(components)} componenti, {len(routes)} rotte, {len(calls)} chiamate API")


if __name__ == '__main__':
    generate()
