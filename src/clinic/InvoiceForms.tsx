// Creazione della bozza e nota di credito: pagine dedicate sui componenti del boilerplate.
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/app/PageHeader";
import { Section } from "@/components/app/Section";
import { SelectField } from "@/components/form/SelectField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { Checkbox } from "@/components/form/Checkbox";
import { FormActions } from "@/components/form/FormActions";
import { EmptyState } from "@/components/app/PageState";
import { useFormFields } from "@/lib/forms/useFormFields";
import { useUnsavedChanges } from "@/lib/forms/useUnsavedChanges";
import { api, type Data } from "./api";
import { LoadState, useLoad, useAction, money, name } from "./common";
export function NewInvoicePage() {
  const [params] = useSearchParams();
  const initial = params.get("paziente") || "";
  const [pid, setPid] = useState(initial),
    [selected, setSelected] = useState<string[]>([]),
    navigate = useNavigate(),
    a = useAction();
  const patients = useLoad(async () => {
    const list = await api("/pazienti/cerca", { q: "", limite: 50 });
    if (initial && !list.risultati.some((p:Data) => p.id === initial)) list.risultati.push(await api("/pazienti/dettaglio", {id:initial}));
    return list;
  }, [initial]);
  const lines = useLoad(
    () =>
      pid
        ? api("/fatture/proponi", { patient_id: pid })
        : Promise.resolve({ righe: [] }),
    [pid],
  );
  const free: Data[] = (lines.data?.righe || []).filter(
    (x: Data) => !x.gia_fatturata,
  );
  const guard = useUnsavedChanges(Boolean(pid));
  // La prima creazione restituisce una bozza: eventuali errori di emissione non producono copie duplicate.
  return (
    <LoadState load={patients}>
      <PageHeader
        title="Nuova fattura"
        subtitle="Seleziona un paziente e le prestazioni da fatturare."
        back={{ to: "/fatture", label: "Fatturazione" }}
      />
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          const chosen = free.filter((_, i) => selected.includes(String(i)));
          if (!chosen.length) return;
          a.act(async () => {
            const d = await api("/fatture/bozza-salva", {
              patient_id: pid,
              righe: chosen,
            });
            guard.allowNext();
            navigate("/fatture/" + d.id);
          }, "Bozza pronta per l’emissione");
        }}
      >
        <SelectField
          label="Paziente"
          value={pid}
          onChange={(s) => {
            setPid(s);
            setSelected([]);
          }}
          options={[
            { value: "", label: "Scegli un paziente" },
            ...(patients.data?.risultati || []).map((p: Data) => ({
              value: p.id,
              label: name(p),
            })),
          ]}
        />
        {pid &&
          (lines.loading ? (
            <p className="text-[14px] text-ink-2">Cerco le prestazioni…</p>
          ) : lines.error ? (
            <p role="alert" className="text-red">
              {lines.error}
            </p>
          ) : free.length ? (
            <Section title="Prestazioni da fatturare">
              <Checkbox label="Seleziona tutte le prestazioni" checked={selected.length === free.length} onChange={on=>setSelected(on ? free.map((_,i)=>String(i)) : [])} />
              <div className="divide-y divide-line">
                {free.map((x, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <Checkbox
                      label={x.descrizione}
                      checked={selected.includes(String(i))}
                      onChange={(v) =>
                        setSelected((s) =>
                          v
                            ? [...s, String(i)]
                            : s.filter((k) => k !== String(i)),
                        )
                      }
                    />
                    <span className="shrink-0 text-[14px] tabular-nums text-ink">
                      {money(Math.round(x.prezzo * 100))}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          ) : (
            <EmptyState
              title="Nessuna prestazione da fatturare"
              description="Compaiono qui solo le prestazioni eseguite e non già fatturate."
            />
          ))}
        <p className="text-[13px] text-ink-2">
          Totale, bollo e numerazione vengono verificati prima dell’emissione.
        </p>
        <FormActions
          submitLabel="Crea bozza"
          busy={a.busy}
          disabled={!pid || !selected.length || lines.loading}
          cancelTo="/fatture"
        />
      </form>
      {guard.dialog}
    </LoadState>
  );
}
export function CreditNotePage() {
  const { id } = useParams(),
    a = useAction(),
    navigate = useNavigate();
  const f = useFormFields({
    motivo: {
      rules: [
        (v) => (v.length <= 300 ? null : "Usa al massimo 300 caratteri."),
      ],
    },
  });
  const guard = useUnsavedChanges(f.dirty);
  return (
    <LoadState load={{ loading: false, error: "", reload: () => {} }}>
      <PageHeader
        title="Nota di credito"
        subtitle="La conferma emette una nota di credito e storna la fattura."
        back={{ to: "/fatture/" + id, label: "Fattura" }}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (f.isValid)
            a.act(async () => {
              const n = await api("/fatture/nota-credito", {
                id,
                motivo: f.values.motivo,
              });
              guard.allowNext();
              navigate("/fatture/" + n.id);
            }, "Nota di credito emessa");
        }}
        className="flex flex-col gap-5"
      >
        <TextAreaField
          label="Motivo dello storno"
          maxLength={300}
          {...f.field("motivo")}
        />
        <FormActions
          submitLabel="Emetti nota di credito"
          busy={a.busy}
          disabled={!f.isValid}
          cancelTo={"/fatture/" + id}
        />
      </form>
      {guard.dialog}
    </LoadState>
  );
}
