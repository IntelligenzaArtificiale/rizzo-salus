/*
 * Stato e regole di comportamento di ogni form. Le pagine non decidono quando
 * mostrare un errore: lo decide questo hook, sempre allo stesso modo.
 *
 * Regole (docs/regole-ux.md, "Logica dei form"):
 * - Un campo vuoto non è un errore: non diventa mai rosso. Il bottone d'invio resta
 *   disattivato finché tutti i campi obbligatori non sono compilati e validi.
 * - Un campo opzionale vuoto va bene; se scritto, deve essere valido.
 * - Un valore scritto e non valido si segnala solo quando l'utente lascia il campo.
 * - Da quel momento l'errore si aggiorna mentre scrive e sparisce appena il valore va bene.
 * - dirty dice se ci sono modifiche da salvare (avviso di uscita, Annulla).
 */
import { useCallback, useMemo, useState } from "react";
import { validate, type Validator } from "@/lib/validation";

type FieldSpec = { initial?: string; rules: Validator[]; optional?: boolean };

export function useFormFields<K extends string>(spec: Record<K, FieldSpec>) {
  const names = Object.keys(spec) as K[];
  const [values, setValues] = useState(() =>
    Object.fromEntries(names.map((n) => [n, spec[n].initial ?? ""])) as Record<K, string>,
  );
  const [blurred, setBlurred] = useState<Partial<Record<K, boolean>>>({});

  const errorFor = (name: K, value = values[name]) => (value.trim() === "" ? null : validate(value, spec[name].rules));

  const visibleError = (name: K) => (blurred[name] ? errorFor(name) : null);

  /** true se almeno un valore è diverso da quello iniziale: serve a useUnsavedChanges */
  const dirty = names.some((n) => values[n] !== (spec[n].initial ?? ""));

  const isValid = names.every((n) =>
    values[n].trim() === "" ? Boolean(spec[n].optional) : validate(values[n], spec[n].rules) === null,
  );

  const setValue = useCallback((name: K, value: string) => setValues((v) => ({ ...v, [name]: value })), []);

  /** props pronte per TextField / PasswordField */
  const field = (name: K) => ({
    value: values[name],
    onChange: (value: string) => setValue(name, value),
    onBlur: () => setBlurred((b) => ({ ...b, [name]: true })),
    error: visibleError(name),
  });

  return useMemo(
    () => ({ values, setValue, field, isValid, dirty }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, blurred],
  );
}
