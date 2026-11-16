/* Sezione Card: prodotti, offerte, servizi, persone e account con EntityCard. */
import { ShoppingCart } from "lucide-react";
import { CardGrid, EntityCard } from "@/components/app/EntityCard";
import { ActionMenu } from "@/components/app/ActionMenu";
import { IconButton } from "@/components/app/IconButton";
import type { GuideSection } from "@/pages/dev/components/types";
import { ACCOUNTS, Avatar, OFFERS, PEOPLE, PRODUCTS, SERVICES } from "@/pages/dev/components/sections/sample";

const noop = () => {};

export const cards: GuideSection = {
  id: "card",
  title: "Card",
  intro: "Elementi da scegliere o da aprire: prodotti, offerte, servizi, persone, account. Una card mostra solo ciò che serve a decidere; il resto sta nel dettaglio.",
  docs: [
    {
      id: "entity-card",
      name: "EntityCard",
      importPath: 'import { EntityCard, CardGrid } from "@/components/app/EntityCard";',
      origin: "Composizione del boilerplate",
      purpose: "Card di un elemento del dominio composta con StatusPill e i token Beautiful UI. Ordine fisso: immagine, chi o cosa, stato, titolo, descrizione, valore chiave, al massimo tre fatti, azioni.",
      demos: [
        { label: "Prodotti", render: () => <CardGrid>{PRODUCTS.map((p) => <EntityCard key={p.id} to="." {...p} actions={<IconButton label={`Aggiungi ${p.title} alla richiesta`} icon={<ShoppingCart size={15} />} onClick={noop} />} />)}</CardGrid> },
        { label: "Offerte", render: () => <CardGrid>{OFFERS.map((o) => <EntityCard key={o.id} to="." {...o} />)}</CardGrid> },
        { label: "Servizi", render: () => <CardGrid>{SERVICES.map((s) => <EntityCard key={s.id} to="." {...s} />)}</CardGrid> },
        { label: "Persone", render: () => (
          <div className="grid gap-3 sm:grid-cols-2">{PEOPLE.map((u) => (
            <EntityCard key={u.id} layout="horizontal" to="." media={<Avatar name={u.name} />} title={u.name} eyebrow={u.role} status={u.status} meta={[u.last]}
              actions={<ActionMenu label={`Azioni per ${u.name}`} visible actions={[{ label: "Modifica", onSelect: noop }, { label: "Disattiva", danger: true, onSelect: noop }]} />} />
          ))}</div>
        ) },
        { label: "Account", render: () => <div className="grid gap-3 sm:grid-cols-2">{ACCOUNTS.map((a) => <EntityCard key={a.id} to="." title={a.name} eyebrow={a.plan} status={a.status} value={a.value} meta={a.meta} />)}</div> },
      ],
      variants: ["Verticale in griglia (predefinita): cataloghi, offerte, servizi", "Orizzontale: persone, account, elenchi stretti", "Con media (immagine o simbolo) o senza"],
      states: ["Con link: tutta la card apre il dettaglio, ombra più alta al passaggio", "Con azioni: bottoni con icona separati dal link", "Stato con StatusPill (disponibile, su richiesta, sospeso)"],
      props: [
        ["title", "ReactNode", "Nome dell'elemento: prodotto, offerta, persona"],
        ["eyebrow", "ReactNode", "Chi o cosa: marca, fornitore, ruolo, piano"],
        ["status", "StatusInfo", "Da statusOf(chiave): etichetta e tono, mai la chiave grezza"],
        ["value", "ReactNode", "Il dato che decide la scelta: prezzo, sconto, disponibilità"],
        ["meta", "ReactNode[]", "Fino a 3 fatti brevi; gli altri vanno nel dettaglio"],
        ["media", "ReactNode", "Immagine 4:3 (verticale) o quadrata 56 px (orizzontale)"],
        ["to / actions", "string / ReactNode", "Link al dettaglio; azioni secondarie con icona o ActionMenu"],
        ["layout", '"vertical" | "horizontal"', "Griglia o riga"],
      ],
      use: ["Scegliere fra elementi simili guardando pochi attributi", "Elementi con immagine o con un valore da mettere in evidenza", "Cataloghi, offerte, servizi prenotabili, team, clienti"],
      avoid: ["Dati da confrontare colonna per colonna: usa una tabella", "Eventi nel tempo: usa Timeline o RowList", "Card dentro un'altra card o un elenco dentro una card"],
      wiring: `const { data } = useLoad(() => listProducts({ query, category }));
<CardGrid>
  {data.items.map((p) => (
    <EntityCard key={p.id} to={\`/prodotti/\${p.id}\`}
      eyebrow={\`\${p.category} · \${p.brand}\`}
      title={p.name}
      status={statusOf(p.availability)}
      value={formatPrice(p.price)}
      meta={[p.storesLabel]} />
  ))}
</CardGrid>
<Pagination {...serverPage(data, setPage)} />`,
      responsive: "CardGrid: 1 colonna sotto 640 px, 2 fino a 1024 px, poi 3. Titolo e descrizione su due righe al massimo. Le azioni restano in basso a destra senza coprire il testo (spazio riservato dal padding).",
      a11y: "Il link avvolge tutta la card ed è raggiungibile con Tab; le azioni sono bottoni con nome accessibile («Aggiungi … alla richiesta»). Lo stato è testo, non solo colore. Immagini decorative con alt vuoto, immagini di prodotto con il nome.",
      customize: ["Testi, ordine dei meta, presenza di media e azioni", "Toni di stato tramite lib/status.ts", "Colore principale dai token del marchio"],
      mistakes: [
        { wrong: "Elenco di nomi con la data di importazione a destra.", right: "Card con disponibilità, valore e i fatti che servono a scegliere." },
        { wrong: "Titolo «Offerta 1793670971» o codice interno nell'eyebrow.", right: "Titolo leggibile; il codice, se serve all'operatore, solo nel dettaglio." },
        { wrong: "Card contenitore con dentro una lista o un'altra card.", right: "Un livello solo: la sezione ha un titolo, le card stanno nella griglia." },
        { wrong: "Campi dell'originale persi nella migrazione (fornitore, visibilità, disponibilità).", right: "Inventario dei campi visibili prima e dopo; ogni campo tolto ha un motivo scritto." },
      ],
    },
  ],
};
