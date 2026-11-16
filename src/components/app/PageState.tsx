/*
 * Stati di una pagina che carica dati: attesa (LoadingState di Beautiful UI),
 * errore con "Riprova", vuoto con l'azione per cominciare.
 */
import type { ReactNode } from "react";
import LoadingState from "@/components/primitives/LoadingState";
import { Button } from "@/components/atoms/Button";

export function PageLoading({ label = "Caricamento" }: { label?: string }) {
  return (
    <div className="py-10">
      <LoadingState variant="Dots" label={label} />
    </div>
  );
}

/** Errore di caricamento: frase per chi usa la piattaforma, mai il codice d'errore del server. */
export function PageError({ onRetry, message = "Impossibile caricare i dati." }: { onRetry: () => void; message?: string }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-5">
      <p className="text-[14px] text-ink">{message}</p>
      <Button type="button" variant="secondary" size="sm" onClick={onRetry}>Riprova</Button>
    </div>
  );
}

/** Vuoto: cosa manca e cosa fare. Mai «Nessun elemento in questa vista». */
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-line-strong px-5 py-6">
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-medium text-ink">{title}</p>
        {description && <p className="text-[13.5px] text-ink-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}
