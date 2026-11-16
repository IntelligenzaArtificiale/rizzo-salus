# Movimento e micro-animazioni

Tutto il movimento dell'app è in `src/styles/motion.css`. Le pagine usano le classi, non scrivono `animation` in linea.

| Classe | Quando | Durata |
|---|---|---|
| `anim-swap` | contenuto che cambia nello stesso posto: schede, sezioni | 200 ms, dissolvenza |
| `anim-rise` | contenuto che entra: passo di un wizard, esito | 280 ms, sale di poco |
| `anim-pop` | elementi sopra la pagina: menu, toast, popover | 200 ms, scala da 0.96 |
| `anim-drawer` | menu laterale su mobile | 200 ms |
| `anim-spin` | indicatore di attesa, sempre con un testo | continuo |
| `anim-flash` | riga appena salvata o aggiornata | 900 ms sul fondo |
| `motion-state` | hover, attivo, selezionato: colori e ombre | 140 ms |

Token: `--motion-fast`, `--motion-base`, `--motion-slow`, `--motion-ease`.

## Regole

1. Si animano solo opacità e trasformazioni; mai larghezze, altezze o posizioni del layout.
2. Il movimento accompagna un cambiamento reale. Niente attese simulate, niente ritardi per «effetto».
3. **Riduci movimento** (`prefers-reduced-motion: reduce`): la fondazione Beautiful UI porta tutte le animazioni a durata quasi nulla; gli indicatori continui (`anim-spin`, `anim-flash`) si fermano. Ogni attesa resta comprensibile dal testo.
4. Feedback di invio: il bottone mostra «Salvataggio» o «Invio» con indicatore e `aria-busy`, e non accetta un secondo invio (`useSubmit`).
5. Focus: aprendo un menu il focus va alla prima voce; chiudendolo torna al comando. Le modali native gestiscono il focus da sole.
6. I componenti Beautiful UI hanno movimenti propri (SidebarNav, GlideMenu, PromptBar): non si sovrascrivono.
