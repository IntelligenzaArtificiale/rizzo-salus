import { useState } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/app/Section";
import { Button, buttonVariants } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { api, type Data } from "./api";
import { useAction } from "./common";
export function InvoiceFiscalActions({
  invoice,
  onChanged,
}: {
  invoice: Data;
  onChanged: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const a = useAction();
  return (
    <Section title="Trasmissioni e revisione">
      <Link className={buttonVariants({ variant: "secondary", size: "sm" })} to="/pacchetti">
        Prepara o verifica il pacchetto per commercialista e Sistema TS
      </Link>
      {(invoice.sanitaria ?? true) ? (
        <p className="text-sm text-ink-2">
          Fattura sanitaria a persona fisica: esclusa dall’invio allo SdI. Il
          tracciato Sistema TS si prepara sulle spese pagate.
        </p>
      ) : (
        <>
          <Button
            disabled={a.busy}
            onClick={() =>
              a.act(async () => {
                await api("/fiscale/aruba", {
                  id: invoice.id,
                  solo_verifica: true,
                });
                onChanged();
              }, "Verifica Aruba completata: consulta l’esito")
            }
          >
            Verifica con Aruba senza trasmettere
          </Button>
          <Button
            disabled={
              a.busy || invoice.aruba?.stato === "preso_in_carico_aruba"
            }
            onClick={() => setConfirm(true)}
          >
            Trasmetti tramite Aruba
          </Button>
          <ConfirmDialog
            open={confirm}
            title="Approvare l’invio ad Aruba?"
            actionLabel="Approva e trasmetti"
            busy={a.busy}
            onClose={() => setConfirm(false)}
            onConfirm={() =>
              a.act(async () => {
                await api("/fiscale/aruba", {
                  id: invoice.id,
                  solo_verifica: false,
                  approva: true,
                });
                setConfirm(false);
                onChanged();
              }, "Risposta del servizio registrata")
            }
          >
            Verifica documento, destinatario e trattamento fiscale. La presa in
            carico del fornitore non equivale alla consegna finale dello SdI.
          </ConfirmDialog>
        </>
      )}
      {invoice.aruba && (
        <StatusPill tone="neutral">
          {invoice.aruba.stato.replaceAll("_", " ")}
        </StatusPill>
      )}
      {invoice.aruba_verifica && (
        <StatusPill tone="neutral">
          {invoice.aruba_verifica.stato.replaceAll("_", " ")}
        </StatusPill>
      )}
    </Section>
  );
}
