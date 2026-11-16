/* Esempi dal vivo delle tabelle: ricerca + filtri di stato + paginazione + export, e ordinamento. */
import { useState } from "react";
import { Plus } from "lucide-react";
import ExportableTable from "@/components/app/ExportableTable";
import { TableToolbar, matches } from "@/components/app/TableToolbar";
import { PrimaryAction } from "@/components/app/IconButton";
import { SelectField } from "@/components/form/SelectField";
import RecordsTable from "@/components/primitives/RecordsTable";
import type { TableRow } from "@/components/primitives/FilterTable";

type Demo = { rows: TableRow[]; labels: { task: string; date: string; status: string; owner: string }; statuses: Record<TableRow["status"], string>; search: string; filter?: { label: string; options: string[] } };

const TICKETS: Demo = {
  search: "Cerca nelle richieste",
  labels: { task: "Richiesta", date: "Aggiornata", status: "Stato", owner: "Cliente" },
  statuses: { todo: "In attesa", progress: "In lavorazione", done: "Risolta" },
  filter: { label: "Argomento", options: ["Tutti", "Fatturazione", "Accesso", "Spedizioni"] },
  rows: [
    { id: "T-208", task: "Fattura di ottobre non arrivata", date: "Oggi, 9:12", status: "todo", owner: "Ottica Belvedere" },
    { id: "T-207", task: "Non riesco ad accedere dal telefono", date: "Ieri", status: "progress", owner: "Panificio Aurora" },
    { id: "T-205", task: "Cambio indirizzo di consegna", date: "2 nov", status: "done", owner: "Studio Riva" },
    { id: "T-204", task: "Ordine arrivato incompleto", date: "31 ott", status: "progress", owner: "Termoservice" },
    { id: "T-201", task: "Richiesta preventivo per 20 postazioni", date: "29 ott", status: "todo", owner: "Coop. Il Faro" },
    { id: "T-198", task: "Rimborso doppio addebito", date: "27 ott", status: "done", owner: "Libreria Dante" },
  ],
};

const BOOKINGS: Demo = {
  search: "Cerca per paziente o visita",
  labels: { task: "Visita", date: "Quando", status: "Conferma", owner: "Paziente" },
  statuses: { todo: "Da confermare", progress: "Confermata", done: "Svolta" },
  rows: [
    { id: "B1", task: "Visita di controllo", date: "Gio 7 nov, 9:30", status: "progress", owner: "Luca Bianchi" },
    { id: "B2", task: "Ecografia", date: "Gio 7 nov, 11:00", status: "todo", owner: "Anna Greco" },
    { id: "B3", task: "Prima visita", date: "Ven 8 nov, 15:00", status: "todo", owner: "Marco Conti" },
    { id: "B4", task: "Controllo annuale", date: "Lun 4 nov, 10:00", status: "done", owner: "Elisa Ricci" },
  ],
};

function FilterDemo({ demo }: { demo: Demo }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState(demo.filter?.options[0] ?? "");
  const rows = demo.rows.filter((r) => matches(query, r.task, r.owner, r.id));
  return (
    <div className="flex flex-col gap-3">
      <TableToolbar query={query} onQuery={setQuery} placeholder={demo.search}
        filters={demo.filter && <SelectField compact label={demo.filter.label} value={topic} onChange={setTopic} options={demo.filter.options.map((o) => ({ value: o, label: o }))} className="w-44" />}
        actions={<PrimaryAction label="Nuova" icon={<Plus size={15} />} onClick={() => {}} />} />
      <ExportableTable fill pageSize={4} rows={rows} labels={{ columns: demo.labels, all: "Tutte", statuses: demo.statuses, tableLabel: demo.labels.task }}
        exportAs={{ filename: "elenco", headers: [demo.labels.task, demo.labels.date, demo.labels.status, demo.labels.owner], row: (r) => [r.task, r.date, demo.statuses[r.status], r.owner] }}
        onRowClick={() => {}} />
    </div>
  );
}

export const TicketsTable = () => <FilterDemo demo={TICKETS} />;
export const BookingsTable = () => <FilterDemo demo={BOOKINGS} />;

export function PeopleRecords() {
  return (
    <RecordsTable fill readOnly onOpen={() => {}}
      rows={[
        { id: "r1", name: "Chiara Leone", tags: ["Amministratrice"], last: "Oggi", strength: "strong", website: "chiara.leone@esempio.it" },
        { id: "r2", name: "Davide Marino", tags: ["Operatore"], last: "3 giorni fa", strength: "weak", website: "davide.marino@esempio.it" },
        { id: "r3", name: "Sara Fontana", tags: ["Cliente", "Sospeso"], last: "2 mesi fa", strength: "veryweak", website: "sara.fontana@esempio.it" },
        { id: "r4", name: "Paolo Serra", tags: ["Cliente"], last: "Mai", strength: "none", website: "paolo.serra@esempio.it" },
      ]}
      strengthLabels={{ strong: "Alta", weak: "Media", veryweak: "Bassa", none: "Nessuna" }}
      labels={{ table: "Persone", company: "Nome", categories: "Ruolo", last: "Ultimo accesso", strength: "Attività", links: "Email", count: "persone", average: "attività media", linksCount: "email", selectAll: "Seleziona tutti", select: "Seleziona", noContact: "Mai" }}
    />
  );
}
