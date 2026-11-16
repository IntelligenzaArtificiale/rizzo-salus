"""Collaudo della revisione UX: richiede il server QA isolato su porta 8082."""
from pathlib import Path
import json,re,atexit
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'docs/redesign/revisione-ux';BASE='http://127.0.0.1:8082';report={'checks':[],'page_errors':[],'console_errors':[],'screenshots':[]};OUT.mkdir(exist_ok=True)
atexit.register(lambda:(OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)))
def check(label,condition=True):
 if not condition:raise AssertionError(label)
 report['checks'].append(label);print('OK',label,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},locale='it-IT',timezone_id='Europe/Rome',reduced_motion='reduce');page=context.new_page()
 def listen(pg):
  pg.on('pageerror',lambda e:report['page_errors'].append(str(e)))
  pg.on('console',lambda m:report['console_errors'].append(m.text) if m.type=='error' and ('key' in m.text or 'nested' in m.text or 'cannot' in m.text.lower()) else None)
 listen(page)
 def go(route):page.goto(BASE+'/#/'+route);page.wait_for_timeout(250)
 def api(path,body=None,ok=True):
  csrf=page.evaluate("sessionStorage.getItem('rizzo-csrf')");response=page.request.post(BASE+'/api'+path,data=body or {},headers={'X-CSRF-Token':csrf or ''});j=response.json()
  if ok and not j.get('ok'):raise AssertionError(path+': '+str(j))
  return j.get('data') if ok else j
 def login(email):
  go('accedi');page.get_by_label('Email',exact=True).fill(email);page.get_by_label('Password',exact=True).fill('DemoPassword2026');page.get_by_role('button',name='Accedi',exact=True).click();page.get_by_role('heading',name='Panoramica',exact=True).wait_for()
 def screen(name):
  for width in [1440,768,390]:
   page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
   for theme in ['light','dark']:
    page.evaluate('(t)=>document.documentElement.classList.toggle("dark",t==="dark")',theme);page.wait_for_timeout(60);check(name+f' {width} {theme}: nessun overflow',not page.evaluate('document.documentElement.scrollWidth>innerWidth'));f=f'finale-{name}-{width}-{theme}.png';page.screenshot(path=str(OUT/f));report['screenshots'].append(f)
  page.set_viewport_size({'width':1440,'height':1000});page.evaluate('document.documentElement.classList.remove("dark")')
 login('titolare@demo.it');check('Accesso titolare sulla panoramica reale');screen('panoramica')
 page.reload();page.get_by_role('heading',name='Panoramica',exact=True).wait_for();check('Sessione mantenuta con la nuova pagina iniziale')
 go('agenda?vista=Giorno');page.get_by_role('button',name=re.compile('^Azioni ')).first.click()
 with page.expect_response('**/api/agenda/stato') as response:page.get_by_role('menuitem',name='Segna eseguita',exact=True).click()
 result=response.value.json();check('Esito rapido: chiamata reale riuscita',result['ok'] and result['data']['stato']=='eseguito');changed=result['data'];page.wait_for_timeout(250);check('Stato aggiornato in elenco',page.get_by_text('Eseguita',exact=True).count()>0)
 go('panoramica');tile=page.get_by_text('Eseguiti oggi',exact=True).locator('..');check('KPI della panoramica coerente con il nuovo esito','1' in tile.inner_text());screen('panoramica-aggiornata')
 go('agenda?vista=Giorno');screen('agenda-giorno');page.get_by_role('button',name='Esiti da registrare',exact=True).click();check('Filtro esiti mantiene la vista giorno','esiti=1' in page.url);page.get_by_role('button',name='Mostra tutti',exact=True).click();page.get_by_role('button',name='Giorno successivo',exact=True).click();check('Navigazione giornaliera aggiorna la data','giorno=' in page.url);go('agenda?vista=Settimana');screen('agenda-settimana');go('agenda?vista=Elenco');screen('agenda-elenco')
 check('Nessun bottone annidato in un link',page.locator('a button,button button').count()==0)
 go('pazienti');page.get_by_role('searchbox').fill('Elisa');page.get_by_role('link',name=re.compile('Rizzo Elisa')).wait_for();check('Ricerca pazienti sul backend');page.get_by_role('link',name=re.compile('Rizzo Elisa')).click();page.get_by_role('heading',name='Rizzo Elisa',exact=True).wait_for();check('Scheda iniziale centrata sui percorsi',page.get_by_role('heading',name='Postura',exact=True).count()==1);screen('paziente-percorsi')
 page.get_by_role('tab',name='Appuntamenti',exact=True).click();page.get_by_text('Nessun appuntamento in questo periodo',exact=True).wait_for();check('Agenda del paziente con stato vuoto reale');page.get_by_role('tab',name='Anagrafica',exact=True).click();check('Consensi presenti per il titolare',page.get_by_role('heading',name='Consensi',exact=True).count()==1);screen('paziente-anagrafica')
 saves=[];page.on('request',lambda req:saves.append(req.url) if '/pazienti/salva' in req.url else None)
 go('pazienti/nuovo');page.get_by_label('Nome',exact=True).fill('Giulia');page.get_by_label('Cognome',exact=True).fill('Leone');page.get_by_role('button',name='Continua',exact=True).click();page.get_by_label('Cellulare',exact=True).fill('+393337654321');page.get_by_label('Email',exact=True).fill('giulia.leone@example.test');page.get_by_role('button',name='Indietro',exact=True).click();check('Indietro conserva i dati del primo passo',page.get_by_label('Nome',exact=True).input_value()=='Giulia');page.get_by_role('button',name='Continua',exact=True).click();check('Contatti conservati fra i passi',page.get_by_label('Cellulare',exact=True).input_value()=='+393337654321');screen('nuovo-paziente-contatti');page.get_by_role('button',name='Continua',exact=True).click();page.get_by_role('checkbox',name='Privacy',exact=True).locator('xpath=ancestor::label').click();page.get_by_role('button',name='Continua',exact=True).click();check('Nessun salvataggio automatico al cambio passo',not saves);page.get_by_label('Note amministrative',exact=True).fill('Preferisce il pomeriggio');screen('nuovo-paziente-note')
 page.get_by_role('link',name='Pazienti',exact=True).first.click();page.get_by_role('dialog').wait_for();check('Avviso di uscita con dati non salvati');page.get_by_role('button',name='Annulla',exact=True).click();page.get_by_role('dialog').wait_for(state='hidden');page.wait_for_timeout(100)
 with page.expect_response('**/api/pazienti/salva') as response:page.get_by_role('button',name='Crea paziente',exact=True).click()
 check('Una sola richiesta di salvataggio alla conferma',len(saves)==1);saved=response.value.json();check('Salvataggio completo del percorso paziente',saved['ok']);pid=saved['data']['id'];page.get_by_role('heading',name='Leone Giulia',exact=True).wait_for();patient=api('/pazienti/dettaglio',{'id':pid});check('Campi e consensi preservati nel payload',patient['consensi']['privacy']['valore'] and patient['note_amministrative']=='Preferisce il pomeriggio')
 go('impostazioni');screen('impostazioni');page.get_by_label('Telefono',exact=True).fill('081 123 4568');page.get_by_role('button',name='Salva',exact=True).click();page.wait_for_timeout(250);check('Impostazioni riorganizzate salvate con revision',api('/impostazioni/leggi')['valori']['struttura']['telefono']=='081 123 4568')
 go('fatture');screen('fatture');go('comunicazioni');screen('comunicazioni')
 # Le viste giornaliere predefinite e il menu telefono sono provate da una pagina nuova.
 page.set_viewport_size({'width':390,'height':844});go('agenda');check('Telefono: vista giorno predefinita',page.get_by_role('button',name='Giorno precedente',exact=True).count()==1);page.get_by_role('button',name='Apri menu',exact=True).click();page.get_by_role('button',name='Pazienti',exact=True).last.wait_for();page.keyboard.press('Escape');check('Esc chiude il menu telefono',page.get_by_role('button',name='Chiudi menu',exact=True).count()==0)
 # Verifica ruoli, nessuna API contabile invocata per i ruoli clinici.
 for email,role in [('segreteria@demo.it','segreteria'),('fisio@demo.it','fisioterapista'),('medico@demo.it','medico')]:
  context.close();context=browser.new_context(viewport={'width':390,'height':844},locale='it-IT',timezone_id='Europe/Rome',reduced_motion='reduce');page=context.new_page();listen(page);paths=[];page.on('request',lambda req:paths.append(req.url));login(email);check('Panoramica per '+role,api('/auth/sessione')['role']==role)
  if role=='segreteria':check('Nessun KPI economico vietato per segreteria',page.get_by_text('Da incassare',exact=True).count()==0);go('fatture');page.get_by_role('heading',name='Fatturazione',exact=True).wait_for();check('Fatture accessibili alla segreteria')
  if role=='fisioterapista':
   check('Nessuna richiesta di fatture o messaggi per fisioterapista',not any('/fatture/elenco' in u or '/comunicazioni/messaggi' in u for u in paths));go('pazienti');own=api('/pazienti/cerca',{'q':'','limite':50})['risultati'];check('Pazienti del solo professionista',len(own)<10);go('pazienti/'+own[0]['id']);page.get_by_role('tab',name='Anagrafica',exact=True).click();check('Consensi riservati non rappresentati come falsi No',page.get_by_role('heading',name='Consensi',exact=True).count()==0);go('fatture');check('Guardia interfaccia invariata',page.get_by_text('Non hai accesso a questa pagina',exact=True).count()==1);screen('accesso-negato')
 check('Nessuna eccezione JavaScript',not report['page_errors']);check('Nessuna chiave duplicata o annidamento interattivo',not report['console_errors']);browser.close()
print('CONTROLLI',len(report['checks']),'SCHERMATE',len(report['screenshots']),flush=True)
