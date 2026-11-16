/*
 * Impostazioni della piattaforma con i valori predefiniti del boilerplate.
 * Moduli: ogni funzione si accende o spegne qui (default) e dall'admin (runtime).
 * Ruoli: permessi per ruolo (RBAC). Marchio e SEO: white label.
 */
export type FeatureKey = "registrazione" | "assistente" | "dettatura" | "letturaVoce" | "blog" | "notifiche" | "upload" | "ricerca" | "temaScuro";

export type FeatureGroup = "Accesso" | "Contenuti" | "Assistente" | "Interfaccia";

export const FEATURES: { key: FeatureKey; label: string; description: string; group: FeatureGroup }[] = [
  { key: "registrazione", label: "Registrazione", description: "Chiunque può creare un account.", group: "Accesso" },
  { key: "assistente", label: "Assistente", description: "Chat con l'assistente nel menu.", group: "Assistente" },
  { key: "dettatura", label: "Dettatura", description: "Microfono per scrivere parlando.", group: "Assistente" },
  { key: "letturaVoce", label: "Lettura ad alta voce", description: "Le risposte dell'assistente si possono ascoltare.", group: "Assistente" },
  { key: "blog", label: "Blog", description: "Articoli pubblici e gestione dall'amministrazione.", group: "Contenuti" },
  { key: "notifiche", label: "Notifiche", description: "Centro notifiche e contatore nel menu.", group: "Interfaccia" },
  { key: "upload", label: "Caricamento file", description: "Allegati, loghi e immagini.", group: "Contenuti" },
  { key: "ricerca", label: "Ricerca globale", description: "Comando Cerca nelle dashboard, con Ctrl/⌘+K.", group: "Interfaccia" },
  { key: "temaScuro", label: "Tema scuro", description: "Gli utenti possono scegliere chiaro o scuro.", group: "Interfaccia" },
];

export type Permission =
  | "dashboard.admin" | "richieste.tutte" | "richieste.crea" | "richieste.modifica" | "richieste.elimina"
  | "utenti.gestisci" | "ruoli.gestisci" | "registro.vedi" | "statistiche.vedi" | "impostazioni.gestisci"
  | "blog.gestisci" | "assistente.usa";

export const PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: "dashboard.admin", label: "Dashboard di amministrazione", group: "Generale" },
  { key: "assistente.usa", label: "Usare l'assistente", group: "Generale" },
  { key: "richieste.tutte", label: "Vedere tutte le richieste", group: "Richieste" },
  { key: "richieste.crea", label: "Creare richieste", group: "Richieste" },
  { key: "richieste.modifica", label: "Modificare richieste", group: "Richieste" },
  { key: "richieste.elimina", label: "Eliminare richieste", group: "Richieste" },
  { key: "utenti.gestisci", label: "Gestire gli utenti", group: "Amministrazione" },
  { key: "ruoli.gestisci", label: "Gestire ruoli e permessi", group: "Amministrazione" },
  { key: "registro.vedi", label: "Vedere il registro attività", group: "Amministrazione" },
  { key: "statistiche.vedi", label: "Vedere le statistiche", group: "Amministrazione" },
  { key: "impostazioni.gestisci", label: "Cambiare le impostazioni", group: "Amministrazione" },
  { key: "blog.gestisci", label: "Scrivere nel blog", group: "Contenuti" },
];

export type RoleKey = "admin" | "operatore" | "utente";
export type Role = { label: string; permessi: Permission[] };

/**
 * Marchio (specifiche in docs/marchio.md).
 * simbolo: quadrato, trasparente, per sidebar, favicon e spazi stretti.
 * logotipo: orizzontale (simbolo + nome), trasparente, per header del sito e accesso.
 * *Scuro: varianti per il tema scuro; se mancano si usa la versione chiara.
 */
export type Brand = {
  nome: string; simbolo: string; simboloScuro: string; logotipo: string; logotipoScuro: string;
  colore: string; email: string; telefono: string; indirizzo: string;
};
/** Aspetto per tutti (docs/tema.md): tema iniziale, angoli, densità, movimento, carattere. */
export type Appearance = { tema: "sistema" | "chiaro" | "scuro"; angoli: "netti" | "standard" | "morbidi"; densita: "compatta" | "standard" | "ariosa"; movimento: "dispositivo" | "ridotto"; carattere: "inter" | "sistema" };
export type Seo = { titolo: string; descrizione: string; immagine: string; indicizza: boolean };

export type PlatformSettings = {
  features: Record<FeatureKey, boolean>;
  roles: Record<RoleKey, Role>;
  brand: Brand;
  seo: Seo;
  aspetto: Appearance;
};

const all = PERMISSIONS.map((p) => p.key);

export const DEFAULT_SETTINGS: PlatformSettings = {
  features: { registrazione: true, assistente: true, dettatura: true, letturaVoce: true, blog: true, notifiche: true, upload: true, ricerca: true, temaScuro: true },
  roles: {
    admin: { label: "Amministratore", permessi: all },
    operatore: { label: "Operatore", permessi: ["assistente.usa", "richieste.tutte", "richieste.crea", "richieste.modifica", "statistiche.vedi", "blog.gestisci"] },
    utente: { label: "Cliente", permessi: ["assistente.usa", "richieste.crea"] },
  },
  brand: { nome: "Nome piattaforma", simbolo: "", simboloScuro: "", logotipo: "", logotipoScuro: "", colore: "#1f5fd6", email: "assistenza@esempio.it", telefono: "+39 095 000 0000", indirizzo: "Via Esempio 1, Catania" },
  aspetto: { tema: "sistema", angoli: "standard", densita: "standard", movimento: "dispositivo", carattere: "inter" },
  seo: { titolo: "%s · Nome piattaforma", descrizione: "Richieste, clienti e documenti in un unico posto.", immagine: "", indicizza: true },
};
