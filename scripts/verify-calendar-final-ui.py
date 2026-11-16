"""Verifiche mirate della build finale, soltanto sul server QA 8082."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
import json,atexit
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'docs/specifiche-2026-11-11/browser';report={'checks':[],'errors':[]}
atexit.register(lambda:(OUT/'finale-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)))
def check(s,v=True):
 assert v,s
 report['checks'].append(s);print('PASS',s,flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);c=b.new_context(viewport={'width':1440,'height':1000},timezone_id='Europe/Rome');page=c.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
 base='http://127.0.0.1:8082'
 def go(r):page.goto(base+'/#/'+r);page.wait_for_timeout(350)
 def api(r,d={}):
  j=page.request.post(base+'/api'+r,data=d,headers={'X-CSRF-Token':page.evaluate("sessionStorage.getItem('rizzo-csrf')") or ''}).json();assert j['ok'],j;return j['data']
 go('accedi');page.get_by_label('Email',exact=True).fill('titolare@demo.it');page.get_by_label('Password',exact=True).fill('DemoPassword2026');page.get_by_role('button',name='Accedi',exact=True).click();page.get_by_role('heading',name='Panoramica',exact=True).wait_for()
 go('agenda?settimana=2026-12-07&giorno=2026-12-07&vista=Settimana');page.locator('.clinic-group').first.wait_for();page.get_by_role('button',name='A tutto schermo',exact=True).click();page.get_by_role('button',name='Esci dallo schermo intero',exact=True).wait_for();check('Schermo intero con uscita visibile');check('Tutta la settimana entra in schermo intero',page.locator('.clinic-calendar').evaluate('(el)=>el.scrollWidth<=el.clientWidth'))
 page.screenshot(path=str(OUT/'finale-fullscreen.png'));page.locator('.clinic-calendar-shell').get_by_role('button',name='Settimana corrente',exact=True).click();expect(page.locator('.clinic-today')).to_have_count(6);check('Settimana corrente accessibile anche in schermo intero');page.get_by_role('button',name='Esci dallo schermo intero',exact=True).click();check('Uscita dallo schermo intero',not page.evaluate('Boolean(document.fullscreenElement)'))
 go('agenda?settimana=2026-12-07&giorno=2026-12-07&vista=Settimana');group=page.locator('.clinic-group').first;group.wait_for();before=api('/agenda/vista',{'da':'2026-12-07','a':'2026-12-07'})['appuntamenti'];transfer=page.evaluate_handle('new DataTransfer()');group.dispatch_event('dragstart',{'dataTransfer':transfer});col=page.locator('.clinic-day-column').nth(0);box=col.bounding_box();col.dispatch_event('drop',{'dataTransfer':transfer,'clientY':box['y']+60+360});expect(page).to_have_url(__import__('re').compile('/modifica'));check('Trascinamento del gruppo apre revisione');after=api('/agenda/vista',{'da':'2026-12-07','a':'2026-12-07'})['appuntamenti'];check('Trascinamento non salva senza conferma',before==after)
 go('impostazioni?scheda=Calendar');page.get_by_role('button',name='Profilo applicato',exact=True).wait_for();check('Parametri inutilizzati non esposti',page.get_by_text('Mostra domenica',exact=True).count()==0);page.screenshot(path=str(OUT/'finale-calendar-settings.png'),full_page=True)
 for w,theme in [(1440,'light'),(1440,'dark'),(390,'light'),(390,'dark')]:
  go('agenda?settimana=2026-12-07&giorno=2026-12-07&vista='+('Settimana' if w==1440 else 'Giorno'));page.set_viewport_size({'width':w,'height':1000 if w==1440 else 844});page.evaluate('(dark)=>document.documentElement.classList.toggle("dark",dark)',theme=='dark');page.evaluate('document.querySelectorAll("*").forEach(el=>{if(el.scrollTop)el.scrollTop=0})');page.wait_for_timeout(100);check('Build finale senza overflow '+str(w)+' '+theme,not page.evaluate('document.documentElement.scrollWidth>innerWidth'));page.screenshot(path=str(OUT/('finale-agenda-'+str(w)+'-'+theme+'.png')))
 check('Nessuna eccezione JavaScript nella build finale',not report['errors']);b.close()
