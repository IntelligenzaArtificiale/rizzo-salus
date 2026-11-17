import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const navigate = useNavigate(), { pathname } = useLocation(), [params] = useSearchParams();
  const mode = pathname.split("/")[2] || "elenco", form = mode !== "elenco", editId = params.get("id");
  const { catalog, can } = useClinic();
  const [month, setMonth] = useState(params.get("mese") || today().slice(0, 7)),
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
  useEffect(() => { if (form && !editId) { setV({ professional_id: "", date: today(), tipo: "presenza", da: "08:00", a: "13:00", pausa_minuti: 0, nota: "" }); setHours(""); } }, [mode, editId]);
  const a = useAction();
  const load = useLoad(
    () => api("/gestione/personale", { mese: month }),
    [month],
  );
  useEffect(() => { if (editId && load.data) { const row = load.data.righe.flatMap((r: Data) => r.presenze).find((r: Data) => r.id === editId); if (row) setV(row); } }, [editId, load.data]);
  return (
    <LoadState load={load}>
      <PageHeader
        title={form ? mode === "contratto" ? "Monte ore contrattuale" : editId ? "Modifica registrazione" : "Nuova registrazione" : "Personale"}
        back={form ? { to: "/personale", label: "Personale" } : undefined}
        actions={!form && can("personale.presenze") ? <div className="flex flex-wrap gap-2"><Button onClick={() => { setV({ professional_id: "", date: today(), tipo: "presenza", da: "08:00", a: "13:00", pausa_minuti: 0, nota: "" }); navigate("/personale/registrazione"); }}>Nuova registrazione</Button><Button onClick={() => navigate("/personale/contratto")}>Monte ore</Button></div> : undefined}
        subtitle="Ore in agenda, presenze effettive e monte contrattuale. La preparazione è esclusa."
      />
      {(!form || mode === "contratto") && <TextField label="Mese" type="month" value={month} onChange={setMonth} />}
      {!form && <Section title="Riepilogo mensile">
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
      </Section>}
      {form && can("personale.presenze") && (
        <Section title="Presenze, assenze e giustificativi">
          {mode === "registrazione" && <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              a.act(async () => {
                await api("/gestione/presenza", v);
                load.reload(); navigate("/personale");
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
              disabled={a.busy || !v.professional_id || !!editId && !v.id}
            >
              Salva registrazione
            </Button>
          </form>}
          {mode === "contratto" && <form
            className="mt-6 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              a.act(async () => {
                await api("/gestione/contratto", {
                  professional_id: v.professional_id,
                  mese: month,
                  ore: Number(hours),
                });
                load.reload(); navigate("/personale");
              }, "Monte ore aggiornato");
            }}
          >
            <SelectField label="Professionista" value={v.professional_id} onChange={professional_id => setV({ ...v, professional_id })} options={[{ value: "", label: "Scegli professionista" }, ...catalog.professionisti.map((p: Data) => ({ value: p.id, label: name(p) }))]} />
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
          </form>}
        </Section>
      )}
      {!form && (load.data?.righe ?? []).map((r: Data) => (
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
                    <Button onClick={() => navigate(`/personale/registrazione?id=${p.id}&mese=${month}`)}>Modifica</Button>
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
