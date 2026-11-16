import { SettingsSection } from "@/components/app/SettingsSection";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Button } from "@/components/atoms/Button";
import { api } from "./api";
import { useLoad, useAction } from "./common";
export function IntegrationStatus() {
  const load = useLoad(() => api("/fiscale/stato"));
  const a = useAction();
  return (
    <SettingsSection
      title="Stato dei collegamenti"
      description="La presenza delle credenziali non equivale a una verifica riuscita. Le fatture sanitarie a persone fisiche restano escluse dallo SdI; il Sistema TS usa un flusso distinto con revisione e protocollo."
    >
      <div className="flex flex-wrap gap-2">
        <StatusPill tone={load.data?.aruba.configurata ? "green" : "neutral"}>
          {load.data?.aruba.configurata
            ? "Credenziali Aruba presenti"
            : "Aruba da configurare"}
        </StatusPill>
        <StatusPill
          tone={load.data?.sts.credenziali_presenti ? "green" : "neutral"}
        >
          {load.data?.sts.credenziali_presenti
            ? "Credenziali Sistema TS presenti"
            : "Sistema TS da configurare"}
        </StatusPill>
      </div>
      <Button
        disabled={a.busy || !load.data?.aruba.configurata}
        onClick={() =>
          a.act(async () => {
            await api("/fiscale/verifica-aruba");
            load.reload();
          }, "Autenticazione Aruba verificata. Nessuna fattura inviata.")
        }
      >
        Verifica accesso Aruba
      </Button>
      <p className="text-sm text-ink-2">
        Per il Sistema TS inserisci i codici presenti nella lettera di
        assegnazione e verifica le prestazioni con il commercialista. Scarica il
        pacchetto per controllarlo e approva l’invio solo dopo le prove
        richieste.
      </p>
    </SettingsSection>
  );
}
