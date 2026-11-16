'use strict';
const MODULI = [
  ['1', 'Fondamenta', 'ok', 'Accesso con password forte e verifica in due passaggi, ruoli e permessi modificabili, registro attività a prova di manomissione, impostazioni, copie di sicurezza cifrate, primo avvio con link monouso.', 'Motore provato con test (accessi, blocchi, copie, ripristino). Schermate di impostazioni: da fare.'],
  ['2', 'Pazienti e percorsi', 'ok', 'Anagrafica con controllo del codice fiscale e dei doppioni, consensi, percorsi di cura con più terapie e fasce di disponibilità, avanzamento sedute, dati clinici cifrati e nascosti a chi non deve vederli.', 'Motore provato. In demo: elenco, scheda, avanzamento.'],
  ['3', 'Agenda', 'part', 'Appuntamenti, gruppi, conflitti che bloccano e avvisi da confermare, assenze che liberano lo slot, numerazione sedute (prima/ultima), copia settimana con motivi di esclusione, statistiche.', 'Motore provato. In demo: vista settimanale, dettaglio, copia settimana, statistiche. Mancano: trascinamento, vista giornaliera mobile, colori configurabili da schermata.'],
  ['4', 'Pianificazione intelligente', 'part', 'Calcola da solo gli orari delle sedute mancanti rispettando fasce, terapista, frequenza e risorse; se serve sposta altri pazienti dentro le loro fasce; spiega le scelte; si approva con un clic, tutto o niente. Legge disponibilità scritte a parole.', 'Motore provato (stessa richiesta = stessa proposta). Da fare: proposte per gli slot che si liberano e collegamento alla lista d’attesa. L’AI è pronta ma non ancora collegata alla vostra chiave.'],
  ['5', 'Comunicazioni', 'part', 'Un’unica porta per WhatsApp, SMS ed email: canale e consensi rispettati, coda con nuovi tentativi, orari di silenzio, modalità prova, tetto di spesa. Promemoria del venerdì con link personale; variazioni raccolte in un solo messaggio.', 'Provato con un finto Composio. Da fare: prima chiamata vera, follow-up e recensioni, scadenze annuali, campagne e rubrica, ricezione risposte.'],
  ['6', 'Fatturazione', 'part', 'Fatture e pacchetti, bollo, XML FatturaPA, invio settimanale alla commercialista, esportazione per il Sistema Tessera Sanitaria, compensi e statistiche.', 'Motore pronto e provato: numerazione senza buchi anche con emissioni simultanee, bollo, XML controllato con lo schema ufficiale dell’Agenzia delle Entrate, note di credito, fattura di cortesia PDF, archivio ZIP, export TS, compensi con percentuali e statistiche. Mancano le schermate, l’invio automatico alla commercialista e i pacchetti.'],
  ['7', 'Prenotazioni online e liste d’attesa', 'todo', 'Pagina pubblica per prenotare visite con codice di verifica, liste d’attesa che offrono i posti liberi.', 'Non iniziato.'],
  ['8', 'Documenti e firme', 'todo', 'Modelli, PDF, referti, firma con codice ricevuto sul telefono, avvisi sui consensi mancanti.', 'Non iniziato.'],
  ['9', 'Personale e ore', 'todo', 'Presenze, assenze, certificati, riepilogo mensile per il consulente, ore del terapista confrontate con il contratto.', 'Non iniziato.'],
  ['10', 'Magazzino', 'todo', 'Giacenze, consumi per terapia, soglie di riordino.', 'Non iniziato.'],
  ['11', 'Importazione, stato del sistema, extra', 'todo', 'Importazione da Excel/CSV, pagina «Stato del sistema», check-in, «la mia giornata», ricerca rapida, preventivi.', 'Solo l’endpoint di stato del sistema è fatto.'],
  ['★', 'Applicazione finale', 'todo', 'Tutte le schermate per tutti i ruoli, telefono e computer, chiaro e scuro, in italiano semplice.', 'Oggi c’è una console di dimostrazione provvisoria, non la grafica definitiva.'],
];
const LABEL = { ok: 'Motore pronto', part: 'In corso', todo: 'Da fare' };
const c = { ok: 0, part: 0, todo: 0 };
MODULI.forEach((m) => c[m[2]]++);
document.getElementById('sum').innerHTML = `<div><b>${c.ok}</b>motori pronti</div><div><b>${c.part}</b>in corso</div><div><b>${c.todo}</b>da fare</div>`;
document.getElementById('mods').innerHTML = MODULI.map(([n, t, s, cosa, stato]) => `<div class="mod"><div class="n">${n}</div><div><h3>${t}</h3><p>${cosa}</p><p><b>Oggi:</b> ${stato}</p></div><span class="st ${s}">${LABEL[s]}</span></div>`).join('');
const R = ['Titolare', 'Segreteria', 'Fisioterapista', 'Medico', 'Amministrazione'];
const P = [
  ['Vedere tutta l’agenda', [1, 1, 0, 0, 0]], ['Vedere la propria agenda', [1, 1, 1, 1, 0]], ['Creare e spostare appuntamenti', [1, 1, 0, 0, 0]], ['Segnare una seduta eseguita', [1, 1, 1, 1, 0]],
  ['Anagrafica di tutti i pazienti', [1, 1, 0, 0, 0]], ['Solo i propri pazienti', [1, 0, 1, 1, 0]], ['Diagnosi e dati clinici', [1, 0, 0, 1, 0]], ['Note terapeutiche', [1, 0, 1, 1, 0]],
  ['Pianificazione intelligente', [1, 1, 0, 0, 0]], ['Inviare messaggi', [1, 1, 0, 0, 0]], ['Fatture', [1, 1, 0, 0, 1]], ['Compensi di tutti', [1, 1, 0, 0, 1]], ['Impostazioni, utenti, registro', [1, 0, 0, 0, 0]],
];
document.getElementById('perm').innerHTML = `<thead><tr><th>Permesso</th>${R.map((r) => `<th>${r}</th>`).join('')}</tr></thead><tbody>${P.map(([n, v]) => `<tr><td>${n}</td>${v.map((x) => `<td class="${x ? 'yes' : 'no'}">${x ? '✓' : '—'}</td>`).join('')}</tr>`).join('')}</tbody>`;
