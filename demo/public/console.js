'use strict';
const $ = (s, r = document) => r.querySelector(s);
const state = { user: null, csrf: null, tab: 'agenda', week: null, cat: null, filtro: '' };
const TIPI = { terapia: 'Terapia', visita: 'Visita', gruppo: 'Gruppo', nota: 'Nota' };
const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MSG = {
  non_autorizzato: 'Non hai il permesso per questa operazione.', credenziali: 'Email o password non corrette.', proposta_obsoleta: 'L’agenda è cambiata dopo la proposta: ne serve una nuova.',
  conflitto: 'Conflitto: lo spazio è già occupato.', avvisi: 'Ci sono avvisi da confermare.', proposta_gia_chiusa: 'Questa proposta è già stata chiusa.', csrf: 'Sessione scaduta, accedi di nuovo.',
};

async function api(path, body = {}) {
  const r = await fetch('/api' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(state.csrf ? { 'X-CSRF-Token': state.csrf } : {}) }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ ok: false, error: 'errore_rete' }));
  if (!j.ok) { const e = new Error(MSG[j.error] || j.error || 'Errore'); e.code = j.error; e.payload = j; throw e; }
  return j.data;
}
function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 3500); }
const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const monday = (s) => { const d = new Date(s + 'T12:00:00'); const w = (d.getDay() + 6) % 7; return addDays(s, -w); };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function loginView() {
  $('#top').hidden = true; $('#bar').hidden = true;
  $('#app').innerHTML = `<div class="auth"><div class="auth-side"><h1>Poliambulatorio<br>Rizzo</h1><p>Agenda, percorsi di cura, promemoria ai pazienti, fatture: tutto in un posto, senza doppi inserimenti.</p>
   <ul><li>Pianificazione automatica delle sedute</li><li>Promemoria WhatsApp del venerdì</li><li>Fatture elettroniche pronte per la commercialista</li></ul></div>
   <form class="auth-form" id="lf"><h2>Bentornato</h2><p class="muted">Accedi con il tuo account.</p>
   <label class="fld"><span>Accedi come</span><select id="u"><option value="titolare@demo.it">Titolare — Dott. Antonio Rizzo</option><option value="segreteria@demo.it">Segreteria — Giulia Esposito</option>
   <option value="fisio@demo.it">Fisioterapista — Marco Bianchi</option><option value="medico@demo.it">Medico — Dott.ssa Lucia Neri</option></select></label>
   <label class="fld"><span>Password</span><input id="p" type="password" value="DemoPassword2026" autocomplete="current-password"></label>
   <button class="btn primary big">Entra</button><a class="muted small" href="#">Password dimenticata?</a>
   <div class="note">Ambiente dimostrativo: dati inventati, messaggi in modalità prova.</div></form></div>`;
  $('#lf').onsubmit = async (e) => { e.preventDefault(); const btn = $('#lf button'); btn.disabled = true; btn.textContent = 'Accesso…'; try { const d = await api('/auth/login', { email: $('#u').value, password: $('#p').value }); state.user = d; state.csrf = d.csrf; await boot(); } catch (x) { toast(x.message); btn.disabled = false; btn.textContent = 'Entra'; } };
}
async function boot() {
  const c = await api('/catalogo/elenco'); state.cat = c; state.pro = Object.fromEntries(c.professionisti.map((p) => [p.id, p])); state.ter = Object.fromEntries(c.terapie.map((t) => [t.id, t]));
  state.week = monday(today());
  $('#top').hidden = false;
  const can = (p) => state.user.permessi.includes(p);
  $('#bar').hidden = false;
  $('#me').textContent = (state.user.name || state.user.nome || '') + ' · ' + (state.user.role || state.user.ruolo || '');
  const items = [['Operativo'], ['agenda', '▦', 'Agenda'], ['pazienti', '☺', 'Pazienti']];
  if (can('messaggi.invia')) items.push(['messaggi', '✉', 'Comunicazioni']);
  if (can('agenda.vedi_tutto')) items.push(['stat', '▤', 'Statistiche agenda']);
  items.push(['assistente', '✦', 'Assistente AI']);
  items.push(['Amministrazione']);
  if (can('fatture.gestisci')) items.push(['fatture', '€', 'Fatturazione']);
  items.push(['s:compensi', '%', 'Compensi', 1], ['s:prenotazioni', '⌚', 'Prenotazioni online', 1], ['s:attesa', '☰', 'Liste d’attesa', 1]);
  items.push(['Account'], ['profilo', '◉', 'Profilo']);
  if (can('impostazioni.gestisci')) items.push(['impostazioni', '⚙', 'Impostazioni']);
  items.push(['Struttura'], ['s:documenti', '✎', 'Documenti e firme', 1], ['s:personale', '⚇', 'Personale e ore', 1], ['s:magazzino', '▣', 'Magazzino', 1], ['s:import', '⇪', 'Importazione', 1], ['s:sistema', '⚙', 'Stato del sistema', 1]);
  $('#nav').innerHTML = items.map((x) => x.length === 1 ? `<div class="grp">${x[0]}</div>` : `<button data-t="${x[0]}" data-l="${x[2]}"><span>${x[1]}</span>${x[2]}${x[3] ? '<span class="soon">presto</span>' : ''}</button>`).join('');
  $('#nav').onclick = (e) => { const b = e.target.closest('button'); if (b) { state.tab = b.dataset.t; $('#top').classList.remove('open'); render(); } };
  $('#burger').onclick = () => $('#top').classList.toggle('open');
  $('#logout').onclick = async () => { await api('/auth/logout').catch(() => {}); state.user = null; state.csrf = null; loginView(); };
  render();
}
function render() {
  document.querySelectorAll('#nav button').forEach((b) => b.setAttribute('aria-current', b.dataset.t === state.tab));
  const b = document.querySelector(`#nav button[data-t="${state.tab}"]`); $('#ttl').textContent = b ? b.dataset.l : '';
  if (state.tab.startsWith('s:')) { soonView(state.tab.slice(2)); return; }
  ({ agenda: agendaView, pazienti: pazientiView, messaggi: messaggiView, stat: statView, profilo: profiloView, impostazioni: impostazioniView, fatture: fattureView, assistente: assistenteView })[state.tab]().catch((e) => toast(e.message));
}

