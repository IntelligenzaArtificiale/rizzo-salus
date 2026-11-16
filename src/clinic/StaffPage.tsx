import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Section } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { ClinicFileField } from "./ClinicFileField";
import { useClinic } from "./ClinicContext";
import { api, download, type Data } from "./api";
import { useLoad, LoadState, useAction, today, date, name } from "./common";
export function StaffPage() {
  const { catalog, can } = useClinic();
  const [month, setMonth] = useState(today().slice(0, 7)),
    [v, setV] = useState<Data>({
      professional_id: "",
      date: today(),
      tipo: "presenza",
      da: "08:00",
      a: "13:00",
      pausa_minuti: 0,
      nota: "",
    }),
    [hours, setHours] = useState("");
  const a = useAction();
  const load = useLoad(
    () => api("/gestione/personale", { mese: month }),
    [month],
  );
  return (
    <LoadState load={load}>
      <PageHeader
        title="Personale"
        subtitle="Ore in agenda, presenze effettive e monte contrattuale. La preparazione è esclusa."
      />
      <TextField label="Mese" type="month" value={month} onChange={setMonth} />
      <Section title="Riepilogo mensile">
        <RowList
          rows={(load.data?.righe ?? []).map((r: Data) => ({
            key: r.professional_id,
            title: r.nome,
            meta:
              "Contratto " +
              (r.contrattuali_min / 60).toFixed(2) +
              " h · Agenda " +
              (r.programmate_min / 60).toFixed(2) +
              " h · Effettive " +
              (r.effettive_min / 60).toFixed(2) +
              " h · Differenza " +
              (r.differenza_min / 60).toFixed(2) +
              " h",
          }))}
        />
        <Button
          onClick={() =>
            a.act(() => download("/gestione/personale-csv", { mese: month }))
          }
        >
          Scarica riepilogo mensile
        </Button>
      </Section>
      {can("personale.presenze") && (
        <Section title="Presenze, assenze e giustificativi">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              a.act(async () => {
                await api("/gestione/presenza", v);
                load.reload();
              }, "Presenza salvata");
            }}
          >
            <SelectField
              label="Professionista"
              value={v.professional_id}
              onChange={(professional_id) => setV({ ...v, professional_id })}
              options={[
                { value: "", label: "Scegli professionista" },
                ...catalog.professionisti.map((p: Data) => ({
                  value: p.id,
                  label: name(p),
                })),
              ]}
            />
            <TextField
              label="Data"
              type="date"
              value={v.date}
              onChange={(date) => setV({ ...v, date })}
            />
            <SelectField
              label="Tipo registrazione"
              value={v.tipo}
              onChange={(tipo) => setV({ ...v, tipo })}
              options={[
                "presenza",
                "ferie",
                "malattia",
                "permesso",
                "assenza",
              ].map((t) => ({ value: t, label: t }))}
            />
            {v.tipo === "presenza" && (
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField
                  label="Entrata"
                  type="time"
                  value={v.da}
                  onChange={(da) => setV({ ...v, da })}
                />
                <TextField
                  label="Uscita"
                  type="time"
                  value={v.a}
                  onChange={(a) => setV({ ...v, a })}
                />
                <TextField
                  label="Pausa in minuti"
                  type="number"
                  value={String(v.pausa_minuti)}
                  onChange={(s) => setV({ ...v, pausa_minuti: Number(s) })}
                />
              </div>
            )}
            <TextField
              label="Nota"
              value={v.nota}
              onChange={(nota) => setV({ ...v, nota })}
            />
            <ClinicFileField
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(f) => setV({ ...v, ...f })}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={a.busy || !v.professional_id}
            >
              Salva registrazione
            </Button>
          </form>
          <form
            className="mt-6 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              a.act(async () => {
                await api("/gestione/contratto", {
                  professional_id: v.professional_id,
                  mese: month,
                  ore: Number(hours),
                });
                load.reload();
              }, "Monte ore aggiornato");
            }}
          >
            <TextField
              label="Monte contrattuale del mese per il professionista selezionato"
              type="number"
              value={hours}
              onChange={setHours}
            />
            <Button
              type="submit"
              disabled={a.busy || !v.professional_id || hours === ""}
            >
              Imposta ore del mese
            </Button>
          </form>
        </Section>
      )}
      {(load.data?.righe ?? []).map((r: Data) => (
        <Section key={r.professional_id} title={"Registrazioni · " + r.nome}>
          <RowList
            rows={r.presenze.map((p: Data) => ({
              key: p.id,
              title: date(p.date) + " · " + p.tipo,
              meta:
                p.tipo === "presenza"
                  ? p.da + "–" + p.a + " · " + (p.minuti / 60).toFixed(2) + " h"
                  : p.nota,
              actions: (
                <div className="flex flex-wrap gap-2">
                  {can("personale.presenze") && (
                    <Button onClick={() => setV(p)}>Modifica</Button>
                  )}
                  {p.giustificativo && (
                    <Button
                      onClick={() =>
                        a.act(() =>
                          download("/gestione/allegato", {
                            tipo: "presenza",
                            id: p.id,
                          }),
                        )
                      }
                    >
                      Giustificativo
                    </Button>
                  )}
                </div>
              ),
            }))}
          />
        </Section>
      ))}
    </LoadState>
  );
}
