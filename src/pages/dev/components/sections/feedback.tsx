/* Sezione Stati e feedback: StatusPill, toast, conferme proporzionate, esiti di pagina. */
import { useState } from "react";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Button } from "@/components/atoms/Button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { StatusPanel } from "@/components/feedback/StatusPanel";
import { useToast } from "@/components/feedback/toast-context";
import { STATUS } from "@/lib/status";
import type { GuideSection } from "@/pages/dev/components/types";

function Pills() {
  return <div className="flex flex-wrap gap-2">{Object.entries(STATUS).map(([k, s]) => <StatusPill key={k} tone={s.tone}>{s.label}</StatusPill>)}</div>;
}

function Toasts() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => toast.show({ tone: "success", title: "Modifiche salvate" })}>Salvataggio riuscito</Button>
      <Button size="sm" onClick={() => toast.show({ tone: "error", title: "Salvataggio non riuscito", body: "Controlla la connessione e riprova." })}>Errore</Button>
      <Button size="sm" onClick={() => toast.show({ tone: "warning", title: "Sessione in scadenza", body: "Salva il lavoro: tra 5 minuti dovrai accedere di nuovo." })}>Avviso</Button>
      <Button size="sm" onClick={() => toast.show({ tone: "info", title: "Importazione avviata", body: "Ti avvisiamo quando è finita." })}>Informazione</Button>
    </div>
  );
}

function Confirms() {
  const [open, setOpen] = useState<"" | "semplice" | "scritta">("");
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => setOpen("semplice")}>Elimina un file</Button>
      <Button size="sm" onClick={() => setOpen("scritta")}>Elimina un account</Button>
      <ConfirmDialog open={open === "semplice"} title="Eliminare il file?" actionLabel="Elimina" onClose={() => setOpen("")} onConfirm={() => setOpen("")}>
        «Preventivo bagno.pdf» sparirà dalla pratica.
      </ConfirmDialog>
      <ConfirmDialog open={open === "scritta"} title="Eliminare l'account?" actionLabel="Elimina account" confirmText="Panificio Aurora" onClose={() => setOpen("")} onConfirm={() => setOpen("")}>
        Si perdono ordini, documenti e accessi di 3 utenti. Scrivi il nome dell'account per confermare.
      </ConfirmDialog>
    </div>
  );
}