// ---------------------------------------------------------------- agenda
async function agendaView() {
  const from = state.week, to = addDays(from, 5);
  const d = await api('/agenda/vista', { da: from, a: to, annullati: true, ...(state.filtro ? { professional_id: state.filtro } : {}) });
  const START = 8 * 60, PX = 2.4;
  const cols = GIORNI.map((g, i) => { const dt = addDays(from, i); return { dt, g, ev: d.appuntamenti.filter((a) => a.start.startsWith(dt)) }; });
  const pros = state.cat.professionisti;
  const MES = ['', 'gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const lbl = `${+from.slice(8)}${from.slice(5, 7) !== to.slice(5, 7) ? ' ' + MES[+from.slice(5, 7)] : ''} – ${+to.slice(8)} ${MES[+to.slice(5, 7)]} ${to.slice(0, 4)}`;
  $('#app').innerHTML = `<div class="atb">
   <div class="wk"><button id="prev" aria-label="Settimana precedente">‹</button><span>${lbl}</span><button id="next" aria-label="Settimana successiva">›</button></div>
   <button class="btn ghost" id="oggi">Oggi</button><span class="spacer"></span>
   <select id="fp" class="sel" aria-label="Professionista"><option value="">Tutti i professionisti</option>${pros.map((p) => `<option value="${p.id}" ${state.filtro === p.id ? 'selected' : ''}>${h(p.nome)} ${h(p.cognome)}</option>`).join('')}</select>
   ${state.user.permessi.includes('agenda.modifica') ? '<button class="btn primary" id="copia">Copia settimana</button>' : ''}</div>
   <div class="legend">${pros.map((p) => `<span><i style="background:${p.colore || '#7a8591'}"></i>${h(p.nome)} ${h(p.cognome)}</span>`).join('')}</div>
   <div class="week"><div class="hours"><h3 style="visibility:hidden">.</h3>${Array.from({ length: 13 }, (_, i) => `<span style="top:${34 + i * 60 * PX}px">${8 + i}:00</span>`).join('')}</div>
   ${cols.map((c) => `<div class="col ${c.dt === today() ? 'today' : ''}"><h3>${c.g} ${c.dt.slice(8)}</h3>${lanes(c.ev).map(({ a, lane, of }) => {
     const s = Number(a.start.slice(11, 13)) * 60 + Number(a.start.slice(14, 16)), e = Number(a.end.slice(11, 13)) * 60 + Number(a.end.slice(14, 16));
     const names = Object.values(a.pazienti_nomi || {}), pn = names.length > 1 ? names[0] + ' +' + (names.length - 1) : names[0];
     return `<button class="ev ${a.stato}" data-id="${a.id}" style="top:${34 + (s - START) * PX}px;height:${Math.max(20, (e - s) * PX - 1)}px;left:calc(${lane * 100 / of}% + 2px);width:calc(${100 / of}% - 4px);right:auto;--c:${(state.pro[a.professional_id] || {}).colore || '#7a8591'}"><b>${h(pn || a.nota || TIPI[a.tipo])}</b><small>${a.start.slice(11, 16)}–${(a.end || '').slice(11, 16)} · ${h((state.ter[a.therapy_type_id] || {}).nome || '')}</small></button>`;
   }).join('')}</div>`).join('')}</div>`;
  $('#prev').onclick = () => { state.week = addDays(from, -7); render(); }; $('#next').onclick = () => { state.week = addDays(from, 7); render(); };
  $('#oggi').onclick = () => { state.week = monday(today()); render(); };
  $('#fp').onchange = (e) => { state.filtro = e.target.value; render(); };
  $('#copia')?.addEventListener('click', () => copiaSettimana(from));
  $('.week').onclick = (e) => { const b = e.target.closest('.ev'); if (b) dettaglioAppuntamento(d.appuntamenti.find((a) => a.id === b.dataset.id)); };
}
function lanes(evs) {
  const list = [...evs].sort((x, y) => x.start.localeCompare(y.start)), out = [], ends = [];
  list.forEach((a) => { let i = ends.findIndex((e) => e <= a.start); if (i < 0) { i = ends.length; ends.push(a.end); } else ends[i] = a.end; out.push({ a, lane: i }); });
  // larghezza: numero di corsie dell'insieme di appuntamenti sovrapposti
  out.forEach((o) => { o.of = Math.max(...out.filter((q) => q.a.start < o.a.end && o.a.start < q.a.end).map((q) => q.lane + 1)); });
  return out;
}
function dettaglioAppuntamento(a) {
  const dlg = document.createElement('dialog');
  const can = state.user.permessi;
  dlg.innerHTML = `<h3>${h((state.ter[a.therapy_type_id] || {}).nome || TIPI[a.tipo])}</h3><p>${a.start.slice(8, 10)}/${a.start.slice(5, 7)} · ${a.start.slice(11, 16)}–${a.end.slice(11, 16)}<br>
   ${h(Object.values(a.pazienti_nomi || {}).join(', '))}<br>Con ${h((state.pro[a.professional_id] || {}).nome || '—')} ${h((state.pro[a.professional_id] || {}).cognome || '')}
   <br><span class="chip">${a.stato}</span> ${(a.segnali || []).map((s) => `<span class="tag">${s.numero || '?'}/${s.previste || '?'}${s.prima ? ' · prima' : ''}${s.ultima ? ' · ultima' : ''}</span>`).join(' ')}</p>
   <div class="row">${can.includes('agenda.segna_eseguita') ? '<button class="btn" data-a="eseguito">Eseguita</button><button class="btn" data-a="assente">Assente</button>' : ''}
   ${can.includes('agenda.modifica') ? '<button class="btn danger" data-a="annulla">Annulla</button>' : ''}<button class="btn" data-a="x">Chiudi</button></div>`;
  document.body.append(dlg); dlg.showModal();
  dlg.onclick = async (e) => { const b = e.target.closest('button'); if (!b) return; const act = b.dataset.a; try {
    if (act === 'annulla') await api('/agenda/annulla', { id: a.id }); else if (act !== 'x') await api('/agenda/stato', { id: a.id, stato: act });
    dlg.close(); dlg.remove(); render(); } catch (x) { toast(x.message); dlg.close(); dlg.remove(); } };
}
async function copiaSettimana(from) {
  const pv = await api('/agenda/copia-anteprima', { settimana: from });
  const dlg = document.createElement('dialog');
  const MOT = { sedute_esaurite: 'ciclo finito', gia_copiato: 'già copiato', festivo_o_chiusura: 'giorno festivo o chiuso', professionista_assente: 'terapista assente', episodio_chiuso: 'percorso chiuso', episodio_sospeso: 'percorso sospeso', riga_completata: 'terapia completata' };
  dlg.innerHTML = `<h3>Copia nella settimana successiva</h3><p><b>${pv.copiati.length}</b> appuntamenti da copiare, <b>${pv.esclusi.length}</b> esclusi, <b>${pv.conflitti.length}</b> in conflitto.</p>
   ${pv.esclusi.length ? '<details><summary>Perché sono esclusi</summary><ul>' + pv.esclusi.slice(0, 15).map((x) => `<li>${x.start.slice(5, 10)} ${x.start.slice(11, 16)} — ${MOT[x.motivo] || x.motivo}</li>`).join('') + '</ul></details>' : ''}
   <div class="row"><button class="btn primary" data-a="ok">Copia ora</button><button class="btn" data-a="x">Annulla</button></div>`;
  document.body.append(dlg); dlg.showModal();
  dlg.onclick = async (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'ok') { const r = await api('/agenda/copia-applica', { settimana: from }); toast(`Creati ${r.creati} appuntamenti`); state.week = addDays(from, 7); }
    dlg.close(); dlg.remove(); render(); };
}

