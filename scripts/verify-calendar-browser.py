"""Collaudo della call soltanto su dati QA, porta 8082. Nessun invio esterno."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,atexit,time
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'docs/specifiche-2026-11-11/browser';OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:8082';report={'checks':[],'screenshots':[],'errors':[],'console':[]}
atexit.register(lambda:(OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)))
def check(label,value=True):
 if not value:raise AssertionError(label)
 report['checks'].append(label);print('PASS',label,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':1440,'height':1000},locale='it-IT',timezone_id='Europe/Rome');page=ctx.new_page()
 page.on('pageerror',lambda e:report['errors'].append(str(e)))
 page.on('console',lambda m:report['console'].append(m.text+' '+str(m.location)) if m.type=='error' and not ('401' in m.text and '/auth/sessione' in m.location.get('url','')) else None)
 def go(route):
  page.goto(BASE+'/#/'+route);page.wait_for_timeout(250)
 def api(path,body=None,ok=True):
  csrf=page.evaluate("sessionStorage.getItem('rizzo-csrf')");r=page.request.post(BASE+'/api'+path,data=body or {},headers={'X-CSRF-Token':csrf or ''});j=r.json()
  if ok and not j.get('ok'):raise AssertionError(path+': '+str(j))
  return j.get('data') if ok else j
 def screen(label):
  for width in [1440,390]:
   page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
   for theme in ['light','dark']:
    page.evaluate('(v)=>document.documentElement.classList.toggle("dark",v)',theme=='dark');page.wait_for_timeout(40)
    check(label+' '+str(width)+' '+theme+' senza overflow',not page.evaluate('document.documentElement.scrollWidth>innerWidth'))
    f=label+'-'+str(width)+'-'+theme+'.png';page.screenshot(path=str(OUT/f),full_page=True);report['screenshots'].append(f)
  page.set_viewport_size({'width':1440,'height':1000});page.evaluate('document.documentElement.classList.remove("dark")')
 go('accedi');page.get_by_label('Email',exact=True).fill('titolare@demo.it');page.get_by_label('Password',exact=True).fill('DemoPassword2026');page.get_by_role('button',name='Accedi',exact=True).click();page.get_by_role('heading',name='Panoramica',exact=True).wait_for();check('Accesso titolare')

 go('impostazioni?scheda=Calendar');page.get_by_role('button',name='Applica le specifiche confermate',exact=True).click();page.get_by_role('button',name='Profilo applicato',exact=True).wait_for();check('Profilo operativo applicato dalla UI')
 catalog=api('/catalogo/elenco');types={t['nome']:t for t in catalog['terapie']};pros={t['nome']:t for t in catalog['professionisti']}
 week='2026-12-07';eps=[]
 for i in range(3):
  pp=api('/pazienti/salva',{'nome':['Anna','Luca','Sara'][i],'cognome':'Calendar','telefono':'+39333098765'+str(i)})
  ep=api('/percorsi/salva',{'patient_id':pp['id'],'titolo':'Riabilitazione Calendar','profilo_gruppo':'neurologico' if i==0 else 'standard','terapie':[{'therapy_type_id':types['Rieducazione motoria']['id'],'sedute_previste':1 if i==0 else 3,'frequenza_max':3}]});eps.append(ep)
 refs=[{'patient_id':e['patient_id'],'episode_id':e['id'],'line_id':e['therapies'][0]['line_id']} for e in eps]
 group=api('/agenda/crea',{'tipo':'gruppo','therapy_type_id':types['Rieducazione motoria']['id'],'professional_id':pros['Marco']['id'],'start':week+'T09:00:00','participants':refs})
 for name,start in [('Terapia manuale','10:00:00'),('Camera iperbarica','10:00:00'),('Laserterapia','10:30:00')]:
  api('/agenda/crea',{'tipo':'terapia','therapy_type_id':types[name]['id'],'professional_id':pros['Marco']['id'],'patient_id':api('/pazienti/salva',{'nome':name,'cognome':'Calendar'})['id'],'start':week+'T'+start})
 route='agenda?settimana='+week+'&giorno='+week+'&vista=Settimana'
 go(route);page.get_by_role('heading',name='Agenda',exact=True).wait_for();check('Sei sottocolonne per ciascun giorno',page.locator('.clinic-day-column').count()==30);check('Gruppo con indicatore fine individuale',page.locator('.clinic-group').inner_text().count('▲')==1);screen('agenda-settimana')
 page.get_by_role('button',name='A tutto schermo',exact=True).click();page.wait_for_timeout(100);check('Calendario a tutto schermo',page.evaluate('Boolean(document.fullscreenElement)'));page.screenshot(path=str(OUT/'agenda-fullscreen.png'));page.evaluate('document.exitFullscreen()')
 page.get_by_label('Raggruppamento colonne',exact=True).select_option('professionista');page.wait_for_timeout(300);check('Raggruppamento professionista',page.locator('.clinic-day-heading strong').first.inner_text()=='Marco')
 go(route);page.get_by_text('Appunti della segreteria · sabato e settimana',exact=True).click();page.get_by_role('button',name='Aggiungi nota',exact=True).click();page.get_by_label('Titolo della nota',exact=True).fill('Telefonare ad Antonio');page.get_by_label('Dettagli della nota',exact=True).fill('Appunto del sabato senza bloccare le terapie');page.get_by_role('button',name='Salva nota',exact=True).click();page.get_by_text('Telefonare ad Antonio',exact=True).wait_for();check('Nota sabato dalla UI',api('/agenda/note',{'da':week,'a':'2026-12-13'})['note'][0]['start'].startswith('2026-12-12'));check('Nota esclusa dalle terapie',page.locator('.clinic-event').count()==4)
 page.get_by_role('button',name='Modifica nota',exact=True).click();page.get_by_label('Titolo della nota',exact=True).fill('Telefonare ad Antonio aggiornato');page.get_by_role('button',name='Salva nota',exact=True).click();page.get_by_text('Telefonare ad Antonio aggiornato',exact=True).wait_for();check('Modifica nota persistente')
 for view in ['Giorno','Due giorni']:
  go('agenda?settimana='+week+'&giorno='+week+'&vista='+view.replace(' ','+'));page.get_by_role('heading',name='Agenda',exact=True).wait_for();screen('agenda-'+view.replace(' ','-').lower())
 go('agenda/'+group['id']+'/proposte-spostamento');page.get_by_role('button',name='Cerca orari compatibili',exact=True).click();page.get_by_role('button',name='Rivedi spostamento',exact=True).first.wait_for();screen('proposte-spostamento');page.get_by_role('button',name='Rivedi spostamento',exact=True).first.click();check('Spostamento richiede conferma',page.get_by_role('button',name='Conferma spostamento',exact=True).is_visible());page.get_by_role('button',name='Annulla',exact=True).click();check('Nessuna modifica senza approvazione',next(a for a in api('/agenda/vista',{'da':week,'a':week})['appuntamenti'] if a['id']==group['id'])['start']==week+'T09:00:00')
 go('statistiche?da='+week+'&a=2026-12-11');page.get_by_role('heading',name='Statistiche agenda',exact=True).wait_for();screen('statistiche');check('Riepilogo pazienti prestazioni ore',page.get_by_text('Pazienti, prestazioni e ore per professionista',exact=True).is_visible())
 go('impostazioni?scheda=Calendar');page.get_by_role('heading',name='Impostazioni',exact=True).wait_for();screen('impostazioni-calendar')
 go('impostazioni?scheda=Cataloghi');page.get_by_label('Catalogo',exact=True).select_option('professionisti');page.get_by_label('Voce da modificare',exact=True).select_option(pros['Chiara']['id']);screen('orari-chiara')
 go('agenda?vista=Settimana');page.get_by_role('button',name='Settimana corrente',exact=True).click();check('Giorno attuale blu',page.locator('.clinic-today').count()==6);screen('agenda-corrente')
 for email,can_edit in [('fisio@demo.it',False),('segreteria@demo.it',True)]:
  other=browser.new_context();pg=other.new_page();pg.goto(BASE+'/#/accedi');pg.get_by_label('Email',exact=True).fill(email);pg.get_by_label('Password',exact=True).fill('DemoPassword2026');pg.get_by_role('button',name='Accedi',exact=True).click();pg.get_by_role('heading',name='Panoramica',exact=True).wait_for();token=pg.evaluate("sessionStorage.getItem('rizzo-csrf')");r=other.request.post(BASE+'/api/agenda/nota-salva',data={'titolo':'Prova permessi','start':'2026-12-12T12:00:00'},headers={'X-CSRF-Token':token or ''});check('Permessi note '+email,(r.status==200)==can_edit);other.close()
 check('Nessuna eccezione JavaScript',not report['errors']);check('Nessun errore console',not report['console']);browser.close()
 print('CONTROLLI',len(report['checks']),'SCHERMATE',len(report['screenshots']))
