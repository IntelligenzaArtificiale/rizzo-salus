# Componenti

Regola: **riusare è meglio che risviluppare.** Prima Beautiful UI così com'è, poi le sue classi e i suoi token, solo alla fine un componente derivato.

Origine: R = registro ufficiale (`npx shadcn add https://www.beautifului.dev/r/<id>.json`), G = repository GitHub `slev12397/beautiful-ui`, D = derivato nel boilerplate dai token e dalle classi di Beautiful UI. Tutti funzionano in chiaro e in scuro.

## Componenti Beautiful UI: catalogo principale

| Componente | File | Origine | Usato in |
|---|---|---|---|
| Loading State | `primitives/LoadingState.tsx` | R | Attese delle pagine (`PageLoading`), Assistente |
| Thinking | `primitives/ThinkingState.tsx` | R | Assistente |
| Streaming Text | `primitives/StreamingText.tsx` | R | Assistente |
| Approval Card | `primitives/ApprovalCard.tsx` | R | Assistente (domande); modello per ChoiceStep |
| Tool Chips | `primitives/ToolChips.tsx` | R | Assistente |
| Task Rows | `primitives/TaskRows.tsx` | R | Dashboard amministratore e utente |
| Chat | `primitives/ChatComposer.tsx` | R | Scheda richiesta |
| Prompt Bar | `primitives/PromptBar.tsx` | R | Assistente |
| Recommendation Card | `primitives/RecommendationCard.tsx` | R | Dashboard amministratore, Assistente |
| Context Cards | `primitives/ContextCards.tsx` | R | Scheda richiesta (documenti), Assistente |
| Diff Table | `primitives/DiffTable.tsx` | R | Assistente (richieste da archiviare) |
| Records Table | `primitives/RecordsTable.tsx` | R | Utenti |
| Filter Table | `primitives/FilterTable.tsx` | R | Richieste, dashboard |
| Sidebar Nav | `primitives/SidebarNav.tsx` | R + icone Lucide | Cornice dell'area riservata, cronologia chat |
| Search | `primitives/SearchList.tsx` | R | Ricerca globale (Ctrl/⌘+K) |
| Flowchart | `primitives/Flowchart.tsx` | R | Impostazioni › Automazioni |
| Insight Cards | `primitives/InsightCards.tsx` | R | Dashboard amministratore, Statistiche |
| Code Block | `primitives/CodeBlock.tsx` | R | Registro (Diff), Impostazioni › Integrazioni (Code) |
| Fine-tune Card | `primitives/FineTuneCard.tsx` | R | Guida dei componenti (regolazioni numeriche) |
| Selection Actions | `primitives/SelectionActions.tsx` | R | Scheda richiesta (descrizione) |
| Agent Screen | `primitives/AgentScreen.tsx` | G (non è nel registro) | Assistente |
| GlideMenu | `primitives/GlideMenu.tsx` | R | Scelte della registrazione, elenchi (RowList), suggerimenti, anteprima |
| Button | `atoms/Button.tsx` | R | Tutti i bottoni |
| Switch | `atoms/Switch.tsx` | G | Preferenze del profilo, Impostazioni › Automazioni |
| SegmentedControl | `atoms/SegmentedControl.tsx` | G | Schede di profilo e impostazioni, filtri, priorità, ruolo, stato utente |
| EntityChip, ValuePill | `atoms/` | R | Recommendation Card |
| StatusPill, Chip, TextRow, ProgressRing, Shimmer, StreamText | `atoms/` | R / G | Interni ai componenti sopra; disponibili |
| ThemeToggle | `site/ThemeToggle.tsx` | G | Dashboard: comando compatto e pannello di ricerca, footer di accesso, Preferenze |

I testi d'interfaccia sono in italiano e i dati entrano dall'esterno. Cosa è cambiato in ogni file è in `src/app/beautifui/PATCH.md`.

## Componenti derivati

