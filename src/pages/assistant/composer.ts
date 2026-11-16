/* Configurazione italiana della Prompt Bar di Beautiful UI: fonti con @, comandi con /, nessuna scelta del modello. */
import type { PromptBarLabels, PromptCommand, Source } from "@/components/primitives/PromptBar";

export const PROMPT_SOURCES: Source[] = [
  { key: "attach", name: "Allega file", desc: "Foto, PDF o fogli di calcolo", glyph: "clip", attach: true },
  { key: "richieste", name: "Richieste", desc: "Tutte le richieste e il loro stato", glyph: "layers" },
  { key: "clienti", name: "Clienti", desc: "Aziende e contatti", glyph: "chart" },
  { key: "documenti", name: "Documenti", desc: "Schede tecniche e allegati", glyph: "globe" },
];

export const PROMPT_COMMANDS: PromptCommand[] = [
  { key: "riepilogo", name: "/riepilogo", desc: "Riepiloga le richieste del mese" },
  { key: "nuova", name: "/nuova-richiesta", desc: "Crea una richiesta da una descrizione" },
  { key: "risposta", name: "/risposta", desc: "Scrivi una risposta a un cliente" },
];

export const PROMPT_LABELS: Partial<PromptBarLabels> = {
  listening: "Ti ascolto…", prompt: "Messaggio", send: "Invia", attach: "Allega o collega", chooseModel: "Modello",
  dictateStart: "Detta", dictateStop: "Ferma dettatura", connect: "Collega", connected: "Collegato", remove: "Rimuovi",
};
