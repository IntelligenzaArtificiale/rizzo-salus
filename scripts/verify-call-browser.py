"""Collaudo della call soltanto su dati QA, porta 8082. Nessun invio esterno."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,atexit,time
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'docs/riunione-2026-11-09/browser';OUT.mkdir(parents=True,exist_ok=True)
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
    f=label+'-'+str(width)+'-'+theme+'.png';page.screenshot(path=str(OUT/f));report['screenshots'].append(f)
  page.set_viewport_size({'width':1440,'height':1000});page.evaluate('document.documentElement.classList.remove("dark")')
 go('accedi');page.get_by_label('Email',exact=True).fill('titolare@demo.it');page.get_by_label('Password',exact=True).fill('DemoPassword2026');page.get_by_role('button',name='Accedi',exact=True).click();page.get_by_role('heading',name='Panoramica',exact=True).wait_for();check('Accesso titolare')
 # Record reali QA per verificare anche azioni e metadati delle righe.
 stock_item=api('/gestione/articolo',{'nome':'Articolo browser','unita':'pezzi','soglia_minima':5,'costo':1})
 api('/gestione/movimento',{'articolo_id':stock_item['id'],'quantita':10,'motivo':'Carico di prova','chiave':str(stock_item['id'])})
 api('/gestione/spesa',{'descrizione':'Spesa browser','date':'2026-11-09','categoria':'abbonamenti','importo':15,'pagata':False})
 for route,title in [('agenda?vista=Settimana','Agenda'),('agenda?vista=Due+giorni','Agenda'),('agenda/nuovo','Nuovo appuntamento'),('prenotazioni','Prenotazioni e attesa'),('magazzino','Magazzino'),('personale','Personale'),('spese','Entrate e uscite'),('compensi','Compensi'),('relazioni','Ricontatti e campagne'),('importazione','Importa dati storici'),('pacchetti','Documenti per i consulenti'),('mappa','Mappa dei moduli'),('decisioni','Decisioni della riunione')]:
  go(route);page.get_by_role('heading',name=title,exact=True).wait_for();check('Pagina '+title);screen(route.split('?')[0].replace('/','-')+('-due' if 'Due' in route else ''))
  check('Nessun bottone annidato '+title,page.locator('a button,button button').count()==0)
  if route in ['magazzino','spese']:check('Azioni di riga visibili '+title,page.get_by_role('button',name='Modifica',exact=True).count()>0)
 for tab in ['Orari','Cataloghi','Consensi','Prenotazioni','Documenti','Integrazioni','Personale','Compensi','Pianificazione','Chiusure','Messaggi','Assistente','Fatturazione','Automazioni']:
  go('impostazioni?scheda='+tab);page.get_by_role('heading',name='Impostazioni',exact=True).wait_for();screen('impostazioni-'+tab.lower());check('Nessun errore caricamento impostazioni '+tab,not page.get_by_text('Non è stato possibile',exact=False).count())
 # Parametri modificati da UI e letti di nuovo dal server.
 limit=4.5 if api('/impostazioni/leggi')['valori']['ai']['tetto_mensile_eur']==4.75 else 4.75
 go('impostazioni?scheda=Assistente');page.get_by_label('Limite mensile in euro',exact=True).fill(str(limit));page.get_by_role('button',name='Salva',exact=True).click();page.wait_for_timeout(200);check('Tetto mensile configurabile',api('/impostazioni/leggi')['valori']['ai']['tetto_mensile_eur']==limit)
 # Paziente, disponibilità, percorso e documento reale.
 surname='Browser'+str(time.time_ns())
 patient=api('/pazienti/salva',{'nome':'Collaudo','cognome':surname,'data_nascita':'1990-01-01','telefono':'+39333'+str(time.time_ns())[-7:],'email':'qa@example.test'});pid=patient['id']
 go('pazienti/'+pid+'?scheda=Disponibilità');page.get_by_role('button',name='Aggiungi disponibilità',exact=True).click();page.get_by_label('Medico specialista',exact=True).fill('Specialista di prova');page.get_by_role('button',name='Salva disponibilità e riferimenti',exact=True).click();page.wait_for_timeout(300);check('Disponibilità e specialista salvati',api('/pazienti/dettaglio',{'id':pid})['medico_specialista']=='Specialista di prova')
 catalog=api('/catalogo/elenco');tt=next(t for t in catalog['terapie'] if t['categoria']=='strumentale')
 go('percorsi/nuovo?paziente='+pid);page.get_by_label('Titolo',exact=True).fill('Percorso browser');page.get_by_role('button',name='Aggiungi terapia',exact=True).click();page.get_by_label('Prestazione',exact=True).select_option(tt['id']);page.get_by_role('button',name='Salva percorso',exact=True).click();page.get_by_role('heading',name=surname+' Collaudo',exact=True).wait_for();check('Percorso creato dalla UI');screen('paziente-percorso')
 tpl=api('/documenti/modello-salva',{'nome':'Consenso prova browser','tipo':'privacy','testo':'Informativa di prova per {{nome}} {{cognome}}.','versione':'1','attivo':True})
 go('pazienti/'+pid+'?scheda=Documenti');page.get_by_label('Genera da modello',exact=True).select_option(tpl['id']);page.get_by_role('button',name='Archivia documento',exact=True).click();page.wait_for_timeout(400);doc=api('/documenti/elenco',{'patient_id':pid})['documenti'][0];check('Documento generato dalla UI',doc['stato']=='da_firmare');screen('paziente-documenti')
 link=api('/documenti/link',{'id':doc['id']})['token'];go('firma/'+link);page.get_by_role('heading',name='Consenso prova browser',exact=True).wait_for();page.get_by_role('checkbox').locator('xpath=ancestor::label').click();
 with page.expect_response('**/api/firma/otp') as otp_response:page.get_by_role('button',name='Richiedi codice sul cellulare',exact=True).click()
 challenge=otp_response.value.json()['data']['challenge']
 page.get_by_label('Codice ricevuto',exact=True).wait_for();check('Pagina firma richiede il codice dopo lettura');screen('firma-otp')
 # Non si registrano i codici nel report.
 messages=api('/comunicazioni/messaggi',{})['messaggi'];message=next(m for m in messages if m['idempotency_key']=='otp:'+challenge);code=re.search(r'\b(\d{6})\b',message['body']).group(1)
 page.get_by_label('Codice ricevuto',exact=True).fill(code);page.get_by_role('button',name='Conferma accettazione',exact=True).click();page.get_by_text('Accettazione registrata',exact=True).first.wait_for();check('Documento accettato con OTP dalla UI',api('/documenti/elenco',{'patient_id':pid})['documenti'][0]['stato']=='firmato')
 # Solo il titolare vede lo stato delle credenziali. Il valore non è esposto.
 status=api('/impostazioni/segreti-stato');check('Credenziali restituite come soli booleani',all(isinstance(v,bool) for v in status.values()))
 # Superfici pubbliche senza sessione.
 public=browser.new_context(viewport={'width':390,'height':844});pub=public.new_page();pub.goto(BASE+'/#/prenota');pub.get_by_role('heading',name='Prenota una visita',exact=True).wait_for();check('Prenotazione pubblica senza login');pub.goto(BASE+'/#/portale');pub.get_by_role('heading',name='Il tuo percorso',exact=True).wait_for();check('Portale richiede verifica telefono');check('Pubblico non può leggere i pazienti',public.request.post(BASE+'/api/pazienti/cerca',data={}).status==401)
 for email,role in [('fisio@demo.it','fisioterapista'),('medico@demo.it','medico'),('segreteria@demo.it','segreteria')]:
  other=browser.new_context();pg=other.new_page();pg.goto(BASE+'/#/accedi');pg.get_by_label('Email',exact=True).fill(email);pg.get_by_label('Password',exact=True).fill('DemoPassword2026');pg.get_by_role('button',name='Accedi',exact=True).click();pg.get_by_role('heading',name='Panoramica',exact=True).wait_for();perms=pg.evaluate("JSON.parse(JSON.stringify(sessionStorage.getItem('rizzo-csrf')))");r=other.request.post(BASE+'/api/auth/sessione',data={},headers={'X-CSRF-Token':perms}).json()['data'];check('Permessi ruolo '+role,('agenda.modifica' in r['permessi'])==(role=='segreteria'))
  if role!='segreteria':check('Agenda clinico solo lettura '+role,'agenda.segna_eseguita' not in r['permessi'])
  other.close()
 check('Nessuna eccezione JavaScript',not report['errors']);check('Nessun errore console',not report['console']);browser.close()
 print('CONTROLLI',len(report['checks']),'SCHERMATE',len(report['screenshots']))
