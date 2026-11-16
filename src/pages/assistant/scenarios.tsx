/*
 * Risposte d'esempio dell'assistente, per mostrare i componenti AI di Beautiful UI con dati
 * della piattaforma. In produzione il backend restituisce gli stessi pezzi: passaggi del
 * ragionamento, letture, testo, fonti e un eventuale blocco d'azione.
 */
import type { StreamingSource, StreamingToken } from "@/components/primitives/StreamingText";
import type { ToolStep } from "@/components/primitives/ToolChips";
import type { ApprovalQuestion } from "@/components/primitives/ApprovalCard";

export type ScenarioExtra = "recommendation" | "diff" | "context" | "agent" | null;

export type Scenario = {
  key: string;
  thinking: { variant: "Steps" | "Reasoning" | "Search"; active: string; done: string; rows: { primary: string; secondary?: string }[] };
  tools?: ToolStep[];
  approval?: ApprovalQuestion[];
  answer: StreamingToken[];
  sources: StreamingSource[];
  followUps: string[];
  extra: ScenarioExtra;
};

const words = (text: string): StreamingToken[] => text.split(" ").map((t) => ({ text: t }));
const cite: StreamingToken = { text: "", cite: true };

const icon = (letter: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='16' fill='${color}'/><text x='32' y='42' font-family='sans-serif' font-size='30' font-weight='700' fill='white' text-anchor='middle'>${letter}</text></svg>`)}`;

const SRC = {
  richieste: { name: "Richieste", domain: "8 richieste", href: "#/richieste", image: icon("R", "#2f6fec") },
  storico: { name: "Storico", domain: "registro attività", href: "#/admin/registro", image: icon("S", "#1f7a5f") },
  schede: { name: "Schede tecniche", domain: "documenti", href: "#/richieste", image: icon("D", "#e56d24") },
} satisfies Record<string, StreamingSource>;

const THINK = (active: string, done: string, rows: string[]) => ({ variant: "Steps" as const, active, done, rows: rows.map((primary) => ({ primary })) });

export const SCENARIOS: Record<string, Scenario> = {
  c1: {
    key: "c1",
    thinking: THINK("Controllo le richieste", "Controllate 8 richieste", ["Leggo le richieste aperte", "Confronto le date di creazione", "Cerco chi ha meno lavoro"]),
    answer: [...words("Sono 2 le richieste ferme da più di una settimana: R-1038, formazione per Posatori Associati, e R-1036, ripristino calcestruzzo per Impresa Russo."), cite, ...words("La prima non è ancora assegnata.")],
    sources: [SRC.richieste, SRC.storico],
    followUps: ["Scrivi un promemoria a Impresa Russo", "Quali sono le richieste urgenti?"],
    extra: "recommendation",
  },
  c2: {
    key: "c2",
    thinking: THINK("Preparo il riepilogo", "Riepilogo pronto", ["Raccolgo le richieste di ottobre", "Raggruppo per categoria", "Calcolo i tempi di chiusura"]),
    tools: [
      { icon: "read", label: "Lettura", chip: "Richieste di ottobre", mono: false, detailMono: false, detail: [{ text: "8 richieste lette" }] },
      { icon: "think", label: "Analisi", chip: "Per categoria e stato", mono: false, detailMono: false, detail: [{ text: "Forniture 3 · Assistenza tecnica 2 · altre 3" }] },
    ],
    answer: [...words("A ottobre sono arrivate 8 richieste: 3 forniture, 2 di assistenza tecnica, 1 preventivo, 1 reso e 1 formazione. Ne sono state chiuse 3."), cite, ...words("Due richieste completate si possono archiviare.")],
    sources: [SRC.richieste],
    followUps: ["Confronta con settembre", "Esporta il riepilogo"],
    extra: "diff",
  },
  c3: {
    key: "c3",
    thinking: { variant: "Reasoning", active: "Ci penso", done: "Ragionamento completato", rows: [{ primary: "Per scegliere il ciclo serve sapere il supporto e se il terrazzo è calpestabile." }] },
    approval: [
      { q: "Che pavimento c'è oggi sul terrazzo?", type: "radio", options: ["Piastrelle", "Massetto a vista", "Guaina esistente"] },
      { q: "Il terrazzo è calpestabile?", type: "radio", options: ["Sì, tutti i giorni", "Solo per manutenzione"] },
    ],
    answer: [...words("Su piastrelle esistenti e calpestabile conviene un'impermeabilizzazione cementizia bicomponente sotto il nuovo pavimento, con nastro sui raccordi e sui pluviali."), cite, ...words("Le schede tecniche sono qui sotto.")],
    sources: [SRC.schede],
    followUps: ["Calcola i materiali per 140 m²", "Crea una richiesta di sopralluogo"],
    extra: "context",
  },
  c4: {
    key: "c4",
    thinking: THINK("Scrivo la bozza", "Bozza pronta", ["Rileggo la richiesta R-1042", "Controllo la disponibilità", "Scrivo la risposta"]),
    answer: words("Buongiorno, confermiamo la consegna di 120 sacchi di adesivo cementizio al cantiere di via Etnea entro venerdì 6 novembre. In allegato la scheda tecnica aggiornata. Restiamo a disposizione."),
    sources: [SRC.richieste],
    followUps: ["Rendila più breve", "Aggiungi gli orari di consegna"],
    extra: "agent",
  },
  generico: {
    key: "generico",
    thinking: THINK("Cerco una risposta", "Risposta pronta", ["Leggo la domanda", "Cerco tra richieste e documenti"]),
    answer: [...words("Ho trovato le informazioni nelle richieste aperte."), cite, ...words("Dimmi pure se vuoi che apra una richiesta in particolare o che prepari un riepilogo.")],
    sources: [SRC.richieste],
    followUps: ["Quali richieste sono ferme?", "Fammi un riepilogo di ottobre"],
    extra: null,
  },
};

/** sceglie lo scenario d'esempio più vicino alla domanda scritta */
export function scenarioFor(prompt: string): Scenario {
  const p = prompt.toLowerCase();
  if (/ferm|bloccat|urgent/.test(p)) return SCENARIOS.c1;
  if (/riepilog|ottobre|mese|statistic/.test(p)) return SCENARIOS.c2;
  if (/terrazz|infiltraz|ciclo|impermeab/.test(p)) return SCENARIOS.c3;
  if (/rispost|bozza|scriv|email|mail/.test(p)) return SCENARIOS.c4;
  return SCENARIOS.generico;
}