| Componente | File | Riusa da Beautiful UI | Usato in |
|---|---|---|---|
| TextField | `form/TextField.tsx` | Token `surface`, `line-strong`, `accent`, `accent-tint`; raggio `rounded-control` | Accedi |
| PasswordField | `form/PasswordField.tsx` | TextField con bottone occhio (icone Lucide) | Accedi |
| Checkbox | `form/Checkbox.tsx` | Classi `records-checkbox` della Records Table, 1:1 | Accedi |
| Toast | `feedback/ToastProvider.tsx` | `rounded-card`, `shadow-overlay`, animazione `pop-in` | Accedi |
| BrandMark | `brand/BrandMark.tsx` | Monogramma dello switcher della Sidebar Nav | Accedi |
| AuthLayout | `layouts/AuthLayout.tsx` | `rounded-window`, `shadow-raised`, `bg-inset`, ThemeToggle | Accedi |
| useFormFields | `lib/forms/useFormFields.ts` | — (logica comune a tutti i form: quando mostrare errori, quando attivare l'invio) | Accedi |
| PrimaryButton, PrimaryLink | `form/PrimaryButton.tsx` | `Button` e `buttonVariants` variante `accent` | Tutte le pagine di accesso |
| PasswordChecklist | `form/PasswordChecklist.tsx` | Token `green`, indicatore come Approval Card | Registrazione, Nuova password |
| PhoneField | `form/PhoneField.tsx` | Stile campi; prefisso e numero nello stesso box | Registrazione |
| StatusPanel | `feedback/StatusPanel.tsx` | Token tint (`accent`, `green`, `red`), animazione `fade-up` | Link inviati, esiti, errori dei link |
| EmailSentPanel | `feedback/EmailSentPanel.tsx` | StatusPanel + PrimaryButton | Registrazione, Password dimenticata |
| EmailLinkRequest | `feedback/EmailLinkRequest.tsx` | Form email + EmailSentPanel | Password dimenticata, Nuovo link di conferma |
| LoadingPanel | `feedback/LoadingPanel.tsx` | Rotellina `spin` | Apertura dei link |
| PreviewLink | `feedback/PreviewLink.tsx` | — (solo con i dati finti) | Pannelli "Controlla la tua email" |
| RegisterWizard | `wizard/RegisterWizard.tsx` | AuthLayout con barra di avanzamento | Registrazione |
| ChoiceStep | `wizard/ChoiceStep.tsx` | **GlideMenu** e indicatore radio/check dell'**Approval Card** | Domande della registrazione |
| FieldsStep | `wizard/FieldsStep.tsx` | TextField, PasswordField, PhoneField | Registrazione, Nuova password |
| ConsentStep | `wizard/ConsentStep.tsx` | Checkbox (`records-checkbox`) | Registrazione |
| useWizard | `wizard/useWizard.ts` | — (stato, passaggi condizionali, salvataggio) | Registrazione |
| AppLayout, Page | `layouts/AppLayout.tsx` | Sidebar Nav, foglio `rounded-window` + `shadow-hairline`, ThemeToggle | Tutta l'area riservata |
| GlobalSearch | `app/GlobalSearch.tsx` | Search | Dashboard: comando compatto e pannello di ricerca |
| PageHeader | `app/PageHeader.tsx` | — (indietro, titolo, azioni) | Tutte le pagine interne |
| IconButton, PrimaryAction | `app/IconButton.tsx` | `Button` (secondary e primary) | Azioni delle intestazioni |
| ConfirmDialog | `app/ConfirmDialog.tsx` | `<dialog>`, `shadow-overlay`, `Button` | Eliminazioni (unica modal ammessa) |
| Section, DetailList | `app/Section.tsx` | Token `inset`, `line` | Schede di dettaglio |
| RowList | `app/RowList.tsx` | GlideMenu, `shadow-card` | Registro, Notifiche |
| PageLoading, PageError, EmptyState | `app/PageState.tsx` | Loading State | Tutte le pagine con dati |
| RequireAuth | `app/RequireAuth.tsx` | — | Rotte protette |
| SelectField, TextAreaField | `form/` | Stile dei campi | Nuova/modifica richiesta |
| FormActions | `form/FormActions.tsx` | `Button` | Pagine di creazione e modifica |
| SwitchRow | `form/SwitchRow.tsx` | Switch | Preferenze, Impostazioni |
| FileUpload | `form/FileUpload.tsx` | Superfici e barra con token Beautiful UI | Nuova richiesta, Blog, Marchio, SEO |
| EmbedField, EmbedView | `content/` | `rounded-card`, `shadow-hairline` | Blog |
| ArticleBody | `content/ArticleBody.tsx` | — (formato di `lib/markdown.ts`) | Articolo del blog |
| Pagination, usePagination | `app/Pagination.tsx` | Stile dei pager di Beautiful UI | Elenchi, blog |
| SiteLayout | `layouts/SiteLayout.tsx` | BrandMark, SiteFooter | Superficie sito: blog, privacy, pagine pubbliche ([superfici.md](superfici.md)) |
| Feature, RequireFeature | `app/RequireAuth.tsx` | — | Moduli attivabili |
| ListenButton | `pages/assistant/ListenButton.tsx` | — | Assistente |
| SmartLink | `navigation/SmartLink.tsx` | — (logica: rotta interna o link esterno) | Toast |

### TextField

```tsx
<TextField label="Email" type="email" value={email} onChange={setEmail}
  onBlur={...} error={errore} hint="Testo d'aiuto" labelAside={<Link/>} />
```

Riceve le props da `form.field("nome")` di `useFormFields`. L'etichetta sta sopra. Il messaggio d'errore prende il posto dell'aiuto, con altezza fissa così la pagina non salta. Collegamenti accessibili: `aria-invalid`, `aria-describedby`, `aria-live`.

### useFormFields

```tsx
const form = useFormFields({
  email: { initial: "", rules: [email] },
  password: { rules: [] },
});
<TextField {...form.field("email")} label="Email" />
<Button disabled={!form.isValid}>Invia</Button>
```

Un campo è valido quando non è vuoto e supera le sue regole. `isValid` decide se il bottone è attivo. Gli errori compaiono solo su valori scritti, dopo che l'utente ha lasciato il campo.

### Toast

```tsx
const toast = useToast();
toast.show({ tone: "error", title: "...", body: "...", action: { label: "...", href: "/percorso" } });
```

Toni disponibili: `error`, `warning`, `success`, `info`. Gli errori restano finché l'utente non li chiude, gli altri spariscono dopo 6 secondi. Al massimo 3 visibili. Nessun toast per i successi ovvi.

Catalogo verificabile di tutti i file, esportazioni e importatori: [inventario.md](inventario.md).

### Footer condiviso

`navigation/SiteFooter.tsx` è usato da AuthLayout e SiteLayout. Su mobile
mostra marchio e tema nella prima riga, poi link con area tattile di 44px;
le pagine pubbliche aggiungono i contatti. Niente link legali spezzati per
far stare tutti gli elementi nella stessa riga.

## Controlli applicativi condivisi

PageTabs compone SegmentedControl e SelectField; ExportExcelButton genera il
file richiesto con caricamento pigro del writer; ExportableTable compone FilterTable
e lo schema export richieste. I tipi e gli importatori sono nell'inventario.

## Aggiunte del 3 novembre 2026

| Componente | File | Origine | Uso |
|---|---|---|---|
| EntityCard, CardGrid | `app/EntityCard.tsx` | D | Card di prodotti, offerte, servizi, persone, account |
| Timeline | `app/Timeline.tsx` | D | Storia di un elemento |
| ActionMenu | `app/ActionMenu.tsx` | D (GlideMenu) | Menu ⋯ di riga, tastiera e touch |
| InlineRename | `app/InlineRename.tsx` | D | Rinomina sul posto |
| TableToolbar, matches | `app/TableToolbar.tsx` | D | Ricerca e filtri sopra una tabella |
| ExportableTable | `app/ExportableTable.tsx` | D (FilterTable) | Tabella con export, ex RequestTable, ora generica (`exportAs`) |
| HomeRedirect | `app/HomeRedirect.tsx` | D | `/` verso la dashboard del ruolo |
| SiteLayout | `layouts/SiteLayout.tsx` | D | Superficie sito (ex PublicLayout) |
| RowList `status`, `paginate`, `wrap` | `app/RowList.tsx` | D | Stato con StatusPill, paginazione del backend |
| Pagination `serverPage()` | `app/Pagination.tsx` | D | Totali del backend |
| TextField `suffix`, SelectField `compact` | `form/` | D | Unità nel campo, select nelle barre |
| FormActions `cancelTo?`, `busyLabel` | `form/FormActions.tsx` | D | Annulla facoltativo, indicatore d'invio |
| useSubmit, useUnsavedChanges | `lib/forms/` | D | Invio unico, avviso di uscita |
| statusOf | `lib/status.ts` | D | Stato del dominio → etichetta e tono |
| PageError `message`, EmptyState `description` | `app/PageState.tsx` | D | Testi utili |

Esempi dal vivo, props e errori comuni: **/anteprima/componenti**. Regole di scelta: [mapping.md](mapping.md).

## Aggiunte successive (3 novembre 2026, sera)

| Componente | File | Origine | Uso |
|---|---|---|---|
| SettingsSection, SaveBar | `app/SettingsSection.tsx` | D | Griglia delle impostazioni e barra di salvataggio |
| useSettingsForm | `lib/forms/useSettingsForm.tsx` | D | Stato, dirty, invio unico, toast, avviso di uscita |
| StatTile, ChartCard, ColumnChart, BarList, SegmentedBar | `charts/` | D | Statistiche ([grafici.md](grafici.md)) |
| applyAppearance | `lib/platform/appearance.ts` | D | Aspetto per tutti |
| FineTuneCard | `primitives/FineTuneCard.tsx` | R | Ora nella guida (regolazioni numeriche), non più in Aspetto |
