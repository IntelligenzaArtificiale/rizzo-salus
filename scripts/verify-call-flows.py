"""Percorsi interattivi extra, soltanto sul server QA 8082 e messaggi in prova."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import time,re,json,base64
BASE='http://127.0.0.1:8082';OUT=Path(__file__).resolve().parent.parent/'docs/riunione-2026-11-09/browser';checks=[]
def check(label,condition=True):
 if not condition:raise AssertionError(label)
 checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':1440,'height':1000},locale='it-IT');page=ctx.new_page();page.goto(BASE+'/#/accedi');page.get_by_label('Email',exact=True).fill('titolare@demo.it');page.get_by_label('Password',exact=True).fill('DemoPassword2026');page.get_by_role('button',name='Accedi',exact=True).click();page.get_by_role('heading',name='Panoramica',exact=True).wait_for()
 def api(path,body=None):
  r=page.request.post(BASE+'/api'+path,data=body or {},headers={'X-CSRF-Token':page.evaluate("sessionStorage.getItem('rizzo-csrf')")});j=r.json()
  if not j.get('ok'):raise AssertionError(path+': '+str(j))
  return j['data']
 def otp(challenge):
  m=next(m for m in api('/comunicazioni/messaggi')['messaggi'] if m['idempotency_key']=='otp:'+challenge)
  return re.search(r'\b(\d{6})\b',m['body']).group(1)
 suffix=str(time.time_ns());phone='+39333'+suffix[-7:];surname='Flusso'+suffix
 settings=api('/impostazioni/leggi');api('/impostazioni/salva',{'revision':settings['revision'],'dati':{'prenotazioni':{'attive':True,'informativa':'Informativa dimostrativa QA','anticipo_minimo_ore':0},'orari':{str(i):[['08:00','20:00']] for i in range(1,6)}}})
 doctor=api('/catalogo/professionista/salva',{'nome':'Medico','cognome':suffix,'tipo':'medico','specialita':['Fisiatria'],'orari':{'4':[['09:00','12:00']]},'prenotabile_online':True})
 tt=api('/catalogo/terapia/salva',{'nome':'Visita QA '+suffix,'categoria':'visita','durata_min':30,'tariffa':50,'prenotabile_online':True})
 api('/prenotazioni/finestra-salva',{'professional_id':doctor['id'],'therapy_type_id':tt['id'],'date':'2026-11-12','da':'09:00','a':'12:00','pubblicata':True})
 pubctx=browser.new_context(viewport={'width':390,'height':844},locale='it-IT');pub=pubctx.new_page();pub.goto(BASE+'/#/prenota');pub.get_by_label('Visita',exact=True).select_option(tt['id']);pub.get_by_label('Giorno',exact=True).fill('2026-11-12');pub.get_by_role('button',name=re.compile('^09:00')).click()
 for label,value in [('Nome','Prova'),('Cognome',surname),('Cellulare',phone),('Data di nascita','1991-01-01')]:pub.get_by_label(label,exact=True).fill(value)
 pub.get_by_role('checkbox',name='Ho letto l’informativa per la prenotazione',exact=True).locator('xpath=ancestor::label').click()
 with pub.expect_response('**/api/prenota/richiedi') as response:pub.get_by_role('button',name='Ricevi codice di verifica',exact=True).click()
 challenge=response.value.json()['data']['challenge'];pub.get_by_label('Codice di verifica',exact=True).fill(otp(challenge));pub.get_by_role('button',name='Conferma visita',exact=True).click();pub.get_by_text('Visita confermata',exact=True).wait_for();check('Visita prenotata dalla UI pubblica con OTP')
 patients=api('/pazienti/cerca',{'q':surname});patient=next(p for p in patients['risultati'] if p['cognome']==surname);pid=patient['id']
 apps=api('/agenda/vista',{'da':'2026-11-12','a':'2026-11-12'})['appuntamenti'];appt=next(a for a in apps if a.get('patient_id')==pid)
 pub.goto(BASE+'/#/portale');pub.get_by_label('Cellulare registrato in struttura',exact=True).fill(phone);pub.get_by_label('Data di nascita',exact=True).fill('1991-01-01')
 with pub.expect_response('**/api/prenota/portale-otp') as response:pub.get_by_role('button',name='Richiedi codice',exact=True).click()
 pub.get_by_label('Codice ricevuto',exact=True).fill(otp(response.value.json()['data']['challenge']));pub.get_by_role('button',name='Accedi',exact=True).click();pub.get_by_text('Ciao Prova',exact=True).wait_for();check('Accesso portale dalla UI con telefono, nascita e OTP');check('Portale blocca calendario senza consensi',pub.get_by_text('Completa i consensi in segreteria',exact=False).is_visible())
 # Documento fittizio generato dal server e caricato come copia cartacea nella fixture.
 template=api('/documenti/modello-salva',{'nome':'Modulo QA','tipo':'privacy','testo':'Documento dimostrativo','versione':'1','attivo':True});document=api('/documenti/salva',{'patient_id':pid,'titolo':'Modulo QA','modello_id':template['id']})
 content=page.request.post(BASE+'/api/documenti/scarica',data={'id':document['id']},headers={'X-CSRF-Token':page.evaluate("sessionStorage.getItem('rizzo-csrf')")}).body()
 for kind in ['privacy','trattamento']:api('/documenti/salva',{'patient_id':pid,'titolo':'Copia fittizia QA','tipo':kind,'base64':base64.b64encode(content).decode(),'nome_file':'consenso.pdf','mime':'application/pdf','firmato_cartaceo':True})
 # Stato personale resta in memoria, nuovo accesso ripete il controllo lato server.
 pub.reload();pub.get_by_label('Cellulare registrato in struttura',exact=True).fill(phone);pub.get_by_label('Data di nascita',exact=True).fill('1991-01-01')
 with pub.expect_response('**/api/prenota/portale-otp') as response:pub.get_by_role('button',name='Richiedi codice',exact=True).click()
 pub.get_by_label('Codice ricevuto',exact=True).fill(otp(response.value.json()['data']['challenge']));pub.get_by_role('button',name='Accedi',exact=True).click();pub.get_by_role('button',name='Richiedi disdetta',exact=True).wait_for();pub.get_by_role('button',name='Richiedi disdetta',exact=True).click();pub.get_by_role('button',name='Richiedi disdetta',exact=True).wait_for(state='visible');pub.wait_for_timeout(250)
 check('Richiesta disdetta UI non cancella la visita',next(a for a in api('/agenda/vista',{'da':'2026-11-12','a':'2026-11-12'})['appuntamenti'] if a['id']==appt['id'])['stato']=='confermato');check('Disdetta registrata una sola volta dalla UI',pub.get_by_role('button',name='Richiedi disdetta',exact=True).is_disabled());pub.screenshot(path=str(OUT/'flusso-portale-mobile.png'))
 # Drag apre il form; abbandonarlo non cambia la data nell'archivio.
 page.goto(BASE+'/#/agenda?settimana=2026-11-09&vista=Settimana&area=Poliambulatorio');event=page.locator('a.clinic-event').filter(has_text=surname);event.wait_for();dt=page.evaluate_handle('new DataTransfer()');event.dispatch_event('dragstart',{'dataTransfer':dt});column=page.locator('.clinic-day-column').nth(4);column.dispatch_event('drop',{'dataTransfer':dt,'clientY':300});page.get_by_role('heading',name='Sposta appuntamento',exact=True).wait_for();check('Trascinamento apre revisione dello spostamento');check('Nessuna modifica agenda al solo trascinamento',next(a for a in api('/agenda/vista',{'da':'2026-11-12','a':'2026-11-12'})['appuntamenti'] if a['id']==appt['id'])['start']==appt['start']);page.screenshot(path=str(OUT/'flusso-sposta-revisione.png'))
 page.goto(BASE+'/#/impostazioni?scheda=Integrazioni');page.get_by_label('Impostazioni',exact=True).wait_for();check('Molte sezioni usano un selettore leggibile anche su desktop',page.get_by_label('Impostazioni',exact=True).evaluate('(e)=>e.tagName')=='SELECT');page.screenshot(path=str(OUT/'impostazioni-integrazioni-finale.png'))
 browser.close()
(OUT/'flows-report.json').write_text(json.dumps({'checks':checks},ensure_ascii=False,indent=2));print('CONTROLLI',len(checks))
