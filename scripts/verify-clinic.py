# Script storico: selettori della prima versione UI, non collaudo della revisione attuale.
import os
if os.environ.get('RIZZO_RUN_LEGACY_QA') != '1':
 raise SystemExit('Script storico disabilitato. Usare verify-clinic-ux.py sul server QA isolato 8082.')
"""Verifica storica, solo su QA 8082. Nessuna richiesta ai server in uso."""
import json,time,atexit
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'docs/redesign/verifica';OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:8082'
report={'checks':[],'errors':[],'screenshots':[]}
atexit.register(lambda: (OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)))
def check(label,condition=True):
 if not condition:raise AssertionError(label)
 report['checks'].append(label);print('OK',label,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
 def goto(route):
  page.goto(BASE+'/#/'+route);page.wait_for_timeout(350)
 def login(email):
  goto('accedi');page.get_by_label('Email',exact=True).fill(email);page.get_by_label('Password',exact=True).fill('DemoPassword2026');page.get_by_role('button',name='Accedi',exact=True).click();page.get_by_role('heading',name='Agenda',exact=True).wait_for()
 def api(path,body=None,ok=True):
  csrf=page.evaluate("sessionStorage.getItem('rizzo-csrf')")
  r=page.request.post(BASE+'/api'+path,data=body or {},headers={'X-CSRF-Token':csrf or ''})
  j=r.json()
  if ok and not j.get('ok'):raise AssertionError(path+': '+str(j))
  return j.get('data') if ok else j
 def screen(name):
  for width in [1440,390]:
   page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
   for theme in ['light','dark']:
    page.evaluate('(t)=>document.documentElement.classList.toggle("dark",t==="dark")',theme);page.wait_for_timeout(80)
    overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth')
    check(name+' '+str(width)+' '+theme+' senza overflow',not overflow)
    f=f'{name}-{width}-{theme}.png';page.screenshot(path=str(OUT/f),full_page=True);report['screenshots'].append(f)
  page.set_viewport_size({'width':1440,'height':1000});page.evaluate('document.documentElement.classList.remove("dark")')
 goto('accedi');check('Accesso: invio disabilitato su form vuoto',page.get_by_role('button',name='Accedi',exact=True).is_disabled());screen('accesso')
 login('titolare@demo.it');check('Login reale titolare');page.reload();page.get_by_role('heading',name='Agenda',exact=True).wait_for();check('Sessione ripristinata dopo ricaricamento')
 appointments=api('/agenda/vista',{'da':'2026-11-09','a':'2026-11-14','annullati':True})['appuntamenti'];check('Agenda caricata dal backend',len(appointments)>0);screen('agenda')
 first=appointments[0];goto(f"agenda/{first['id']}?giorno={first['start'][:10]}");page.get_by_role('button',name='Segna eseguita',exact=True).click();page.get_by_text('Eseguita',exact=True).first.wait_for();check('Presenza registrata dal nuovo frontend');screen('appuntamento')
 goto('agenda/copia?settimana=2026-11-09');check('Anteprima copia visibile',page.get_by_role('heading',name='Copia settimana',exact=True).count()==1);screen('copia-settimana')
 goto('pazienti');screen('pazienti');goto('pazienti/nuovo');page.get_by_label('Nome',exact=True).fill('Giulia');page.get_by_label('Cognome',exact=True).fill('Leone');page.get_by_role('link',name='Pazienti',exact=True).first.click();page.get_by_role('dialog').wait_for();check('Avviso modifiche non salvate');page.get_by_role('button',name='Annulla',exact=True).click();page.get_by_role('dialog').wait_for(state='hidden');page.wait_for_timeout(100);page.get_by_label('Cellulare',exact=True).fill('+393337654321');page.get_by_label('Email',exact=True).fill('giulia.leone@example.test');screen('paziente-creazione');page.get_by_role('button',name='Crea paziente',exact=True).click();page.get_by_role('heading',name='Leone Giulia',exact=True).wait_for();check('Creazione paziente dal frontend');pid=page.url.split('/pazienti/')[-1].split('?')[0]
 goto(f'pazienti/{pid}/modifica');page.get_by_label('Medico curante',exact=True).fill('Dott. De Santis');page.get_by_role('button',name='Salva modifiche',exact=True).click();page.get_by_role('heading',name='Leone Giulia',exact=True).wait_for();check('Modifica paziente persistita',api('/pazienti/dettaglio',{'id':pid})['medico_curante']=='Dott. De Santis');screen('paziente-scheda')
 patients=api('/pazienti/cerca',{'q':'Elisa','limite':50})['risultati'];elisa=api('/pazienti/dettaglio',{'id':patients[0]['id']});episode=elisa['episodi'][0]['id'];goto(f'pianificazione/nuova?episodio={episode}&paziente={elisa["id"]}');page.get_by_role('button',name='Genera proposta',exact=True).click();page.get_by_role('button',name='Approva e inserisci in agenda',exact=True).wait_for(timeout=15000);screen('pianificazione');page.get_by_role('button',name='Approva e inserisci in agenda',exact=True).click();page.get_by_role('heading',name='Agenda',exact=True).wait_for();check('Pianificazione generata e approvata via frontend')
 goto('profilo');page.get_by_label('Nome',exact=True).fill('Antonio Maria');page.get_by_role('button',name='Salva',exact=True).click();page.wait_for_timeout(300);check('Profilo: contratto nome/cognome corretto',api('/auth/sessione')['nome']=='Antonio Maria')
 goto('impostazioni');page.get_by_label('Telefono',exact=True).fill('081 123 4568');page.get_by_role('button',name='Salva',exact=True).click();page.wait_for_timeout(300);check('Salvataggio impostazioni con revision',api('/impostazioni/leggi')['valori']['struttura']['telefono']=='081 123 4568');screen('impostazioni')
 goto('impostazioni?scheda=Ruoli');page.get_by_label('Ruolo',exact=True).select_option('segreteria');checkbox=page.get_by_role('checkbox').first;checkbox.locator('xpath=ancestor::label').click();page.get_by_role('button',name='Salva',exact=True).click();page.wait_for_timeout(400);check('Salvataggio ruoli senza modificare titolare',page.get_by_role('button',name='Salva',exact=True).count()==0);screen('ruoli')
 # Ripristina i permessi prima di provare gli altri ruoli.
 current=api('/impostazioni/leggi');original_roles=json.loads((OUT/'test-original-roles.json').read_text()) if (OUT/'test-original-roles.json').exists() else None
 if original_roles:api('/impostazioni/salva',{'dati':{'ruoli':original_roles},'revision':current['revision']})
 for route,name in [('impostazioni?scheda=Utenti','utenti'),('impostazioni?scheda=Orari','orari'),('impostazioni?scheda=Messaggi','impostazioni-messaggi'),('impostazioni?scheda=Fatturazione','impostazioni-fatture'),('impostazioni?scheda=Assistente','impostazioni-assistente'),('comunicazioni','comunicazioni'),('comunicazioni?scheda=Variazioni','variazioni'),('statistiche','statistiche'),('profilo?scheda=Sicurezza','profilo-sicurezza'),('profilo?scheda=Permessi','profilo-permessi'),('assistente','assistente'),('mappa','mappa'),('mappa/6','modulo'),('decisioni','decisioni'),('fatture','fatture'),('fatture/nuova','fattura-nuova')]:
  goto(route);screen(name)
 # Verifica fatturazione con fixture fittizie sulla copia soltanto.
 seller=api('/impostazioni/leggi');api('/impostazioni/salva',{'dati':{'struttura':{'partita_iva':'01114601006','cap':'80100','provincia':'NA','citta':'Napoli','indirizzo':'Via Roma 1'}},'revision':seller['revision']})
 buyer=api('/pazienti/dettaglio',{'id':first['patient_id']}) if first.get('patient_id') else api('/pazienti/dettaglio',{'id':next(iter(first['pazienti_nomi']))})
 buyer.update({'codice_fiscale':'RSSMRA80A01H501U','indirizzo':'Via Roma 20','cap':'80100','citta':'Napoli','provincia':'NA'})
 api('/pazienti/salva',buyer)
 candidates=api('/fatture/proponi',{'patient_id':buyer['id']})['righe'];free=[r for r in candidates if not r['gia_fatturata']];check('Righe da sedute eseguite disponibili',bool(free))
 draft=api('/fatture/bozza-salva',{'patient_id':buyer['id'],'righe':free});goto('fatture/'+draft['id']);screen('fattura-bozza');page.get_by_role('button',name='Emetti fattura',exact=True).click();page.get_by_text('Emessa',exact=True).first.wait_for();check('Emissione fattura con backend originale');screen('fattura-emessa')
 page.get_by_role('button',name='Registra incasso',exact=True).click();page.get_by_text('Pagata',exact=True).first.wait_for();check('Incasso registrato');screen('fattura-pagata')
 csrf=page.evaluate("sessionStorage.getItem('rizzo-csrf')")
 for kind,magic in [('pdf',b'%PDF'),('xml',b'<?xml')]:
  r=page.request.post(BASE+'/api/fatture/scarica-'+kind,data={'id':draft['id']},headers={'X-CSRF-Token':csrf});check('Download '+kind+' reale',r.ok and r.body().startswith(magic))
 goto('fatture/'+draft['id']+'/storno');page.get_by_label('Motivo dello storno').fill('Rettifica della prestazione');page.get_by_role('button',name='Emetti nota di credito').click();page.wait_for_url(lambda url:'/storno' not in url and '/#/fatture/fat_' in url);page.get_by_role('heading',name='Nota di credito',exact=False).wait_for();check('Nota di credito dal frontend')
 # Copia applicata, errore di rete recuperabile e promemoria pubblico.
 goto('agenda/copia?settimana=2026-11-09');copy=page.get_by_role('button',name='Copia ora',exact=True)
 if copy.is_enabled():
  with page.expect_response('**/api/agenda/copia-applica') as response:copy.click()
  result=response.value.json();check('Copia settimana applicata dal frontend',result.get('ok') and 'creati' in result['data']);page.get_by_role('heading',name='Agenda',exact=True).wait_for()
 else:check('Copia senza sedute applicabili disabilitata')
 page.route('**/api/pazienti/cerca',lambda r:r.abort());goto('pazienti');page.get_by_role('button',name='Riprova',exact=True).wait_for();check('Errore di rete con azione Riprova');screen('errore-connessione');page.unroute('**/api/pazienti/cerca');page.get_by_role('button',name='Riprova',exact=True).click();page.get_by_role('heading',name='Pazienti',exact=True).wait_for();check('Recupero dopo errore di rete')
 import re
 messages=api('/comunicazioni/messaggi')['messaggi'];match=next((re.search(r'/s/([A-Za-z0-9_-]+)',m.get('body','')) for m in messages if re.search(r'/s/([A-Za-z0-9_-]+)',m.get('body',''))),None)
 if match:
  auth_page=page;public_context=browser.new_context(viewport={'width':1440,'height':1000});page=public_context.new_page();goto('settimana/'+match.group(1));check('Settimana pubblica senza autenticazione',page.get_by_role('heading',name='Buongiorno',exact=False).count()==1);screen('settimana-pubblica');public_context.close();page=auth_page
 check('Configurazione privata non esposta',page.request.get(BASE+'/demo/.env.demo').status==404)
 # Letture e autorizzazioni per tutti i ruoli; cookie isolati per contesto.
 for email,role in [('segreteria@demo.it','segreteria'),('fisio@demo.it','fisioterapista'),('medico@demo.it','medico')]:
  api('/auth/logout');page.evaluate("sessionStorage.removeItem('rizzo-csrf')");login(email);u=api('/auth/sessione');check('Login '+role,u['role']==role)
  if role=='fisioterapista':
   own=api('/pazienti/cerca',{'q':'','limite':50})['risultati'];check('Pazienti limitati al fisioterapista',len(own)<10);patient=api('/pazienti/dettaglio',{'id':own[0]['id']});check('Dati clinici nascosti al fisioterapista','anamnesi' not in patient and all('diagnosi' not in e for e in patient['episodi']));denied=api('/fatture/elenco',{},False);check('Fatturazione vietata dal server',not denied['ok']);goto('fatture');check('Pagina fatture vietata anche nella UI',page.get_by_text('Non hai accesso a questa pagina',exact=True).count()==1);screen('accesso-negato')
  if role=='medico':screen('agenda-medico')
 check('Nessuna eccezione JavaScript',not report['errors'])
 browser.close()
(OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('REPORT',len(report['checks']),'checks',len(report['screenshots']),'screenshots',flush=True)
