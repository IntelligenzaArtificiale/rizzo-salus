/* Richieste finte: l'entità d'esempio del boilerplate. Date in ISO, stati come la Filter Table. */
export type RequestStatus = "todo" | "progress" | "done";

export type RequestItem = {
  id: string;
  titolo: string;
  cliente: string;
  categoria: string;
  priorita: "bassa" | "media" | "alta";
  stato: RequestStatus;
  creata: string;
  assegnata: string;
  descrizione: string;
  allegati: { nome: string; tipo: "PDF" | "XLSX" | "JPG"; estratto: string; dimensione: string }[];
  storico: { quando: string; chi: string; campo: string; prima: string; dopo: string }[];
};

export const REQUESTS: RequestItem[] = [
  { id: "R-1042", titolo: "Fornitura adesivo per piastrelle", cliente: "Edil Sud S.r.l.", categoria: "Fornitura", priorita: "alta", stato: "todo", creata: "2026-11-02", assegnata: "Giulia Ferraro",
    descrizione: "Servono 120 sacchi di adesivo cementizio per il cantiere di via Etnea, consegna entro venerdì. Il cliente chiede anche una scheda tecnica aggiornata.",
    allegati: [{ nome: "Ordine-cantiere-Etnea.pdf", tipo: "PDF", estratto: "120 sacchi da 25 kg, consegna al cantiere entro il 6 novembre, scarico con muletto.", dimensione: "180 KB" }],
    storico: [{ quando: "2026-11-02 09:14", chi: "Marco Russo", campo: "Priorità", prima: "Media", dopo: "Alta" }] },
  { id: "R-1041", titolo: "Sopralluogo impermeabilizzazione terrazzo", cliente: "Condominio Le Palme", categoria: "Assistenza tecnica", priorita: "media", stato: "progress", creata: "2026-11-01", assegnata: "Luca Greco",
    descrizione: "Infiltrazioni sul terrazzo condominiale di 140 m². Richiesto sopralluogo e proposta di ciclo impermeabilizzante.",
    allegati: [{ nome: "Foto-terrazzo.jpg", tipo: "JPG", estratto: "Fessure lungo il perimetro e ristagni vicino ai pluviali.", dimensione: "2,4 MB" }, { nome: "Planimetria.pdf", tipo: "PDF", estratto: "Superficie calpestabile 140 m², pendenza 1,5%.", dimensione: "640 KB" }],
    storico: [{ quando: "2026-11-01 16:40", chi: "Giulia Ferraro", campo: "Stato", prima: "Da fare", dopo: "In corso" }, { quando: "2026-11-01 16:41", chi: "Giulia Ferraro", campo: "Assegnata a", prima: "—", dopo: "Luca Greco" }] },
  { id: "R-1040", titolo: "Preventivo massetto autolivellante", cliente: "Studio Arch. Pappalardo", categoria: "Preventivo", priorita: "media", stato: "progress", creata: "2026-10-31", assegnata: "Sara Lombardo",
    descrizione: "Preventivo per 320 m² di massetto autolivellante, spessore medio 8 mm, in un locale commerciale.",
    allegati: [{ nome: "Computo-metrico.xlsx", tipo: "XLSX", estratto: "Voce 4.2: autolivellante 8 mm, 320 m², posa a macchina.", dimensione: "96 KB" }],
    storico: [{ quando: "2026-10-31 11:02", chi: "Sara Lombardo", campo: "Categoria", prima: "Fornitura", dopo: "Preventivo" }] },
  { id: "R-1039", titolo: "Reso sigillante colore errato", cliente: "Ferramenta Sciuto", categoria: "Reso", priorita: "bassa", stato: "done", creata: "2026-10-30", assegnata: "Marco Russo",
    descrizione: "Consegnati 24 tubi di sigillante grigio al posto del bianco. Ritiro e sostituzione.", allegati: [],
    storico: [{ quando: "2026-10-31 10:20", chi: "Marco Russo", campo: "Stato", prima: "In corso", dopo: "Completata" }] },
  { id: "R-1038", titolo: "Formazione posa grandi formati", cliente: "Posatori Associati", categoria: "Formazione", priorita: "bassa", stato: "todo", creata: "2026-10-29", assegnata: "—",
    descrizione: "Richiesta di una giornata di formazione per 8 posatori sulla posa di lastre 120×280.", allegati: [], storico: [] },
  { id: "R-1037", titolo: "Fornitura rasante per cappotto", cliente: "Edil Sud S.r.l.", categoria: "Fornitura", priorita: "media", stato: "done", creata: "2026-10-28", assegnata: "Giulia Ferraro",
    descrizione: "60 sacchi di rasante per sistema a cappotto, ritiro in sede.", allegati: [],
    storico: [{ quando: "2026-10-29 08:55", chi: "Giulia Ferraro", campo: "Stato", prima: "Da fare", dopo: "Completata" }] },
  { id: "R-1036", titolo: "Consulenza ripristino calcestruzzo", cliente: "Impresa Russo Costruzioni", categoria: "Assistenza tecnica", priorita: "alta", stato: "progress", creata: "2026-10-27", assegnata: "Luca Greco",
    descrizione: "Pilastri con ferri a vista in un parcheggio interrato. Serve un ciclo di ripristino strutturale.", allegati: [], storico: [] },
  { id: "R-1035", titolo: "Campionatura fughe colorate", cliente: "Showroom Ceramiche Etna", categoria: "Fornitura", priorita: "bassa", stato: "done", creata: "2026-10-25", assegnata: "Sara Lombardo",
    descrizione: "Cartella colori e 6 campioni di stucco per l'esposizione.", allegati: [], storico: [] },
];

export const STATUS_LABEL: Record<RequestStatus, string> = { todo: "Da fare", progress: "In corso", done: "Completata" };
export const CATEGORIES = ["Fornitura", "Assistenza tecnica", "Preventivo", "Reso", "Formazione"];
const CATEGORIES_LIST = CATEGORIES;

/* Richieste generate per provare la paginazione (oltre 20 elementi). */
const CLIENTI = ["Edil Sud S.r.l.", "Condominio Le Palme", "Studio Arch. Pappalardo", "Ferramenta Sciuto", "Impresa Russo Costruzioni"];
const TITOLI = ["Fornitura primer", "Verifica crepe facciata", "Preventivo rasatura", "Campionatura colori", "Consegna malta tecnica", "Sopralluogo bagno", "Reso piastrelle", "Corso posa sottofondi"];
const STATI: RequestStatus[] = ["done", "done", "progress", "todo"];
for (let i = 0; i < 38; i++) {
  const n = 1034 - i;
  const d = new Date(2026, 9, 24 - Math.floor(i / 2));
  REQUESTS.push({
    id: `R-${n}`, titolo: TITOLI[i % TITOLI.length], cliente: CLIENTI[i % CLIENTI.length], categoria: CATEGORIES_LIST[i % 5],
    priorita: (["bassa", "media", "alta"] as const)[i % 3], stato: STATI[i % 4], creata: d.toISOString().slice(0, 10), assegnata: "Sara Lombardo",
    descrizione: "Richiesta d'esempio per provare la paginazione.", allegati: [], storico: [],
  });
}
