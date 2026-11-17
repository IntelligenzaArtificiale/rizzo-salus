import { useState } from "react";
import { Link } from "react-router-dom";
import { SiteLayout } from "@/layouts/SiteLayout";
import { Section } from "@/components/app/Section";
import { Button, buttonVariants } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { Checkbox } from "@/components/form/Checkbox";
import { EmptyState } from "@/components/app/PageState";
import { StatusPill } from "@/components/atoms/StatusPill";
import { api, type Data } from "./api";
import { useLoad, useAction, today } from "./common";
export function PublicBooking() {
  const catalog = useLoad(() => api("/prenota/catalogo"));
  const [v, setV] = useState<Data>({
      therapy_type_id: "",
      date: today(),
      nome: "",
      cognome: "",
      telefono: "",
      email: "",
      data_nascita: "",
      codice_fiscale: "",
      privacy_letta: false,
      risposte: {},
    }),
    [slot, setSlot] = useState<Data | null>(null),
    [otp, setOtp] = useState<Data | null>(null),
    [code, setCode] = useState(""),
    [done, setDone] = useState(false);
  const a = useAction();
  const slots = useLoad(
    () =>
      v.therapy_type_id
        ? api("/prenota/slot", {
            therapy_type_id: v.therapy_type_id,
            date: v.date,
          })
        : Promise.resolve({ slot: [] }),
    [v.therapy_type_id, v.date],
  );
  return (
    <SiteLayout>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-5">
        <h1 className="text-2xl font-semibold text-ink">Prenota una visita</h1>
        <p className="text-sm text-ink-2">
          Scegli una visita medica. Per le terapie contatta la segreteria.
        </p>
        <Link to="/portale" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Accedi ai tuoi appuntamenti
        </Link>
        {catalog.error ? (
          <p role="alert" className="text-red">
            {catalog.error}
          </p>
        ) : done ? (
          <StatusPill tone="green">
            {v.attesa
              ? "Richiesta inserita nella lista d’attesa"
              : "Visita confermata"}
          </StatusPill>
        ) : !catalog.data?.attive ? (
          <EmptyState
            title="Prenotazioni online non disponibili"
            description="Per prenotare contatta la segreteria della struttura."
          />
        ) : otp ? (
          <Section title="Verifica il cellulare">
            <p className="text-sm text-ink-2">
              {otp.modalita === "live"
                ? "Il codice è stato accodato per il tuo cellulare."
                : "Modalità prova: la segreteria può consultare il codice nei messaggi di prova."}
            </p>
            <TextField
              label="Codice di verifica"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={setCode}
            />
            <Button
              variant="primary"
              disabled={a.busy || code.length !== 6}
              onClick={() =>
                a.act(async () => {
                  await api("/prenota/conferma", { ...otp, codice: code });
                  setDone(true);
                })
              }
            >
              Conferma {v.attesa ? "richiesta" : "visita"}
            </Button>
            <Button
              onClick={() => {
                setOtp(null);
                setSlot(null);
                slots.reload();
              }}
            >
              Scegli un altro orario
            </Button>
          </Section>
        ) : (
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              a.act(async () => {
                setOtp(
                  await api("/prenota/richiedi", {
                    ...v,
                    ...slot,
                    start: slot?.start,
                    window_id: slot?.window_id,
                  }),
                );
              });
            }}
          >
            <Section title="Prestazione e disponibilità">
              <SelectField
                label="Visita"
                value={v.therapy_type_id}
                onChange={(therapy_type_id) => {
                  setV({ ...v, therapy_type_id, attesa: false });
                  setSlot(null);
                }}
                options={[
                  { value: "", label: "Scegli una visita" },
                  ...(catalog.data?.servizi ?? []).map((t: Data) => ({
                    value: t.id,
                    label:
                      t.nome +
                      " · " +
                      t.durata_min +
                      " minuti" +
                      (t.tariffa !== undefined ? " · " + t.tariffa + " €" : ""),
                  })),
                ]}
              />
              <TextField
                label="Giorno"
                type="date"
                min={today()}
                value={v.date}
                onChange={(date) => {
                  setV({ ...v, date, attesa: false });
                  setSlot(null);
                }}
              />
              {slots.error && <p className="text-red">{slots.error}</p>}
              <div className="flex flex-wrap gap-2">
                {slots.data?.slot.map((s: Data) => (
                  <Button
                    key={s.window_id + s.start}
                    type="button"
                    variant={
                      slot?.window_id === s.window_id && slot?.start === s.start
                        ? "primary"
                        : "secondary"
                    }
                    onClick={() => {
                      setSlot(s);
                      setV({ ...v, attesa: false });
                    }}
                  >
                    {s.start.slice(11, 16)}
                    {s.professionista ? " · " + s.professionista : ""}
                  </Button>
                ))}
              </div>
              {v.therapy_type_id && (
                <Checkbox
                  label="Preferisco essere ricontattato dalla lista d’attesa"
                  checked={Boolean(v.attesa)}
                  onChange={(attesa) => {
                    setV({ ...v, attesa });
                    setSlot(null);
                  }}
                />
              )}
            </Section>
            <Section title="I tuoi dati">
              <div className="grid gap-x-4 sm:grid-cols-2">
                {[
                  ["nome", "Nome", "text"],
                  ["cognome", "Cognome", "text"],
                  ["telefono", "Cellulare", "tel"],
                  ["email", "Email", "email"],
                  ["data_nascita", "Data di nascita", "date"],
                  ["codice_fiscale", "Codice fiscale (facoltativo)", "text"],
                ].map(([k, label, type]) => (
                  <TextField
                    key={k}
                    label={label}
                    type={type}
                    value={v[k]}
                    onChange={(s) => setV({ ...v, [k]: s })}
                  />
                ))}
              </div>
              {catalog.data?.domande.map((q: Data, i: number) => (
                <TextField
                  key={i}
                  label={q.testo + (q.obbligatoria ? " *" : "")}
                  value={v.risposte[i] ?? ""}
                  onChange={(s) =>
                    setV({ ...v, risposte: { ...v.risposte, [i]: s } })
                  }
                />
              ))}
            </Section>
            <Section title="Informativa">
              <p className="whitespace-pre-wrap text-sm text-ink-2">
                {catalog.data?.informativa}
              </p>
              <Checkbox
                label="Ho letto l’informativa per la prenotazione"
                checked={v.privacy_letta}
                onChange={(privacy_letta) => setV({ ...v, privacy_letta })}
              />
            </Section>
            <Button
              variant="primary"
              type="submit"
              disabled={
                a.busy ||
                !v.privacy_letta ||
                !v.nome ||
                !v.cognome ||
                !v.telefono ||
                !v.data_nascita ||
                (!slot && !v.attesa)
              }
            >
              Ricevi codice di verifica
            </Button>
          </form>
        )}
      </div>
    </SiteLayout>
  );
}
