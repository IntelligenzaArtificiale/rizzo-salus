'use strict';
// [id, gruppo, domanda, perché conta, [[valore, etichetta, dettaglio, consigliata?]...]]
const Q = [
  ['wa_provider', 'Messaggi', 'Da quale numero WhatsApp partono i messaggi?', 'Serve un numero WhatsApp Business collegato a Meta e al servizio Composio. Senza, i promemoria possono partire solo per SMS o email.', [
    ['esiste', 'Abbiamo già un numero WhatsApp Business', 'Lo colleghiamo subito', 0], ['nuovo', 'Lo attiviamo adesso con un numero nuovo', 'Serve il vostro account Meta Business', 1], ['solo_sms', 'Per ora solo SMS ed email', 'WhatsApp si aggiunge dopo', 0]]],
  ['promemoria_contenuto', 'Messaggi', 'Che cosa contiene il promemoria del venerdì?', 'Parte da solo ogni venerdì alle 13:00 per chi ha appuntamenti nella settimana dopo.', [
    ['link_riassunto', 'Un riassunto breve e il link personale', 'Il link mostra sempre gli orari aggiornati', 1], ['link', 'Solo il link', 'Messaggio più corto', 0], ['testo', 'Tutto l’elenco scritto nel messaggio', 'Non si aggiorna se qualcosa cambia', 0]]],
  ['promemoria_giorno', 'Messaggi', 'Giorno e ora del promemoria', 'Si può cambiare in qualsiasi momento dalle impostazioni.', [
    ['ven13', 'Venerdì alle 13:00', 'Come da richiesta iniziale', 1], ['gio18', 'Giovedì alle 18:00', 'Più tempo per chi deve spostare', 0], ['sab10', 'Sabato alle 10:00', 'Più vicino alla settimana', 0]]],
  ['variazioni', 'Messaggi', 'Se cambiate un appuntamento, il paziente viene avvisato…', 'Più modifiche ravvicinate diventano un solo messaggio (attesa 10 minuti). Non si avvisa se il cambio riporta allo stato già comunicato.', [
    ['controllo', 'Dopo che la segreteria ha riletto il messaggio', 'Coda «Da inviare», approvazione anche multipla', 1], ['automatica', 'Subito, in automatico', 'Più veloce, meno controllo', 0], ['manuale', 'Mai: la segreteria telefona e spunta', 'Il sistema ricorda chi va chiamato', 0]]],
  ['silenzio', 'Messaggi', 'Orari in cui non si inviano messaggi ai pazienti', 'I codici di verifica partono sempre.', [
    ['21_8', 'Dalle 21:00 alle 08:00', '', 1], ['20_9', 'Dalle 20:00 alle 09:00', '', 0], ['22_7', 'Dalle 22:00 alle 07:00', '', 0]]],
  ['followup', 'Messaggi', 'Quando chiedere «come sta?» dopo la fine del ciclo', 'Poi, dopo qualche giorno, parte la richiesta di recensione Google (una l’anno a paziente).', [
    ['15_40', '15 giorni per le terapie brevi, 40 per le lunghe', 'Si imposta per ogni tipo di terapia', 1], ['15', 'Sempre 15 giorni', '', 0], ['30', 'Sempre 30 giorni', '', 0]]],
  ['campagne', 'Messaggi', 'Le campagne promozionali…', 'Per legge servono il consenso marketing registrato e la possibilità di disiscriversi.', [
    ['si_consenso', 'Si fanno, solo a chi ha dato il consenso', 'Invio a gruppi per non saturare i limiti', 1], ['dopo', 'Le rimandiamo alla seconda versione', '', 0]]],
  ['agenda_chi', 'Agenda e pianificazione', 'Chi può creare e spostare appuntamenti?', 'Medici e fisioterapisti segnano le proprie sedute ma non toccano l’agenda.', [
    ['segreteria', 'Solo titolare e segreteria', 'Come da brief', 1], ['fisio_propri', 'Anche i fisioterapisti per i propri pazienti', '', 0]]],
  ['planner_sposta', 'Agenda e pianificazione', 'Il pianificatore può spostare i pazienti già fissati per far posto a un altro?', 'Solo dentro le fasce che i pazienti hanno indicato, e solo dopo la vostra approvazione.', [
    ['si2', 'Sì, fino a due spostamenti a catena', 'Più sedute piazzate', 1], ['si1', 'Sì, uno solo', '', 0], ['no', 'No: mai toccare quello che è fissato', 'Più sedute da piazzare a mano', 0]]],
  ['ai_chiave', 'Agenda e pianificazione', 'Usiamo OpenAI per capire le disponibilità scritte a parole e per il riepilogo del mattino?', 'Il calcolo degli orari non usa mai l’AI. All’AI non vanno nomi, telefoni o dati clinici. C’è un tetto di spesa giornaliero.', [
    ['si', 'Sì, con un tetto di 5 € al giorno', 'Serve la vostra chiave OpenAI', 1], ['no', 'No, solo regole fisse', 'Le disponibilità si compilano a mano o con le frasi più semplici', 0]]],
  ['liste_attesa', 'Prenotazioni', 'Quando si libera un posto, la lista d’attesa…', '', [
    ['semi', 'Propone alla segreteria chi chiamare', 'La segreteria conferma', 1], ['auto', 'Scrive da sola al primo in lista', 'Il paziente ha 12 ore per rispondere', 0], ['manuale', 'Resta un elenco da consultare', '', 0]]],
  ['prenota_online', 'Prenotazioni', 'Le visite prenotate online…', 'La pagina pubblica chiede un codice ricevuto sul telefono per evitare prenotazioni false.', [
    ['approvazione', 'Aspettano l’approvazione della segreteria', 'Nessuna sorpresa in agenda', 1], ['automatica', 'Si confermano da sole', '', 0], ['no_v1', 'Non le attiviamo ora', '', 0]]],
  ['fatture_sdi', 'Fatturazione', 'Come arrivano le fatture elettroniche al Sistema di Interscambio?', '', [
    ['commercialista', 'Le XML vanno ogni settimana alla commercialista', 'Come da brief', 1], ['diretto', 'Le trasmettiamo noi direttamente', 'Serve un canale accreditato: lo valutiamo', 0], ['entrambi', 'Prima alla commercialista, poi valutiamo', '', 0]]],
  ['bollo', 'Fatturazione', 'Marca da bollo da 2 € sopra 77,47 €: a carico di…', 'Si può cambiare per singola fattura.', [
    ['paziente', 'Paziente', '', 1], ['struttura', 'Struttura', '', 0]]],
  ['sts', 'Fatturazione', 'Invio delle spese sanitarie al Sistema Tessera Sanitaria', 'Per i pazienti che si oppongono, la spesa non va inviata.', [
    ['export', 'Prepariamo il file e lo carica la commercialista', '', 1], ['diretto', 'Invio diretto dal gestionale', 'Richiede credenziali e accreditamento', 0], ['dopo', 'Dopo la prima versione', '', 0]]],
  ['pacchetti', 'Fatturazione', 'Si vendono pacchetti di sedute prepagati?', '', [
    ['si', 'Sì', 'Il sistema scala le sedute man mano', 1], ['no', 'No, si paga seduta per seduta', '', 0], ['entrambi', 'Entrambi', '', 0]]],
  ['firma', 'Documenti', 'Come si firmano consensi e moduli?', '', [
    ['otp', 'Con un codice ricevuto sul telefono', 'Più semplice, lascia prova con data e impronta del documento', 1], ['grafica', 'Con firma disegnata su tablet', '', 0], ['carta', 'Su carta, poi si carica la scansione', '', 0]]],
  ['ore', 'Personale', 'Il tempo di preparazione conta come ora lavorata?', '', [
    ['no', 'No, contano solo le sedute', '', 1], ['si', 'Sì, con minuti fissi per ogni seduta', 'Si imposta il numero di minuti', 0]]],
  ['dati_vecchi', 'Avvio', 'Avete già i pazienti in un altro programma o in Excel?', 'L’importatore prepara una anteprima prima di scrivere qualsiasi cosa.', [
    ['excel', 'Sì, in Excel/CSV', 'Li importiamo con controllo dei doppioni', 1], ['programma', 'Sì, in un altro gestionale', 'Chiediamo l’esportazione', 0], ['no', 'No, si parte da zero', '', 0]]],
  ['hosting', 'Avvio', 'Dove viene messo online?', 'Serve PHP 8.2 e un dominio con HTTPS. I dati stanno fuori dalla cartella pubblica.', [
    ['condiviso', 'Hosting condiviso già in uso', 'Ci serve l’accesso per l’installazione', 1], ['vps', 'Un server dedicato (VPS)', '', 0], ['da_scegliere', 'Da scegliere', 'Vi consigliamo noi', 0]]],
  ['tariffe', 'Avvio', 'Chi fornisce listino prezzi e tipi di terapia definitivi?', 'Oggi ci sono 15 terapie di esempio con tariffa 0.', [
    ['titolare', 'Il titolare entro questa settimana', '', 1], ['segreteria', 'La segreteria', '', 0], ['insieme', 'Li facciamo insieme in una sessione', '', 0]]],
];
const KEY = 'poli-decisioni-v1';
let A = {};
try { A = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { A = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(A)); } catch (e) { /* ignore */ } };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function draw() {
  let last = '', html = '';
  Q.forEach(([id, g, dom, why, opts]) => {
    if (g !== last) { html += `<h2 class="group">${esc(g)}</h2>`; last = g; }
    const cur = A[id] || {};
    html += `<div class="q"><h3>${esc(dom)}</h3>${why ? `<p class="why">${esc(why)}</p>` : ''}` + opts.map(([v, l, d, rec]) =>
      `<label class="opt ${cur.v === v ? 'sel' : ''}"><input type="radio" name="${id}" value="${v}" ${cur.v === v ? 'checked' : ''}><span>${esc(l)}${rec ? '<span class="rec">consigliata</span>' : ''}${d ? `<small>${esc(d)}</small>` : ''}</span></label>`).join('')
      + `<label class="opt ${cur.v === '_altro' ? 'sel' : ''}"><input type="radio" name="${id}" value="_altro" ${cur.v === '_altro' ? 'checked' : ''}><span>Altro:<input class="other" data-o="${id}" value="${esc(cur.t || '')}" placeholder="Scrivete la vostra scelta"></span></label></div>`;
  });
  document.getElementById('qs').innerHTML = html;
  progress();
}
function progress() { const n = Q.filter((q) => A[q[0]] && A[q[0]].v && (A[q[0]].v !== '_altro' || A[q[0]].t)).length; document.getElementById('prog').textContent = `Risposte: ${n} su ${Q.length}`; }
document.getElementById('qs').addEventListener('change', (e) => { if (e.target.type === 'radio') { A[e.target.name] = { v: e.target.value, t: (A[e.target.name] || {}).t || '' }; save(); draw(); } });
document.getElementById('qs').addEventListener('input', (e) => { const id = e.target.dataset.o; if (id) { A[id] = { v: '_altro', t: e.target.value }; save(); progress(); } });
function summary() {
  return 'DECISIONI — Gestionale Poliambulatorio\n\n' + Q.map(([id, g, dom, , opts]) => { const a = A[id]; let r = 'DA DECIDERE';
    if (a && a.v === '_altro') r = 'Altro: ' + (a.t || '—'); else if (a) r = (opts.find((o) => o[0] === a.v) || [0, '—'])[1];
    return `[${g}] ${dom}\n  → ${r}`; }).join('\n');
}
document.getElementById('copy').onclick = async () => { try { await navigator.clipboard.writeText(summary()); alert('Riepilogo copiato.'); } catch (e) { prompt('Copia il riepilogo:', summary()); } };
document.getElementById('print').onclick = () => window.print();
document.getElementById('reset').onclick = () => { if (confirm('Cancellare tutte le risposte?')) { A = {}; save(); draw(); } };
draw();
