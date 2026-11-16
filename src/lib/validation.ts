/*
 * Controlli lato client condivisi da tutti i form. Ogni funzione restituisce
 * il messaggio d'errore da mostrare sotto il campo, oppure null se il valore va bene.
 * Non sostituiscono i controlli del backend: evitano solo invii inutili.
 */

export type Validator = (value: string) => string | null;

export const required =
  (message = "Campo obbligatorio."): Validator =>
  (value) => (value.trim() === "" ? message : null);

export const email: Validator = (value) => {
  const v = value.trim();
  if (v === "") return "Inserisci la tua email.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : "Controlla l'email: manca qualcosa, per esempio nome@azienda.it.";
};

export const PASSWORD_MIN = 8;

export const newPassword: Validator = (value) => {
  if (value.length < PASSWORD_MIN) return `Usa almeno ${PASSWORD_MIN} caratteri.`;
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Usa almeno una lettera e un numero.";
  return null;
};

export const samePassword =
  (getOther: () => string): Validator =>
  (value) => (value !== getOther() ? "Le due password non coincidono." : null);

/* Telefono: prefisso internazionale + numero. Lunghezze per i prefissi più usati. */
export const PHONE_PREFIXES = [
  { code: "+39", country: "Italia", min: 9, max: 11 },
  { code: "+41", country: "Svizzera", min: 9, max: 9 },
  { code: "+33", country: "Francia", min: 9, max: 9 },
  { code: "+49", country: "Germania", min: 10, max: 11 },
  { code: "+34", country: "Spagna", min: 9, max: 9 },
  { code: "+44", country: "Regno Unito", min: 10, max: 10 },
  { code: "+1", country: "Stati Uniti", min: 10, max: 10 },
] as const;

export const phone =
  (getPrefix: () => string): Validator =>
  (value) => {
    const digits = value.replace(/[\s.-]/g, "");
    if (digits === "") return "Inserisci il numero di telefono.";
    if (!/^\d+$/.test(digits)) return "Usa solo numeri, senza il prefisso.";
    const rule = PHONE_PREFIXES.find((p) => p.code === getPrefix());
    if (rule && (digits.length < rule.min || digits.length > rule.max)) {
      return rule.min === rule.max
        ? `Per ${rule.country} il numero ha ${rule.min} cifre.`
        : `Per ${rule.country} il numero ha da ${rule.min} a ${rule.max} cifre.`;
    }
    return null;
  };

export const cap: Validator = (value) =>
  /^\d{5}$/.test(value.trim()) ? null : "Il CAP ha 5 cifre.";

export const partitaIva: Validator = (value) => {
  const v = value.trim();
  if (!/^\d{11}$/.test(v)) return "La partita IVA ha 11 cifre.";
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let n = Number(v[i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return (10 - (sum % 10)) % 10 === Number(v[10]) ? null : "Controlla la partita IVA: una cifra non torna.";
};

/* Codice fiscale persona fisica: formato + carattere di controllo. */
const CF_ODD: Record<string, number> = {
  0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
  N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};

export const codiceFiscale: Validator = (value) => {
  const v = value.trim().toUpperCase();
  if (!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(v)) {
    return "Il codice fiscale ha 16 caratteri, per esempio RSSMRA80A01H501U.";
  }
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const c = v[i];
    sum += i % 2 === 0 ? CF_ODD[c] : /\d/.test(c) ? Number(c) : c.charCodeAt(0) - 65;
  }
  return String.fromCharCode(65 + (sum % 26)) === v[15] ? null : "Controlla il codice fiscale: l'ultima lettera non torna.";
};

/** Esegue i validatori in ordine e restituisce il primo errore. */
export function validate(value: string, validators: Validator[]): string | null {
  for (const check of validators) {
    const error = check(value);
    if (error) return error;
  }
  return null;
}
