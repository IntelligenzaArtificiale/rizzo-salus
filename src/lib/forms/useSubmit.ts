/*
 * Invio protetto: un solo invio alla volta anche con doppio clic o Invio ripetuto.
 * busy guida il bottone (testo «Salvataggio», disattivo); il blocco vero è il ref,
 * che vale già prima del nuovo render.
 */
import { useCallback, useRef, useState } from "react";

export function useSubmit() {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const run = useCallback(async <T,>(task: () => Promise<T>): Promise<T | undefined> => {
    if (running.current) return undefined;
    running.current = true;
    setBusy(true);
    try {
      return await task();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
