/*
 * Elenco dei template email con oggetto, testo d'anteprima e dati d'esempio.
 * Il backend usa gli stessi file (layout.html + templates/<nome>.html|.txt) e gli stessi
 * segnaposto {{...}}. I dati d'esempio sono plausibili, mai codici interni o identificativi.
 */
export type EmailRow = { label: string; value: string };
export type EmailTemplate = {
  key: string;
  label: string;
  subject: string;
  preheader: string;
  action?: { text: string; url: string };
  sample: Record<string, string>;
  rows?: EmailRow[];
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    key: "verifica-email", label: "Conferma email", subject: "Conferma il tuo indirizzo email",
    preheader: "Un clic e il tuo account è attivo.",
    action: { text: "Conferma email", url: "https://esempio.it/#/verifica-email/esempio" },
    sample: { nome: "Giulia", validita: "24 ore" },
  },
  {
    key: "nuova-password", label: "Nuova password", subject: "Scegli una nuova password",
    preheader: "Il link vale un'ora.",
    action: { text: "Scegli la password", url: "https://esempio.it/#/nuova-password/esempio" },
    sample: { nome: "Giulia", validita: "un'ora" },
  },
  {
    key: "benvenuto", label: "Benvenuto", subject: "Il tuo account è attivo",
    preheader: "Ecco da dove iniziare.",
    action: { text: "Vai alla tua area", url: "https://esempio.it/#/area" },
    sample: { nome: "Giulia" },
  },
  {
    key: "aggiornamento", label: "Aggiornamento", subject: "La tua richiesta è stata confermata",
    preheader: "Fornitura adesivo per piastrelle · pronta dal 6 novembre.",
    action: { text: "Apri la richiesta", url: "https://esempio.it/#/richieste/R-1041" },
    sample: {
      nome: "Giulia", oggetto_riferimento: "Richiesta R-1041", titolo: "La tua richiesta è stata confermata",
      messaggio: "Il rivenditore ha confermato la disponibilità. Puoi ritirare il materiale dalla data indicata.",
    },
    rows: [
      { label: "Prodotto", value: "Adesivo per piastrelle, 25 kg" },
      { label: "Quantità", value: "12 sacchi" },
      { label: "Ritiro dal", value: "6 novembre" },
    ],
  },
];
