/* Lavori in corso d'esempio per Task Rows (in produzione: code di lavori del backend). */
import type { TaskRow, TaskRowsLabels } from "@/components/primitives/TaskRows";

export const TASK_LABELS: TaskRowsLabels = { completed: "Completato", failed: "Non riuscito" };

export const ADMIN_TASKS: TaskRow[] = [
  { key: "backup", label: "Backup notturno", amount: "tutti i dati", status: "done", details: [{ label: "Richieste e documenti", meta: "8 richieste" }, { label: "Utenti", meta: "9 account" }] },
  { key: "catalogo", label: "Importazione catalogo", amount: "1.240 prodotti", status: "running", step: 2, details: [{ label: "Lettura del file", meta: "3 fogli" }, { label: "Controllo dei prezzi", meta: "68%" }] },
  { key: "promemoria", label: "Promemoria ai clienti", amount: "4 email", status: "sequence", step: 3, details: [{ label: "Edil Sud S.r.l.", meta: "in coda" }, { label: "Condominio Le Palme", meta: "in coda" }] },
];

export const userTasks = (titles: { id: string; titolo: string; stato: string }[]): TaskRow[] =>
  titles.map((r) => ({
    key: r.id,
    label: r.titolo,
    amount: r.id,
    status: r.stato === "done" ? "done" : "running",
    step: r.stato === "done" ? undefined : 2,
    details: r.stato === "done"
      ? [{ label: "Richiesta ricevuta", meta: "fatto" }, { label: "Lavoro completato", meta: "fatto" }]
      : [{ label: "Richiesta ricevuta", meta: "fatto" }, { label: "In lavorazione", meta: "in corso" }],
  }));