export const feedback: GuideSection = {
  id: "feedback",
  title: "Stati e feedback",
  intro: "Come la piattaforma dice in che stato è un elemento e com'è andata un'azione. Un solo modo per ogni caso, proporzionato alle conseguenze.",
  docs: [
    {
      id: "status-pill",
      name: "StatusPill e lib/status",
      importPath: 'import { StatusPill } from "@/components/atoms/StatusPill";\nimport { statusOf } from "@/lib/status";',
      origin: "Beautiful UI",
      purpose: "Pillola di stato con punto colorato. lib/status.ts traduce le chiavi del backend in etichetta e tono, in un posto solo: le pagine non scelgono colori a mano.",
      demos: [{ label: "Toni", render: () => <Pills /> }],
      variants: ["green: completato, disponibile", "orange: in attesa di qualcuno", "red: rifiutato, non disponibile", "accent: in lavorazione", "neutral: bozza, chiuso, sconosciuto"],
      props: [["tone", '"green" | "orange" | "red" | "accent" | "neutral"', "Da statusOf(chiave).tone"], ["dot", "boolean", "Punto iniziale (predefinito sì)"], ["children", "ReactNode", "Etichetta da statusOf(chiave).label"]],
      use: ["Stato di una riga, una card, un dettaglio", "Colonna di stato in una tabella"],
      avoid: ["Etichette che non sono stati (categorie: usa testo o EntityChip)", "Più di una pillola di stato per elemento"],
      wiring: `// lib/status.ts del progetto: chiavi del backend → etichetta e tono
export const STATUS = { sent: { label: "Inviata", tone: "accent" }, confirmed: { label: "Confermata", tone: "green" } };
<StatusPill tone={statusOf(row.status).tone}>{statusOf(row.status).label}</StatusPill>`,
      responsive: "Non va a capo; in righe strette resta lo stato e si nasconde il valore secondario.",
      a11y: "Lo stato è testo: il colore aiuta, non sostituisce.",
      customize: ["Mappa STATUS del progetto", "Etichette in linguaggio del cliente"],
      mistakes: [
        { wrong: "Stato scritto in grigio nel sottotitolo («In attesa»).", right: "StatusPill con tono, nella stessa posizione in tutte le liste." },
        { wrong: "Chiave grezza mostrata quando manca la traduzione («picked_up»).", right: "statusOf restituisce «Da verificare» e la chiave va aggiunta alla mappa." },
      ],
    },
    {
      id: "toast",
      name: "Toast",
      importPath: 'import { useToast } from "@/components/feedback/toast-context";',
      origin: "Wrapper del boilerplate",
      purpose: "Esito di un'azione appena fatta, senza interrompere. Errori con role=alert, il resto con role=status.",
      demos: [{ label: "Esiti", render: () => <Toasts /> }],
      variants: ["success", "error", "warning", "info"],
      props: [["tone", "ToastTone", "Tipo di esito"], ["title", "string", "Cosa è successo, in 2-5 parole"], ["body", "string?", "Cosa fare adesso, se serve"]],
      use: ["Salvataggi, invii, eliminazioni riuscite o non riuscite", "Errori di rete con un'indicazione pratica"],
      avoid: ["Errori di un campo: vanno sotto il campo", "Esiti che cambiano la pagina (registrazione completata): StatusPanel"],
      wiring: `const result = await run(() => saveItem(values));
if (!result?.ok) return toast.show({ tone: "error", title: "Salvataggio non riuscito", body: "Riprova tra qualche istante." });
toast.show({ tone: "success", title: "Modifiche salvate" });`,
      responsive: "In basso, larghezza massima 360 px; su mobile a tutta larghezza con margine.",
      a11y: "Annunciati dai lettori di schermo; non contengono l'unica copia di un'informazione importante.",
      customize: ["Testi"],
      mistakes: [{ wrong: "«Errore 500: endpoint /api/save»", right: "«Salvataggio non riuscito · Riprova tra qualche istante»" }],
    },
    {
      id: "confirm",
      name: "ConfirmDialog",
      importPath: 'import { ConfirmDialog } from "@/components/app/ConfirmDialog";',
      origin: "Wrapper del boilerplate",
      purpose: "L'unica modal ammessa: conferma di un'azione che non si può annullare. Più grave la conseguenza, più esplicita la conferma.",
      demos: [{ label: "Proporzionate", render: () => <Confirms /> }],
      variants: ["Semplice: titolo, conseguenza, bottone col verbo", "Con testo da riscrivere (confirmText) per account, archivi, dati di molti utenti"],
      states: ["busy: bottone disattivo durante l'operazione", "Esc o clic fuori annullano"],
      props: [["open / onClose / onConfirm", "boolean / () => void", "Controllo dalla pagina"], ["title", "string", "Domanda con il verbo: «Eliminare il file?»"], ["actionLabel", "string", "Lo stesso verbo: «Elimina»"], ["confirmText", "string?", "Testo da riscrivere per abilitare"], ["busy", "boolean", "Operazione in corso"]],
      use: ["Eliminazioni, revoche, invii irreversibili"],
      avoid: ["Creare o modificare (pagina dedicata)", "Azioni annullabili: meglio un toast con «Annulla»", "Avvisi informativi"],
      wiring: `<ConfirmDialog open={Boolean(toDelete)} title="Eliminare la conversazione?" actionLabel="Elimina"
  busy={busy} onClose={() => setToDelete(null)} onConfirm={() => remove(toDelete.id)}>
  «{toDelete?.title}» sparirà dalla cronologia.
</ConfirmDialog>`,
      responsive: "Larghezza massima 420 px, margine 16 px su mobile.",
      a11y: "dialog nativo: focus intrappolato, Esc chiude, il focus torna al comando che l'ha aperta.",
      customize: ["Testi", "confirmText per azioni gravi"],
      mistakes: [{ wrong: "«Sei sicuro?» con «OK / Annulla».", right: "«Eliminare l'account?» con «Elimina account»: titolo e bottone dicono cosa succede." }],
    },
    {
      id: "status-panel",
      name: "StatusPanel",
      importPath: 'import { StatusPanel } from "@/components/feedback/StatusPanel";',
      origin: "Wrapper del boilerplate",
      purpose: "Esito che occupa la pagina: registrazione completata, link scaduto, email inviata. Titolo, una frase, al massimo due azioni.",
      demos: [{ label: "Esito", render: () => <div className="max-w-[440px] rounded-window bg-surface p-6 shadow-raised"><StatusPanel kind="success" title="Il tuo account è pronto" actions={<Button variant="accent">Vai alla dashboard</Button>}>Ti abbiamo inviato un riepilogo per email.</StatusPanel></div> }],
      variants: ["neutral", "success", "error", "email"],
      props: [["kind", '"neutral" | "success" | "error" | "email"', "Tipo di esito"], ["title", "string", "Cosa è successo"], ["actions", "ReactNode", "Passo successivo"]],
      use: ["Fine di un percorso (accesso, registrazione, pagamento)", "Link non valido o scaduto"],
      avoid: ["Esito di un salvataggio in una pagina che resta aperta: toast"],
      wiring: `if (result.error === "scaduto") return <StatusPanel kind="error" title="Link scaduto"
  actions={<PrimaryLink to="/password-dimenticata">Chiedi un nuovo link</PrimaryLink>}>I link valgono un'ora.</StatusPanel>;`,
      responsive: "Nella card dell'accesso o in una pagina stretta.",
      a11y: "Il titolo è un h1; le azioni sono link o bottoni veri.",
      customize: ["Testi e azioni"],
      mistakes: [{ wrong: "Icone decorative grandi e testi lunghi.", right: "Titolo e una frase: cosa è successo e cosa fare." }],
    },
  ],
};
