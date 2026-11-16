/*
 * Passaggi della registrazione: si adattano a ogni cliente cambiando questi dati,
 * non il codice delle pagine. Ordine = ordine mostrato. showIf nasconde un passaggio
 * in base alle risposte precedenti. Il passaggio "account" è sempre il primo:
 * nel modo "verifica-prima" è l'unico prima del link di verifica.
 */
import type { Validator } from "@/lib/validation";
import { partitaIva } from "@/lib/validation";

export type RegistrationValues = Record<string, string | string[] | boolean>;

export type FieldDef =
  | { kind: "text"; name: string; label: string; placeholder?: string; autoComplete?: string; optional?: boolean; rules?: Validator[]; hint?: string }
  | { kind: "email-new"; name: string; label: string }
  | { kind: "password-new"; name: string; label: string }
  | { kind: "phone"; name: string; label: string; optional?: boolean; hint?: string };

export type ChoiceOption = { value: string; label: string; description?: string };

type StepBase = { id: string; title: string; subtitle?: string; showIf?: (data: RegistrationValues) => boolean };

export type StepDef =
  | (StepBase & { kind: "fields"; fields: FieldDef[] })
  | (StepBase & { kind: "choice"; name: string; multiple?: boolean; options: ChoiceOption[] })
  | (StepBase & { kind: "consents"; consents: { name: string; label: string; link?: { label: string; to: string }; required: boolean }[] });

const isBusiness = (d: RegistrationValues) => d.profilo === "azienda" || d.profilo === "professionista";

export const ACCOUNT_STEP: StepDef = {
  id: "account",
  kind: "fields",
  title: "Crea il tuo account",
  fields: [
    { kind: "text", name: "nome", label: "Nome e cognome", placeholder: "Mario Rossi", autoComplete: "name" },
    { kind: "email-new", name: "email", label: "Email" },
  ],
};

export const REGISTRATION_STEPS: StepDef[] = [
  ACCOUNT_STEP,
  {
    id: "password",
    kind: "fields",
    title: "Scegli una password",
    fields: [{ kind: "password-new", name: "password", label: "Password" }],
  },
  {
    id: "profilo",
    kind: "choice",
    name: "profilo",
    title: "Per chi userai la piattaforma?",
    options: [
      { value: "privato", label: "Per me", description: "Uso personale" },
      { value: "professionista", label: "Per il mio lavoro", description: "Libero professionista o ditta individuale" },
      { value: "azienda", label: "Per la mia azienda", description: "Società con colleghi o collaboratori" },
    ],
  },
  {
    id: "azienda",
    kind: "fields",
    title: "Dati dell'attività",
    showIf: isBusiness,
    fields: [
      { kind: "text", name: "ragioneSociale", label: "Ragione sociale", placeholder: "Rossi S.r.l.", autoComplete: "organization" },
      { kind: "text", name: "partitaIva", label: "Partita IVA", placeholder: "01234567890", optional: true, rules: [partitaIva], hint: "Facoltativa, serve per le fatture." },
    ],
  },
  {
    id: "dimensione",
    kind: "choice",
    name: "dimensione",
    title: "Quante persone la useranno?",
    showIf: (d) => d.profilo === "azienda",
    options: [
      { value: "1", label: "Solo io" },
      { value: "2-10", label: "Da 2 a 10" },
      { value: "11-50", label: "Da 11 a 50" },
      { value: "50+", label: "Più di 50" },
    ],
  },
  {
    id: "interessi",
    kind: "choice",
    name: "interessi",
    multiple: true,
    title: "Cosa ti interessa di più?",
    subtitle: "Scegli tutte le voci che vuoi.",
    options: [
      { value: "ordini", label: "Ordini e richieste" },
      { value: "catalogo", label: "Catalogo e disponibilità" },
      { value: "assistenza", label: "Assistenza tecnica" },
      { value: "documenti", label: "Documenti e fatture" },
    ],
  },
  {
    id: "contatti",
    kind: "fields",
    title: "Come possiamo contattarti?",
    fields: [{ kind: "phone", name: "telefono", label: "Telefono", optional: true, hint: "Facoltativo, solo per le comunicazioni sul tuo account." }],
  },
  {
    id: "consensi",
    kind: "consents",
    title: "Ultimo passaggio",
    consents: [
      { name: "privacy", label: "Accetto i termini e l'informativa", link: { label: "Leggi", to: "/privacy" }, required: true },
      { name: "marketing", label: "Voglio ricevere novità e offerte via email", required: false },
    ],
  },
];
