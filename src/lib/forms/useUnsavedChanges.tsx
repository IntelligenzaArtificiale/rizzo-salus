/*
 * Protezione dalle modifiche perse. Con dirty=true:
 * - navigazione interna (link, Indietro, menu) → conferma «Uscire senza salvare?»;
 * - chiusura o ricarica della scheda → avviso nativo del browser.
 * Dopo un salvataggio riuscito chiamare allowNext() prima di navigare.
 * Richiede il router "data" (App.tsx). Regole: docs/regole-ux.md, «Modifiche non salvate».
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";

export function useUnsavedChanges(dirty: boolean) {
  const skip = useRef(false);
  const dirtyRef = useRef(dirty);
  useLayoutEffect(() => { dirtyRef.current = dirty; }, [dirty]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    dirtyRef.current && !skip.current && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  const allowNext = useCallback(() => { skip.current = true; }, []);

  const dialog = (
    <ConfirmDialog
      open={blocker.state === "blocked"}
      title="Uscire senza salvare?"
      actionLabel="Esci senza salvare"
      onConfirm={() => blocker.proceed?.()}
      onClose={() => blocker.reset?.()}
    >
      Le modifiche fatte in questa pagina andranno perse.
    </ConfirmDialog>
  );

  return { allowNext, dialog };
}
