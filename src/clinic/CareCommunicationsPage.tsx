import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Section } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { Button, buttonVariants } from "@/components/atoms/Button";
import { TextAreaField } from "@/components/form/TextAreaField";
import { SelectField } from "@/components/form/SelectField";
import { api, type Data } from "./api";
import { useLoad, useAction, LoadState, date } from "./common";
export function CareCommunicationsPage() {
  const load = useLoad(() => api("/relazioni/ricontatti"));
  const a = useAction();
  const [v, setV] = useState<Data>({
      testo: "",
      canale: "sms",
      assicurazione: "tutte",
      chiave: crypto.randomUUID(),
    }),
    [preview, setPreview] = useState<Data | null>(null);
  return (
    <LoadState load={load}>
      <PageHeader
        title="Ricontatti e campagne"
        subtitle="Contatti dopo le cure e richieste di recensione con invio manuale."
      />
      <Section title="Contatti da gestire">
        <RowList
          rows={(load.data?.attivita ?? []).map((r: Data) => ({
            key: r.id,
            title:
              r.paziente +
              " · " +
              (r.tipo === "recensione" ? "Recensione" : "Come sta?"),
            meta:
              date(r.data_prevista) +
              " · " +
              (r.errore_configurazione || r.testo),
            actions: (
              <div className="flex flex-wrap gap-2">
                {r.link_whatsapp ? (
                  <a
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                    href={r.link_whatsapp}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Apri messaggio WhatsApp
                  </a>
                ) : (
                  <span className="text-xs text-ink-3">
                    Contatto telefonico:{" "}
                    {r.telefono || "recapito da completare"}
                  </span>
                )}
                <Button
                  disabled={a.busy}
                  onClick={() =>
                    a.act(async () => {
                      await api("/relazioni/completato", { id: r.id });
                      load.reload();
                    }, "Contatto registrato")
                  }
                >
                  Ho contattato il paziente
                </Button>
                <Button
                  variant="quiet"
                  onClick={() =>
                    a.act(async () => {
                      await api("/relazioni/completato", {
                        id: r.id,
                        scarta: true,
                      });
                      load.reload();
                    })
                  }
                >
                  Non contattare
                </Button>
              </div>
            ),
          }))}
        />
        <p className="text-sm text-ink-2">
          L’apertura di WhatsApp non equivale all’invio. Registra il contatto
          solo dopo averlo effettuato. La recensione viene proposta
          separatamente nei giorni successivi.
        </p>
      </Section>
      <Section title="Prepara campagna">
        <TextAreaField
          label="Messaggio"
          value={v.testo}
          onChange={(testo) => {
            setV({ ...v, testo });
            setPreview(null);
          }}
        />
        <SelectField
          label="Canale"
          value={v.canale}
          onChange={(canale) => {
            setV({ ...v, canale });
            setPreview(null);
          }}
          options={["sms", "email", "whatsapp"].map((t) => ({
            value: t,
            label: t,
          }))}
        />
        <SelectField
          label="Copertura assicurativa"
          value={v.assicurazione}
          onChange={(assicurazione) => {
            setV({ ...v, assicurazione });
            setPreview(null);
          }}
          options={["tutte", "nessuna", "privata", "convenzionata"].map(
            (t) => ({ value: t, label: t }),
          )}
        />
        <Button
          disabled={!v.testo || a.busy}
          onClick={() =>
            a.act(async () => setPreview(await api("/relazioni/campagna", v)))
          }
        >
          Verifica destinatari e consensi
        </Button>
        {preview && (
          <>
            <p className="text-sm text-ink">
              {preview.totale} destinatari con consenso promozionale e recapito
              utilizzabile.
            </p>
            <RowList
              rows={preview.destinatari.map((p: Data) => ({
                key: p.id,
                title: p.cognome + " " + p.nome,
              }))}
            />
            <Button
              variant="primary"
              disabled={a.busy || !preview.totale}
              onClick={() =>
                a.act(async () => {
                  await api("/relazioni/campagna", { ...v, approva: true });
                  setPreview(null);
                  setV({ ...v, chiave: crypto.randomUUID() });
                }, "Campagna approvata e accodata")
              }
            >
              Approva campagna
            </Button>
          </>
        )}
      </Section>
    </LoadState>
  );
}
