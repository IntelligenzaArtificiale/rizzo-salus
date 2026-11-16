#!/usr/bin/env python3
"""Serve la stessa build da root/due sottocartelle/due host e verifica config runtime."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import shutil
import tempfile
import threading
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def check(output):
    assert (ROOT/'dist/index.html').exists(), 'Eseguire prima npm run build'
    settings = {'features': {key: True for key in ['registrazione','assistente','dettatura','letturaVoce','blog','notifiche','upload','ricerca','temaScuro']},
                'roles': {}, 'brand': {'nome':'Cliente trasferito','logo':'','colore':'#1f5fd6','email':'support@example.com','telefono':'','indirizzo':''},
                'seo': {'titolo':'%s · Cliente trasferito','descrizione':'','immagine':'','indicizza':False}}
    report = []
    with tempfile.TemporaryDirectory(prefix='bp-portability-') as tmp:
        root = Path(tmp)
        shutil.copytree(ROOT/'dist', root, dirs_exist_ok=True)
        for directory in ['prima', 'seconda']:
            shutil.copytree(ROOT/'dist',root/directory)
        for directory in [root, root/'prima', root/'seconda']:
            (directory/'app-config.js').write_text('window.__APP_CONFIG__ = '+json.dumps({'apiBaseUrl':'./api','supportEmail':'support@example.com'})+';\n')
        server = ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=tmp))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        try:
            with sync_playwright() as engine:
                browser = engine.chromium.launch(headless=True)
                for host, directory in [('127.0.0.1',''),('127.0.0.1','prima/'),('127.0.0.1','seconda/'),('localhost','seconda/')]:
                    context = browser.new_context(viewport={'width':1280,'height':900})
                    page = context.new_page()
                    errors = []; requests = []
                    page.on('pageerror',lambda e:errors.append(str(e)))
                    def reply(route):
                        requests.append(urlparse(route.request.url).path)
                        route.fulfill(json={'ok':True,'data':settings})
                    page.route('**/api/impostazioni/leggi', reply)
                    url=f'http://{host}:{server.server_port}/{directory}'
                    page.goto(url+'#/accedi')
                    page.get_by_role('textbox',name='Email',exact=True).wait_for()
                    page.get_by_text('Cliente trasferito',exact=True).first.wait_for()
                    assert requests == ['/'+directory+'api/impostazioni/leggi'],requests
                    assert not errors,errors
                    assert page.locator('script[src="./app-config.js"]').count()==1
                    assert page.locator('link[rel="stylesheet"]').count()>0
                    report.append({'url':url,'api_path':requests[0],'runtime_override':True,'login_rendered':True,'errors':errors})
                    context.close()
                browser.close()
        finally:
            server.shutdown();server.server_close()
    output.write_text(json.dumps({'passed':True,'checks':report},indent=2)+'\n')
    print('PASS: stesso bundle a root, prima/, seconda/ e altro host; base API relativa e override runtime verificati')


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,default=ROOT/'docs/verifica/portability-report.json')
    check(parser.parse_args().out)