// ---------------------------------------------------------------- pazienti e pianificazione
async function pazientiView() {
  const r = await api('/pazienti/cerca', { q: '', limite: 200 });
  const canEdit = state.user.permessi.includes('pazienti.anagrafica');
  $('#app').innerHTML = `<div class="pz"><div class="pz-list card"><div class="pz-head"><input id="q" type="search" placeholder="Cerca nome, telefono, CF…">${canEdit ? '<button class="btn primary" id="nuovo">+ Nuovo</button>' : ''}</div><div id="lista"></div></div>
   <div class="pz-detail" id="scheda"><div class="empty">Seleziona un paziente oppure creane uno nuovo.</div></div></div>`;
  const tel = (t) => (t || '').replace(/^\+39/, '').replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
  const draw = (rows) => { $('#lista').innerHTML = rows.length ? rows.map((p) => `<button class="pz-item ${state.pz === p.id ? 'on' : ''}" data-id="${p.id}"><span class="ini">${h((p.cognome || '?')[0] + (p.nome || '?')[0])}</span><span><b>${h(p.cognome)} ${h(p.nome)}</b><small>${h(tel(p.telefono))}</small></span></button>`).join('') : '<div class="empty">Nessun risultato.</div>'; };
  draw(r.risultati);
  let t; $('#q').oninput = (e) => { clearTimeout(t); t = setTimeout(async () => draw((await api('/pazienti/cerca', { q: e.target.value, limite: 200 })).risultati), 200); };
  $('#lista').onclick = (e) => { const b = e.target.closest('[data-id]'); if (b) { state.pz = b.dataset.id; document.querySelectorAll('.pz-item').forEach((x) => x.classList.toggle('on', x === b)); scheda(b.dataset.id); } };
  if ($('#nuovo')) $('#nuovo').onclick = () => formPaziente(null);
  if (state.pz) scheda(state.pz).catch(() => {});
}
const CANALI = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email', nessuno: 'Nessuno' };
const telf = (t) => (t || '').replace(/^\+39/, '').replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
const itd = (d) => d ? d.split('-').reverse().join('/') : '—';
async function scheda(id, tab) {
  const p = await api('/pazienti/dettaglio', { id }); state.pzTab = tab || state.pzTab || 'anagrafica';
  const can = state.user.permessi; const cs = p.consensi || {};
  const kv = (l, v) => `<div class="kv"><span>${l}</span><b>${v || '—'}</b></div>`;
  const tabs = [['anagrafica', 'Anagrafica'], ['percorsi', `Percorsi (${(p.episodi || []).length})`]];
  let body = '';
  if (state.pzTab === 'anagrafica') {
    body = `<div class="card"><h3>Dati personali</h3><div class="kvs">${kv('Codice fiscale', h(p.codice_fiscale))}${kv('Data di nascita', itd(p.data_nascita))}${kv('Luogo di nascita', h(p.luogo_nascita))}${kv('Sesso', h(p.sesso))}${kv('Medico curante', h(p.medico_curante))}</div></div>
     <div class="card"><h3>Contatti</h3><div class="kvs">${kv('Telefono', h(telf(p.telefono)))}${kv('Email', h(p.email))}${kv('Canale preferito', CANALI[p.canale_preferito] || '')}${kv('Indirizzo', h([p.indirizzo, p.cap, p.citta, p.provincia && '(' + p.provincia + ')'].filter(Boolean).join(' ')))}</div></div>
     <div class="card"><h3>Consensi</h3><div class="cons">${[['privacy', 'Privacy'], ['whatsapp', 'WhatsApp'], ['marketing', 'Marketing'], ['sts_opposizione', 'Opposizione Sistema TS']].map(([k, l]) => `<span class="chip ${cs[k] && cs[k].valore ? 'yes' : 'no'}">${cs[k] && cs[k].valore ? '✓' : '✕'} ${l}${cs[k] && cs[k].data ? ' · ' + itd(cs[k].data) : ''}</span>`).join('')}</div></div>
     ${p.anamnesi !== undefined ? `<div class="card"><h3>Dati clinici</h3><div class="kvs">${kv('Anamnesi', h(p.anamnesi))}${kv('Allergie', h(p.allergie))}</div></div>` : ''}
     ${p.note_amministrative ? `<div class="card"><h3>Note</h3><p>${h(p.note_amministrative)}</p></div>` : ''}`;
  } else {
    body = (p.episodi || []).map((e) => `<div class="card"><div class="row"><h3 style="margin:0">${h(e.titolo)}</h3><span class="chip">${h(e.stato)}</span></div>${e.diagnosi ? `<p class="muted">Diagnosi: ${h(e.diagnosi)}</p>` : ''}
    ${(e.avanzamento || []).map((l) => `<div class="prog"><span>${h((state.ter[l.therapy_type_id] || {}).nome || '')}</span>
      <div class="bar"><div style="width:${Math.min(100, Math.round(l.eseguite / l.sedute_previste * 100))}%"></div></div>
      <small class="muted">${l.eseguite} fatte · ${l.programmate} in agenda · ${l.residue} da pianificare</small></div>`).join('')}
    ${can.includes('ai.pianificazione') && e.avanzamento.some((l) => l.residue > 0) ? `<button class="btn primary" data-plan="${e.id}">Pianifica le sedute mancanti</button>` : ''}</div>`).join('') || '<div class="empty">Nessun percorso.</div>';
  }
  $('#scheda').innerHTML = `<div class="pz-top card"><span class="ini big">${h(p.cognome[0] + p.nome[0])}</span><div><h2>${h(p.cognome)} ${h(p.nome)}</h2><span class="muted">${p.data_nascita ? itd(p.data_nascita) + ' · ' : ''}${h(telf(p.telefono))}</span></div><span class="spacer"></span>
     ${can.includes('pazienti.anagrafica') ? '<button class="btn" id="mod">Modifica</button>' : ''}</div>
     <div class="seg">${tabs.map(([k, l]) => `<button data-pt="${k}" aria-current="${k === state.pzTab}">${l}</button>`).join('')}</div>${body}`;
  $('#scheda').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.plan) pianifica(b.dataset.plan); if (b.dataset.pt) scheda(id, b.dataset.pt); if (b.id === 'mod') formPaziente(p); };
}
function formPaziente(p) {
  const v = p || { canale_preferito: 'whatsapp', consensi: {} }; const cs = v.consensi || {};
  const f = (k, l, type = 'text', extra = '') => `<label class="fld"><span>${l}</span><input name="${k}" type="${type}" value="${h(v[k] || '')}" ${extra}></label>`;
  $('#scheda').innerHTML = `<form class="card" id="pf"><div class="row"><h2 style="margin:0">${p ? 'Modifica ' + h(p.cognome + ' ' + p.nome) : 'Nuovo paziente'}</h2></div>
   <h4>Dati personali</h4><div class="grid2">${f('nome', 'Nome *', 'text', 'required')}${f('cognome', 'Cognome *', 'text', 'required')}${f('codice_fiscale', 'Codice fiscale (compila nascita e sesso da solo)', 'text', 'maxlength="16" style="text-transform:uppercase"')}${f('data_nascita', 'Data di nascita', 'date')}${f('luogo_nascita', 'Luogo di nascita')}
     <label class="fld"><span>Sesso</span><select name="sesso"><option value="">—</option><option ${v.sesso === 'M' ? 'selected' : ''}>M</option><option ${v.sesso === 'F' ? 'selected' : ''}>F</option></select></label>${f('medico_curante', 'Medico curante')}</div>
   <h4>Contatti</h4><div class="grid2">${f('telefono', 'Cellulare', 'tel')}${f('email', 'Email', 'email')}
     <label class="fld"><span>Canale preferito</span><select name="canale_preferito">${Object.entries(CANALI).map(([k, l]) => `<option value="${k}" ${v.canale_preferito === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
     ${f('indirizzo', 'Indirizzo')}${f('cap', 'CAP', 'text', 'maxlength="5"')}${f('citta', 'Città')}${f('provincia', 'Provincia', 'text', 'maxlength="2"')}</div>
   <h4>Consensi</h4><div class="cons">${[['privacy', 'Privacy'], ['whatsapp', 'Messaggi WhatsApp'], ['marketing', 'Comunicazioni promozionali'], ['sts_opposizione', 'Opposizione all’invio al Sistema TS']].map(([k, l]) => `<label class="fld chk"><input type="checkbox" data-c="${k}" ${cs[k] && cs[k].valore ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
   ${state.user.permessi.includes('pazienti.clinica') ? `<h4>Dati clinici</h4><div class="grid2"><label class="fld"><span>Anamnesi</span><textarea name="anamnesi" rows="3">${h(v.anamnesi || '')}</textarea></label><label class="fld"><span>Allergie</span><textarea name="allergie" rows="3">${h(v.allergie || '')}</textarea></label></div>` : ''}
   <label class="fld"><span>Note amministrative</span><textarea name="note_amministrative" rows="2">${h(v.note_amministrative || '')}</textarea></label>
   <div class="row"><button class="btn primary">${p ? 'Salva modifiche' : 'Crea paziente'}</button><button type="button" class="btn" id="ann">Annulla</button></div></form>`;
  $('#ann').onclick = () => (p ? scheda(p.id) : pazientiView());
  $('#pf').onsubmit = async (e) => {
    e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target)); Object.keys(fd).forEach((k) => { if (fd[k] === '') fd[k] = null; });
    fd.consensi = {}; document.querySelectorAll('[data-c]').forEach((c) => (fd.consensi[c.dataset.c] = { valore: c.checked }));
    if (p) { fd.id = p.id; fd.revision = p.revision; }
    const send = async (force) => { const r = await api('/pazienti/salva', { ...fd, conferma_duplicato: force }); toast(p ? 'Modifiche salvate' : 'Paziente creato'); state.pz = r.id || (r.paziente || {}).id; await pazientiView(); };
    try { await send(false); } catch (x) {
      if (/duplicat/.test(x.code || '') && confirm('Esiste già un paziente simile. Crearlo comunque?')) { try { await send(true); } catch (y) { toast(y.message); } } else toast(x.message);
    }
  };
}
async function pianifica(episodeId) {
  const to = addDays(today(), 56);
  const pr = await api('/pianificazione/proponi', { episodi: [episodeId], da: today(), a: to });
  const dlg = document.createElement('dialog');
  dlg.innerHTML = `<h3>Proposta del pianificatore</h3><p>${h(pr.spiegazione.testo)}</p><p class="muted">Calcolata in ${pr.riepilogo.tempo_ms} ms, senza intelligenza artificiale: stessa richiesta, stessa risposta.</p>
   <ul style="max-height:40vh;overflow:auto">${pr.spiegazione.righe.map((r) => `<li>${h(r)}</li>`).join('')}</ul>
   <div class="row"><button class="btn primary" data-a="ok" ${pr.riepilogo.sedute_nuove ? '' : 'disabled'}>Approva e metti in agenda</button><button class="btn" data-a="no">Scarta</button></div>`;
  document.body.append(dlg); dlg.showModal();
  dlg.onclick = async (e) => { const b = e.target.closest('button'); if (!b) return; try {
    if (b.dataset.a === 'ok') { await api('/pianificazione/approva', { id: pr.id }); toast('Sedute messe in agenda'); } else await api('/pianificazione/scarta', { id: pr.id });
    } catch (x) { toast(x.message); } dlg.close(); dlg.remove(); render(); };
}

// ---------------------------------------------------------------- messaggi
async function messaggiView() {
  const [m, v] = await Promise.all([api('/comunicazioni/messaggi', {}), api('/comunicazioni/variazioni', {})]);
  $('#app').innerHTML = `<div class="card"><div class="row"><b>Modalità: ${m.modalita === 'test' ? 'PROVA (nessun messaggio esce davvero)' : h(m.modalita)}</b><span class="spacer"></span>
   <button class="btn" id="prom">Prepara promemoria della prossima settimana</button><button class="btn" id="coda">Elabora la coda</button></div>
   <p class="muted">Il promemoria parte da solo ogni venerdì alle 13:00. Qui puoi anche lanciarlo a mano.</p></div>
   ${v.variazioni.length ? `<div class="card"><h3>Variazioni di agenda da gestire</h3><table><tbody>${v.variazioni.map((x) => `<tr><td><b>${h(x.paziente)}</b> <span class="chip">${h(x.stato)}</span><br><span class="muted">${h((x.righe || []).join(' · '))}</span></td>
     <td>${x.stato === 'da_inviare' ? `<button class="btn primary" data-ok="${x.id}">Approva invio</button>` : ''}${x.stato === 'da_comunicare' ? `<button class="btn" data-done="${x.id}">Ho chiamato</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : ''}
   <div class="card"><h3>Registro messaggi (${m.totale})</h3><table><thead><tr><th>Quando</th><th>Paziente</th><th>Canale</th><th>Tipo</th><th>Stato</th><th>Testo</th></tr></thead><tbody>
   ${m.messaggi.map((x) => `<tr><td>${h((x.created_at || '').replace('T', ' ').slice(5, 16))}</td><td>${h(x.paziente || '')}</td><td>${h(x.channel)}</td><td>${h(x.kind)}</td>
     <td><span class="chip ${x.status}">${h(x.status)}${x.simulato ? ' (prova)' : ''}</span>${x.error ? `<br><span class="muted">${h(x.error)}</span>` : ''}</td><td class="muted" style="white-space:pre-line;max-width:420px">${h(x.body)}</td></tr>`).join('')}</tbody></table></div>`;
  $('#prom').onclick = async () => { const r = await api('/comunicazioni/promemoria-esegui', {}); toast(`${r.accodati} promemoria in coda, ${r.gia_inviati} già fatti`); render(); };
  $('#coda').onclick = async () => { const r = await api('/comunicazioni/elabora', {}); toast(`Inviati ${r.inviati}, rinviati ${r.rinviati}, errori ${r.errori}`); render(); };
  $('#app').onclick = async (e) => { const ok = e.target.closest('[data-ok]'), dn = e.target.closest('[data-done]');
    if (ok) { await api('/comunicazioni/variazioni-approva', { ids: [ok.dataset.ok] }); render(); } if (dn) { await api('/comunicazioni/variazione-spunta', { id: dn.dataset.done }); render(); } };
}

// ---------------------------------------------------------------- statistiche
async function statView() {
  const from = state.week, to = addDays(from, 5);
  const s = await api('/agenda/statistiche', { da: from, a: to });
  const t = s.totali;
  $('#app').innerHTML = `<div class="row"><button class="btn" id="prev">‹</button><strong>Settimana dal ${from.slice(8)}/${from.slice(5, 7)}</strong><button class="btn" id="next">›</button></div>
   <div class="grid2"><div class="card"><h3>Totali</h3><p>Appuntamenti: <b>${t.programmati}</b> · eseguiti <b>${t.eseguiti}</b> · assenze <b>${t.assenti}</b> (${t.tasso_assenze}%)<br>Saturazione agenda: <b>${t.saturazione ?? 0}%</b></p></div>
   <div class="card"><h3>Terapie più fatte</h3>${s.terapie.map((x) => `<div>${h(x.nome)}: <b>${x.sedute}</b></div>`).join('') || '<span class="muted">Nessun dato</span>'}</div></div>
   <div class="card"><h3>Per professionista</h3><table><thead><tr><th>Nome</th><th>Saturazione</th><th>Appuntamenti</th><th>Assenze</th></tr></thead><tbody>${s.professionisti.map((p) => `<tr><td>${h(p.nome)}</td><td><div class="bar"><div style="width:${p.saturazione || 0}%"></div></div> ${p.saturazione ?? 0}%</td><td>${p.programmati}</td><td>${p.assenti}</td></tr>`).join('')}</tbody></table></div>`;
  $('#prev').onclick = () => { state.week = addDays(from, -7); render(); }; $('#next').onclick = () => { state.week = addDays(from, 7); render(); };
}
api('/auth/sessione').then(async (d) => { state.user = d; state.csrf = d.csrf; await boot(); }).catch(loginView);

const SOON = {
  fatture: ['Motore pronto e provato (91 test). Schermata in arrivo.', ['Righe proposte dalle sedute eseguite, mai fatturate due volte', 'Numerazione senza buchi, anche con emissioni simultanee', 'Bollo virtuale 2 € sopra 77,47 €', 'XML FatturaPA validato con lo schema ufficiale', 'Note di credito, PDF di cortesia, ZIP per la commercialista, export Sistema TS']],
  compensi: ['Motore pronto. Schermata in arrivo.', ['Percentuale per professionista e per tipo di prestazione', 'Eccezioni sulla singola seduta', 'Stati: calcolato → approvato → liquidato', 'Ogni professionista vede solo i propri']],
  prenotazioni: ['In sviluppo.', ['Pagina pubblica solo per le visite', 'Conferma con codice OTP', 'Nessuna doppia prenotazione dello stesso orario']],
  attesa: ['In sviluppo.', ['Lista per terapia e professionista', 'Proposta automatica quando si libera un posto']],
  documenti: ['Da sviluppare.', ['Modelli di consenso e privacy', 'PDF compilati con i dati del paziente', 'Firma con OTP e verifica hash']],
  personale: ['Da sviluppare.', ['Ore programmate ed effettive', 'Confronto con il contratto', 'Riepilogo mensile al consulente']],
  magazzino: ['Da sviluppare.', ['Articoli, scorte minime, consumi per seduta']],
  import: ['Da sviluppare.', ['Importazione pazienti da Excel/CSV con anteprima e controllo duplicati']],
  sistema: ['Parzialmente pronto (backup, audit, scheduler).', ['Pagina con stato di backup, coda messaggi, ultime esecuzioni automatiche']],
};
function soonView(k) {
  const [st, list] = SOON[k] || ['In arrivo.', []];
  $('#app').innerHTML = `<div class="card soonpage"><span class="pill">${h(st)}</span><h3 style="margin-top:14px">Cosa farà questo modulo</h3><ul>${list.map((x) => `<li>${h(x)}</li>`).join('')}</ul><p class="muted">Lo stato completo di ogni modulo è nella <a href="mappa.html" target="_blank">Mappa</a>.</p></div>`;
}

const RUOLI = ['titolare', 'segreteria', 'medico', 'fisioterapista', 'amministrazione'];
async function impostazioniView() {
  const st = await api('/impostazioni/leggi'); const v = st.valori; state.setTab = state.setTab || 'struttura';
  const tabs = [['struttura', 'Struttura'], ['ruoli', 'Ruoli e permessi'], ['utenti', 'Utenti'], ['orari', 'Orari'], ['messaggi', 'Messaggi'], ['fatturazione', 'Fatturazione'], ['ai', 'Intelligenza artificiale']];
  const head = `<div class="seg">${tabs.map(([k, l]) => `<button data-s="${k}" aria-current="${k === state.setTab}">${l}</button>`).join('')}</div>`;
  let body = '';
  const field = (sec, k, l, val) => `<label class="fld"><span>${l}</span><input data-sec="${sec}" data-k="${k}" value="${h(val ?? '')}"></label>`;
  if (state.setTab === 'struttura') {
    const s = v.struttura; body = `<div class="card"><h3>Dati della struttura</h3><p class="muted">Usati in fatture, messaggi e pagina pubblica.</p><div class="grid2">
      ${[['ragione_sociale', 'Ragione sociale'], ['partita_iva', 'Partita IVA'], ['codice_fiscale', 'Codice fiscale'], ['indirizzo', 'Indirizzo'], ['cap', 'CAP'], ['citta', 'Città'], ['provincia', 'Provincia'], ['telefono', 'Telefono'], ['email', 'Email'], ['pec', 'PEC'], ['sito', 'Sito web'], ['link_recensione', 'Link recensione Google']].map(([k, l]) => field('struttura', k, l, s[k])).join('')}
      </div><button class="btn primary" id="save">Salva</button></div>`;
  } else if (state.setTab === 'ruoli') {
    const cat = st.catalogo_permessi; const groups = {};
    Object.entries(cat).forEach(([k, [g, l]]) => (groups[g] = groups[g] || []).push([k, l]));
    body = `<div class="card"><h3>Ruoli e permessi</h3><p class="muted">Il titolare ha sempre tutti i permessi. Le modifiche valgono dal prossimo accesso.</p><div class="tblwrap"><table class="matrix"><thead><tr><th>Permesso</th>${RUOLI.map((r) => `<th>${r}</th>`).join('')}</tr></thead><tbody>
      ${Object.entries(groups).map(([g, list]) => `<tr class="g"><td colspan="6">${h(g)}</td></tr>` + list.map(([k, l]) => `<tr><td>${h(l)}<br><code>${k}</code></td>${RUOLI.map((r) => `<td><input type="checkbox" data-r="${r}" data-p="${k}" ${(v.ruoli[r] || []).includes(k) ? 'checked' : ''} ${r === 'titolare' ? 'disabled' : ''}></td>`).join('')}</tr>`).join('')).join('')}
      </tbody></table></div><button class="btn primary" id="saveR">Salva permessi</button></div>`;
  } else if (state.setTab === 'utenti') {
    const u = await api('/utenti/elenco');
    body = `<div class="card"><h3>Utenti (${u.length})</h3><table><thead><tr><th>Nome</th><th>Email</th><th>Ruolo</th><th>Stato</th><th>Due passaggi</th></tr></thead><tbody>${u.map((x) => `<tr><td><b>${h(x.name)}</b></td><td>${h(x.email)}</td><td><span class="chip">${h(x.role)}</span></td><td>${h(x.stato || (x.active === false ? 'disattivo' : 'attivo'))}</td><td>${x.totp_attivo || x.due_passi ? 'attivo' : '—'}</td></tr>`).join('')}</tbody></table></div>`;
  } else if (state.setTab === 'orari') {
    const G = ['', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    body = `<div class="card"><h3>Orari di apertura</h3><table><tbody>${Object.entries(v.orari).map(([d, f]) => `<tr><td><b>${G[d]}</b></td><td>${f.length ? f.map((x) => `<span class="chip">${x[0]}–${x[1]}</span>`).join(' ') : '<span class="muted">chiuso</span>'}</td></tr>`).join('')}</tbody></table></div>`;
  } else {
    const sec = v[state.setTab] || {};
    const rows = Object.entries(sec).filter(([, x]) => typeof x !== 'object' || x === null);
    body = `<div class="card"><h3>${h(tabs.find((t) => t[0] === state.setTab)[1])}</h3><div class="grid2">${rows.map(([k, x]) => typeof x === 'boolean' ? `<label class="fld chk"><input type="checkbox" data-sec="${state.setTab}" data-k="${k}" data-b="1" ${x ? 'checked' : ''}><span>${h(k.replace(/_/g, ' '))}</span></label>` : field(state.setTab, k, k.replace(/_/g, ' '), x)).join('')}</div><button class="btn primary" id="save">Salva</button></div>`;
  }
  $('#app').innerHTML = head + body;
  $('.seg').onclick = (e) => { const b = e.target.closest('button'); if (b) { state.setTab = b.dataset.s; impostazioniView(); } };
  const sv = $('#save'); if (sv) sv.onclick = async () => {
    const patch = {}; document.querySelectorAll('[data-sec]').forEach((i) => { const o = (patch[i.dataset.sec] = patch[i.dataset.sec] || {}); const old = v[i.dataset.sec][i.dataset.k]; o[i.dataset.k] = i.dataset.b ? i.checked : (typeof old === 'number' ? Number(i.value) : i.value); });
    try { await api('/impostazioni/salva', { valori: patch, revision: st.revision }); toast('Impostazioni salvate'); impostazioniView(); } catch (x) { toast(x.message); }
  };
  const sr = $('#saveR'); if (sr) sr.onclick = async () => {
    const r = {}; RUOLI.filter((x) => x !== 'titolare').forEach((x) => (r[x] = [])); document.querySelectorAll('[data-r]').forEach((c) => { if (c.checked && r[c.dataset.r]) r[c.dataset.r].push(c.dataset.p); });
    try { await api('/impostazioni/salva', { valori: { ruoli: r }, revision: st.revision }); toast('Permessi salvati'); } catch (x) { toast(x.message); }
  };
}
async function profiloView() {
  const u = state.user;
  $('#app').innerHTML = `<div class="grid2"><div class="card"><div class="prof"><span class="avatar">${h((u.name || '?').split(' ').map((x) => x[0]).join('').slice(0, 2))}</span><div><h3 style="margin:0">${h(u.name || '')}</h3><span class="muted">${h(u.email || '')} · ${h(u.role || '')}</span></div></div>
    <label class="fld"><span>Nome visualizzato</span><input id="pn" value="${h(u.name || '')}"></label><button class="btn primary" id="psave">Salva</button></div>
    <div class="card"><h3>Cambia password</h3><label class="fld"><span>Password attuale</span><input type="password" id="p1"></label><label class="fld"><span>Nuova password (min 12 caratteri)</span><input type="password" id="p2"></label><button class="btn" id="ppw">Aggiorna password</button></div>
    <div class="card"><h3>Accesso in due passaggi</h3><p class="muted">Codice da app (Google Authenticator, Authy…). Obbligatorio per titolare e amministrazione al primo accesso reale.</p><button class="btn" id="p2f">Attiva</button></div>
    <div class="card"><h3>I miei permessi</h3><div>${u.permessi.map((p) => `<span class="chip">${h(p)}</span>`).join(' ')}</div></div></div>`;
  $('#psave').onclick = async () => { try { await api('/account/salva', { name: $('#pn').value }); u.name = $('#pn').value; toast('Profilo salvato'); } catch (x) { toast(x.message); } };
  $('#ppw').onclick = async () => { try { await api('/account/password', { attuale: $('#p1').value, nuova: $('#p2').value }); toast('Password aggiornata'); } catch (x) { toast(x.message); } };
  $('#p2f').onclick = async () => { try { const r = await api('/account/due-passi/avvia'); toast('Codice segreto creato: inquadra il QR nell’app (' + (r.secret || '').slice(0, 4) + '…)'); } catch (x) { toast(x.message); } };
}

const eur = (c) => (c / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
const STATO_F = { bozza: 'Bozza', emessa: 'Emessa', pagata: 'Pagata', annullata: 'Stornata' };
async function scarica(path, body) {
  const r = await fetch('/api' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrf }, body: JSON.stringify(body) });
  if (!r.ok) { const j = await r.json().catch(() => ({})); toast(MSG[j.error] || j.error || 'Errore'); return; }
  const cd = r.headers.get('Content-Disposition') || ''; const name = (cd.match(/filename="?([^";]+)/) || [])[1] || 'file';
  const a = document.createElement('a'); a.href = URL.createObjectURL(await r.blob()); a.download = name; a.click();
}
async function fattureView() {
  const t = today(), from = t.slice(0, 8) + '01';
  const [l, st, pz] = await Promise.all([api('/fatture/elenco', {}), api('/statistiche/economiche', { da: from, a: t }).catch(() => null), api('/pazienti/cerca', { q: '', limite: 50 })]);
  const p = st ? st.periodo : null;
  $('#app').innerHTML = `<div class="kpis">
     <div class="kpi"><span>Fatturato del mese</span><b>${p ? eur(p.fatturato_cents) : '—'}</b></div>
     <div class="kpi"><span>Incassato</span><b>${p ? eur(p.incassato_cents) : '—'}</b></div>
     <div class="kpi"><span>Prestazioni eseguite</span><b>${p ? p.prestazioni : '—'}</b></div>
     <div class="kpi"><span>Fatture emesse</span><b>${l.fatture.filter((f) => f.stato !== 'bozza').length}</b></div></div>
   <div class="grid2" style="grid-template-columns:minmax(320px,1fr) 2fr">
   <div class="card"><h3>Nuova fattura</h3><label class="fld"><span>Paziente</span><select id="fp"><option value="">Scegli…</option>${pz.risultati.map((x) => `<option value="${x.id}">${h(x.cognome)} ${h(x.nome)}</option>`).join('')}</select></label>
     <div id="righe" class="muted">Scegli un paziente: le prestazioni eseguite e non fatturate compaiono qui.</div></div>
   <div class="card"><div class="row"><h3 style="margin:0">Fatture</h3><span class="spacer"></span><button class="btn" id="zip">⇩ ZIP del mese per la commercialista</button><button class="btn" id="sts">⇩ Export Sistema TS</button></div>
   ${l.fatture.length ? `<table><thead><tr><th>Numero</th><th>Data</th><th>Paziente</th><th>Totale</th><th>Stato</th><th></th></tr></thead><tbody>${l.fatture.map((f) => { const x = pz.risultati.find((q) => q.id === f.patient_id) || {}; return `<tr><td><b>${h(f.numero_testo || '—')}</b>${f.tipo === 'nota_credito' ? '<br><span class="muted">nota di credito</span>' : ''}</td><td style="white-space:nowrap">${h(f.date.split("-").reverse().join("/"))}</td><td>${h((x.cognome || '') + ' ' + (x.nome || ''))}</td><td><b>${eur(f.totale_cents)}</b>${f.bollo_cents ? '<br><span class="muted">bollo incluso</span>' : ''}</td><td><span class="chip st-${f.stato}">${STATO_F[f.stato] || f.stato}</span></td>
     <td class="acts">${f.stato === 'bozza' ? `<button class="btn primary sm" data-em="${f.id}">Emetti</button>` : `<button class="btn sm" data-pdf="${f.id}">PDF</button><button class="btn sm" data-xml="${f.id}">XML</button>`}${f.stato === 'emessa' && f.tipo === 'fattura' ? `<button class="btn sm" data-pay="${f.id}">Incassa</button>` : ''}${['emessa', 'pagata'].includes(f.stato) && f.tipo === 'fattura' ? `<button class="btn sm danger" data-nc="${f.id}">Storna</button>` : ''}</td></tr>`; }).join('')}</tbody></table>` : '<div class="empty">Nessuna fattura ancora. Creane una dal riquadro a sinistra.</div>'}</div></div>`;
  $('#zip').onclick = () => scarica('/fatture/archivio', { da: from, a: t });
  $('#sts').onclick = () => scarica('/fatture/sts-csv', { da: from, a: t });
  $('#fp').onchange = async () => {
    const pid = $('#fp').value; if (!pid) return;
    const r = await api('/fatture/proponi', { patient_id: pid }); const free = r.righe.filter((x) => !x.gia_fatturata);
    if (!free.length) { $('#righe').innerHTML = '<div class="empty">Nessuna prestazione eseguita da fatturare per questo paziente.</div>'; return; }
    $('#righe').innerHTML = `${free.map((x, i) => `<label class="line"><input type="checkbox" data-i="${i}" checked><span>${h(x.descrizione)}</span><b>${eur(Math.round(x.prezzo * 100))}</b></label>`).join('')}
      <div class="tot" id="tot"></div><button class="btn primary big" id="crea">Crea ed emetti fattura</button>`;
    const calc = () => { const s = free.filter((_, i) => $(`[data-i="${i}"]`).checked).reduce((a, x) => a + Math.round(x.prezzo * 100), 0); $('#tot').innerHTML = `Imponibile esente <b>${eur(s)}</b>${s > 7747 ? '<br>+ bollo virtuale 2,00 €' : ''}`; };
    $('#righe').onchange = calc; calc();
    $('#crea').onclick = async () => {
      try { const sel = free.filter((_, i) => $(`[data-i="${i}"]`).checked); const d = await api('/fatture/bozza-salva', { patient_id: pid, righe: sel });
        const f = await api('/fatture/emetti', { id: d.id }); toast(`Fattura ${f.numero_testo} emessa — XML valido`); fattureView(); } catch (x) { toast(x.message + (x.payload && x.payload.campi ? ': ' + x.payload.campi.join(', ') : '')); }
    };
  };
  $('#app').onclick = async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    try {
      if (b.dataset.em) { const f = await api('/fatture/emetti', { id: b.dataset.em }); toast('Emessa ' + f.numero_testo); fattureView(); }
      if (b.dataset.pdf) scarica('/fatture/scarica-pdf', { id: b.dataset.pdf });
      if (b.dataset.xml) scarica('/fatture/scarica-xml', { id: b.dataset.xml });
      if (b.dataset.pay) { await api('/fatture/paga', { id: b.dataset.pay, metodo: 'carta', data: today() }); toast('Incasso registrato (carta, tracciabile)'); fattureView(); }
      if (b.dataset.nc) { const m = prompt('Motivo dello storno'); if (m) { const n = await api('/fatture/nota-credito', { id: b.dataset.nc, motivo: m }); toast('Nota di credito ' + n.numero_testo); fattureView(); } }
    } catch (x) { toast(x.message); }
  };
}

// ---------------------------------------------------------------- assistente AI
const SUGG = {
  titolare: ['Quanto abbiamo fatturato questo mese rispetto al precedente?', 'Chi è il professionista più carico la prossima settimana?', 'Quali pazienti hanno ancora sedute da pianificare?', 'Ci sono fatture da incassare?'],
  segreteria: ['Chi viene domani mattina?', 'Ci sono buchi liberi giovedì pomeriggio?', 'Quali pazienti hanno sedute da pianificare?', 'Quanti promemoria sono partiti questa settimana?'],
  fisioterapista: ['Chi ho domani?', 'Quante sedute ho questa settimana?', 'A che punto è il ciclo dei miei pazienti?'],
  medico: ['Quali visite ho questa settimana?', 'Quanto ho fatturato questo mese?'],
  amministrazione: ['Fatturato del mese per terapia', 'Fatture emesse non incassate'],
};
async function assistenteView() {
  state.chat = state.chat || [];
  const st = await api('/assistente/stato');
  const sug = SUGG[state.user.role] || SUGG.segreteria;
  $('#app').innerHTML = `<div class="chat"><div class="chat-log" id="log"></div>
   ${st.configurata ? '' : '<div class="card warn">L’assistente è spento: manca la chiave OpenAI. Mettila nel file <code>demo/chiave-openai.txt</code> e riavvia con <code>./avvia.sh</code>.</div>'}
   <form class="chat-in" id="cf"><textarea id="cq" rows="1" placeholder="Chiedi qualcosa su agenda, pazienti, fatture…" ${st.configurata ? '' : 'disabled'}></textarea><button class="btn primary" ${st.configurata ? '' : 'disabled'}>Invia</button></form>
   <p class="chat-note">Risponde solo sui dati che il tuo ruolo può vedere. Nomi, telefoni, codici fiscali e dati clinici non vengono mai inviati a OpenAI.</p></div>`;
  const draw = () => {
    $('#log').innerHTML = state.chat.length ? state.chat.map((m) => `<div class="msg ${m.role}">${m.role === 'assistant' ? '<span class="who">Assistente</span>' : ''}<div>${fmtAi(m.text)}</div>${m.sent ? `<details><summary>Cosa è stato inviato a OpenAI</summary><pre>${h(m.sent)}</pre></details>` : ''}</div>`).join('')
      : `<div class="chat-empty"><h2>Come posso aiutarti?</h2><p class="muted">Domande sui dati della struttura, con le regole del tuo ruolo (${h(state.user.role)}).</p><div class="sugg">${sug.map((x) => `<button type="button" class="chip-btn" data-q="${h(x)}">${h(x)}</button>`).join('')}</div></div>`;
    $('#log').scrollTop = $('#log').scrollHeight;
  };
  draw();
  const send = async (q) => {
    if (!q.trim()) return;
    const hist = state.chat.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    state.chat.push({ role: 'user', text: q }, { role: 'assistant', text: '…', wait: true }); draw();
    $('#cq').value = '';
    try { const r = await api('/assistente/chiedi', { domanda: q, storia: hist }); state.chat[state.chat.length - 1] = { role: 'assistant', text: r.risposta, sent: r.inviato_al_fornitore }; }
    catch (x) { state.chat[state.chat.length - 1] = { role: 'assistant', text: 'Non riesco a rispondere: ' + x.message }; }
    draw();
  };
  $('#log').onclick = (e) => { const b = e.target.closest('[data-q]'); if (b) send(b.dataset.q); };
  $('#cf').onsubmit = (e) => { e.preventDefault(); send($('#cq').value); };
  $('#cq').onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send($('#cq').value); } };
}
function fmtAi(t) {
  return h(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split(/\n/).map((l) => /^\s*[-•*] /.test(l) ? `<li>${l.replace(/^\s*[-•*] /, '')}</li>` : l ? `<p>${l}</p>` : '').join('').replace(/(<li>.*?<\/li>)+/g, (m) => `<ul>${m}</ul>`);
}
