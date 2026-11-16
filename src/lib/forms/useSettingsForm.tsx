/*
 * Stato di una scheda di impostazioni salvata con un bottone: copia locale dei valori, dirty,
 * annulla modifiche, invio unico (useSubmit), avviso di uscita (useUnsavedChanges) ed esito con toast.
 * Gli interruttori che si salvano da soli (Moduli) non usano questo hook.
 */
import { useEffect, useState, type FormEvent } from "react";
import { useToast } from "@/components/feedback/toast-context";
import { useSubmit } from "@/lib/forms/useSubmit";
import { useUnsavedChanges } from "@/lib/forms/useUnsavedChanges";

export function useSettingsForm<T>(saved: T, save: (value: T) => Promise<boolean>, successTitle: string) {
  const toast = useToast();
  const [value, setValue] = useState<T>(saved);
  const [base, setBase] = useState<T>(saved);
  const { busy, run } = useSubmit();
  const dirty = JSON.stringify(value) !== JSON.stringify(base);
  const guard = useUnsavedChanges(dirty);

  /* valori arrivati dal server dopo il primo render (caricamento asincrono) */
  const savedKey = JSON.stringify(saved);
  useEffect(() => {
    if (!dirty) { setValue(saved); setBase(saved); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  const patch = (p: Partial<T>) => setValue((v) => ({ ...v, ...p }));
  const reset = () => setValue(base);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    const ok = await run(() => save(value));
    if (ok === undefined) return;
    if (ok) { setBase(value); toast.show({ tone: "success", title: successTitle }); }
    else toast.show({ tone: "error", title: "Modifica non salvata", body: "Riprova tra qualche istante." });
  }

  return { value, setValue, patch, dirty, busy, reset, submit, dialog: guard.dialog };
}
