'use strict';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const token = location.pathname.split('/').pop();
fetch('/api/pubblico/settimana', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).then((r) => r.json()).then((j) => {
  const app = document.getElementById('app');
  if (!j.ok) { app.innerHTML = '<div class="card"><h2>Link non più valido</h2><p>Per i suoi appuntamenti chiami la segreteria.</p></div>'; return; }
  const d = j.data, f = (s) => s.slice(8) + '/' + s.slice(5, 7);
  app.innerHTML = `<h1>Buongiorno ${esc(d.nome)}</h1><p class="muted">I suoi appuntamenti dal ${f(d.dal)} al ${f(d.al)} · ${esc(d.struttura.nome)}</p>
   ${d.aggiornato_il ? `<div class="card" style="border-color:var(--warn)">Aggiornato il ${f(d.aggiornato_il.slice(0, 10))} alle ${d.aggiornato_il.slice(11, 16)}: gli orari qui sotto sono quelli validi.</div>` : ''}
   ${d.giorni.map((g) => `<div class="card"><h3>${esc(g.giorno)}</h3>${g.appuntamenti.map((a) => `<p><b>${a.dalle}</b> – ${a.alle} · ${esc(a.tipo)}</p>`).join('')}</div>`).join('') || '<p>Nessun appuntamento questa settimana.</p>'}
   <a class="btn primary" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="tel:${esc(d.struttura.telefono.replace(/\s/g, ''))}">Chiama per modifiche · ${esc(d.struttura.telefono)}</a>`;
});
