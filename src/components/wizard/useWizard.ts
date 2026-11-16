/*
 * Stato di un percorso a passaggi: risposte, passaggio attuale, avanti e indietro.
 * I passaggi visibili si ricalcolano sulle risposte (showIf). Le risposte restano
 * in sessionStorage: ricaricare la pagina non fa perdere nulla. Le password no.
 */
import { useEffect, useMemo, useState } from "react";
import type { RegistrationValues, StepDef } from "@/config/registration-steps";

const visibleSteps = (steps: StepDef[], data: RegistrationValues) => steps.filter((s) => !s.showIf || s.showIf(data));

function load(key: string): RegistrationValues {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "{}") as RegistrationValues;
  } catch {
    return {};
  }
}

function save(key: string, data: RegistrationValues) {
  const safe = Object.fromEntries(Object.entries(data).filter(([k]) => !k.toLowerCase().includes("password")));
  try {
    sessionStorage.setItem(key, JSON.stringify(safe));
  } catch {
    /* archiviazione non disponibile */
  }
}

export function clearWizard(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* niente da pulire */
  }
}

export function useWizard(steps: StepDef[], storageKey: string, initialData: RegistrationValues = {}) {
  const [data, setData] = useState<RegistrationValues>(() => ({ ...load(storageKey), ...initialData }));
  const [stepId, setStepId] = useState(steps[0].id);

  useEffect(() => save(storageKey, data), [storageKey, data]);

  const visible = useMemo(() => visibleSteps(steps, data), [steps, data]);
  const index = Math.max(0, visible.findIndex((s) => s.id === stepId));

  /** salva le risposte del passaggio e va al successivo; restituisce true se era l'ultimo */
  function next(patch: RegistrationValues): { done: boolean; data: RegistrationValues } {
    const merged = { ...data, ...patch };
    setData(merged);
    const list = visibleSteps(steps, merged);
    const at = list.findIndex((s) => s.id === stepId);
    if (at >= list.length - 1) return { done: true, data: merged };
    setStepId(list[at + 1].id);
    window.scrollTo({ top: 0 });
    return { done: false, data: merged };
  }

  const back = index > 0 ? () => setStepId(visible[index - 1].id) : undefined;
  const goTo = (id: string) => setStepId(id);

  return { data, step: visible[index], index, total: visible.length, next, back, goTo };
}
