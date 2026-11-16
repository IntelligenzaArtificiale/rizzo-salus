#!/usr/bin/env python3
"""Verifica browser del boilerplate demo, senza invii email o accessi esterni."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SNAPSHOTS = ['/admin', '/richieste', '/richieste/nuova', '/profilo', '/admin/impostazioni', '/assistente', '/accedi']


def check(base, output):
    output.mkdir(parents=True, exist_ok=True)
    report = {'base_url': base, 'screens': [], 'checks': [], 'page_errors': [], 'console_errors': []}
    routes = json.loads((ROOT / 'docs/inventario.json').read_text())['routes']
    mapping = {':token': 'valido', ':slug': 'come-gestire-una-richiesta', ':id': '1'}
    with sync_playwright() as engine:
        browser = engine.chromium.launch(headless=True)
        for theme, width, height in [('light', 1440, 1000), ('dark', 1440, 1000), ('light', 390, 844), ('dark', 390, 844)]:
            context = browser.new_context(viewport={'width': width, 'height': height}, color_scheme=theme)
            context.add_init_script("sessionStorage.setItem('sessione',JSON.stringify({id:'1',name:'Giulia Ferraro',email:'admin@demo.it',role:'admin'}));localStorage.setItem('bui-theme','"+theme+"')")
            page = context.new_page()
            page.on('pageerror', lambda error: report['page_errors'].append(str(error)))
            page.on('console', lambda msg: report['console_errors'].append(msg.text) if msg.type == 'error' else None)
            for route in SNAPSHOTS:
                page.goto(base+'#'+route)
                page.wait_for_timeout(1100)
                assert page.locator('body').inner_text().strip(), route
                assert page.get_by_role('button', name='Cerca nella piattaforma').count() == (1 if route == '/admin' else 0), route
                overflow = page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
                assert not overflow, f'Overflow {route} {width}'
                slug = route.strip('/').replace('/', '-') or 'home'
                filename = f'{slug}-{theme}-{width}.png'
                page.screenshot(path=str(output/filename), full_page=True)
                report['screens'].append({'route': route, 'theme': theme, 'width': width, 'file': filename})
            page.goto(base+'#/admin')
            page.get_by_role('button', name='Cerca nella piattaforma').wait_for()
            page.keyboard.press('Control+k')
            field = page.get_by_role('textbox', name='Cerca pagine e richieste')
            field.wait_for()
            assert field.evaluate('(e)=>e===document.activeElement')
            field.fill('R-1042')
            page.get_by_role('button', name='R-1042 · Fornitura adesivo per piastrelle', exact=True).wait_for()
            page.keyboard.press('ArrowDown')
            page.keyboard.press('Enter')
            page.wait_for_url('**#/richieste/R-1042')
            page.get_by_role('button', name='Cerca nella piattaforma').wait_for(state='detached')
            page.goto(base+'#/admin')
            trigger = page.get_by_role('button', name='Cerca nella piattaforma')
            trigger.click()
            page.keyboard.press('Escape')
            assert page.get_by_role('dialog').count() == 0
            assert trigger.evaluate('(e)=>e===document.activeElement')
            trigger.click()
            page.get_by_role('textbox', name='Cerca pagine e richieste').fill('inesistente')
            page.get_by_text('Nessun risultato', exact=True).wait_for()
            page.screenshot(path=str(output/f'ricerca-{theme}-{width}.png'), full_page=True)
            page.mouse.click(width-20, height-15)
            assert page.get_by_role('dialog').count() == 0
            report['checks'].append(f'{theme}/{width}: search scoped, autofocus, arrows, Enter, Escape, restore focus, empty, outside click, no page overflow')
            context.close()
        # Smoke di tutte le route dichiarate, con parametri dimostrativi.
        page = browser.new_page(viewport={'width':1440,'height':1000})
        page.add_init_script("sessionStorage.setItem('sessione',JSON.stringify({id:'1',name:'Giulia Ferraro',email:'admin@demo.it',role:'admin'}))")
        page.on('pageerror', lambda error: report['page_errors'].append(str(error)))
        for route in routes:
            if route == '*': route = '/non-esiste'
            for key, value in mapping.items(): route = route.replace(key, value)
            if route.startswith('/richieste/') and '/nuova' not in route: route = route.replace('/1', '/R-1042')
            page.goto(base+'#'+route)
            page.wait_for_timeout(850)
            assert page.locator('body').inner_text().strip(), route
        report['checks'].append(f'{len(routes)} declared routes: nonempty render, no uncaught JS exception; sample IDs may show documented not-found states')
        page.evaluate("sessionStorage.setItem('sessione',JSON.stringify({id:'2',name:'Marco',email:'utente@demo.it',role:'utente'}))")
        page.goto(base+'#/admin/impostazioni')
        page.wait_for_url('**#/accesso-negato')
        report['checks'].append('Client role guard: user cannot open admin settings (backend enforcement remains required)')
        browser.close()
    report['passed'] = not report['page_errors']
    (output/'ui-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    assert report['passed'], report['page_errors']
    print(f"PASS: {len(report['screens'])} screenshots + 4 search states; {len(report['checks'])} check groups")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:5173/')
    parser.add_argument('--out', type=Path, default=ROOT/'docs/verifica')
    args = parser.parse_args()
    check(args.url.rstrip('/')+'/', args.out)
