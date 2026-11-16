# Blog

| Pagina | Rotta | File |
|---|---|---|
| Elenco pubblico | `#/blog` | `pages/blog/BlogPublicPages.tsx` |
| Articolo | `#/blog/:slug` | stesso file |
| Gestione | `#/admin/blog` | `pages/blog/BlogAdminPage.tsx` |
| Nuovo / Modifica | `#/admin/blog/nuovo`, `#/admin/blog/:id` | `pages/blog/BlogEditorPage.tsx` |

Si attiva con il modulo `blog`; per gestirlo serve il permesso `blog.gestisci`.

- **Pagine pubbliche:** cornice `SiteLayout` con marchio e contatti nel footer, 10 articoli per pagina, meta SEO per ogni articolo.
- **Gestione:** elenco paginato con filtro Tutti, Pubblicati, Bozze; un punto verde indica gli articoli pubblicati.
- **Editor:**
  - l'indirizzo si crea dal titolo finché non lo cambi a mano, e viene controllato se è già usato;
  - estratto, copertina caricata, testo nel formato semplice e risorse incorporate;
  - campi per Google con contatori;
  - interruttore "Pubblicato": il bottone diventa "Pubblica" o "Salva bozza";
  - eliminazione con conferma.

![](img/app-blog.png)
![](img/app-blog-articolo.png)
![](img/app-blog-admin.png)
![](img/app-blog-editor.png)
