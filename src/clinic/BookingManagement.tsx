import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { WaitlistForm } from "./WaitlistForm";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Section } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { Checkbox } from "@/components/form/Checkbox";
import { StatusPill } from "@/components/atoms/StatusPill";
import { useClinic } from "./ClinicContext";
import { api, type Data } from "./api";
import { useAction, useLoad, LoadState, today, date, name } from "./common";
export function BookingManagement() {
  const navigate = useNavigate(), mode = useLocation().pathname.split("/")[2] || "elenco", [params] = useSearchParams(), editId = params.get("id");
  const { catalog, user, can } = useClinic();
  const load = useLoad(async () => ({
    ...(await api("/prenotazioni/finestre")),
    ...(can("prenotazioni.liste_attesa")
      ? await api("/prenotazioni/gestione")
      : {}),
  }));
  const [v, setV] = useState<Data>({
    professional_id: user?.professional_id ?? "",
    therapy_type_id: "",
    date: today(),
    da: "09:00",
    a: "13:00",
    pubblicata: true,
  });
  useEffect(() => { if (mode === "disponibilita") { const row = load.data?.finestre.find((r: Data) => r.id === editId); if (row) setV(row); else if (!editId) setV({ professional_id: user?.professional_id || "", therapy_type_id: "", date: today(), da: "09:00", a: "13:00", pubblicata: true }); } }, [mode, editId, load.data]);
  const a = useAction();
  return (
    <LoadState load={load}>
      <PageHeader
        title={mode === "elenco" ? "Prenotazioni e attesa" : mode === "attesa" ? "Nuova richiesta in attesa" : editId ? "Modifica disponibilità" : "Nuova disponibilità"}
        back={mode !== "elenco" ? { to: "/prenotazioni", label: "Prenotazioni e attesa" } : undefined}
        actions={mode === "elenco" ? <div className="flex flex-wrap gap-2"><Button onClick={() => navigate("/prenotazioni/disponibilita")}>Nuova disponibilità</Button>{can("prenotazioni.liste_attesa") && <Button onClick={() => navigate("/prenotazioni/attesa")}>Aggiungi in attesa</Button>}</div> : undefined}
        subtitle="Pubblica le disponibilità mediche e gestisci le richieste."
      />
      {mode !== "attesa" && <Section title="Disponibilità mediche">
        {mode === "disponibilita" && <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            a.act(async () => {
              await api("/prenotazioni/finestra-salva", v);
              load.reload(); navigate("/prenotazioni");
            }, "Disponibilità salvata");
          }}
        >
          <SelectField
            label="Medico"
            value={v.professional_id}
            onChange={(professional_id) => setV({ ...v, professional_id })}
            options={[
              { value: "", label: "Scegli medico" },
              ...catalog.professionisti
                .filter(
                  (p: Data) =>
                    p.tipo === "medico" &&
                    (can("prenotazioni.liste_attesa") ||
                      p.id === user?.professional_id),
                )
                .map((p: Data) => ({ value: p.id, label: name(p) })),
            ]}
          />
          <SelectField
            label="Visita"
            value={v.therapy_type_id}
            onChange={(therapy_type_id) => setV({ ...v, therapy_type_id })}
            options={[
              { value: "", label: "Scegli visita" },
              ...catalog.terapie
                .filter((t: Data) => t.categoria === "visita")
                .map((t: Data) => ({ value: t.id, label: t.nome })),
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField
              label="Data"
              type="date"
              min={today()}
              value={v.date}
              onChange={(date) => setV({ ...v, date })}
            />
            <TextField
              label="Dalle"
              type="time"
              value={v.da}
              onChange={(da) => setV({ ...v, da })}
            />
            <TextField
              label="Alle"
              type="time"
              value={v.a}
              onChange={(a) => setV({ ...v, a })}
            />
          </div>
          <Checkbox
            label="Pubblica online (richiede attivazione nelle impostazioni)"
            checked={v.pubblicata}
            onChange={(pubblicata) => setV({ ...v, pubblicata })}
          />
          <Button
            variant="primary"
            type="submit"
            disabled={a.busy || !v.professional_id || !v.therapy_type_id}
          >
            Salva disponibilità
          </Button>
        </form>}
        {mode === "elenco" && <RowList
          rows={(load.data?.finestre ?? []).map((w: Data) => ({
            key: w.id,
            title: date(w.date) + " · " + w.da + "–" + w.a,
            meta: catalog.terapie.find((t: Data) => t.id === w.therapy_type_id)
              ?.nome,
            actions: (
              <div className="flex gap-2">
                <StatusPill tone={w.pubblicata ? "green" : "neutral"}>
                  {w.pubblicata ? "Pubblicata" : "Riservata"}
                </StatusPill>
                <Button onClick={() => navigate("/prenotazioni/disponibilita?id=" + w.id)}>Modifica</Button>
              </div>
            ),
          }))}
        />}
      </Section>}
      {can("prenotazioni.liste_attesa") && (
        <>
          {mode === "attesa" && <WaitlistForm onSaved={() => { load.reload(); navigate("/prenotazioni"); }} />}
          {mode === "elenco" && <>
          <Section title="Richieste e avvisi">
            <RowList
              rows={(load.data?.avvisi ?? []).map((n: Data) => ({
                key: n.id,
                title: n.titolo,
                meta:
                  (n.motivo ?? (n.date ? date(n.date) : "")) +
                  (n.candidati?.length
                    ? " · Da ricontattare: " +
                      n.candidati.map((w: Data) => w.paziente).join(", ")
                    : ""),
                to: n.patient_id ? "/pazienti/" + n.patient_id : undefined,
                actions: (
                  <Button
                    onClick={() =>
                      a.act(async () => {
                        await api("/prenotazioni/gestisci", {
                          tipo: "avviso",
                          id: n.id,
                          stato: "gestita",
                          revision: n.revision,
                        });
                        load.reload();
                      }, "Avviso gestito")
                    }
                  >
                    Segna gestito
                  </Button>
                ),
              }))}
            />
            <p className="text-sm text-ink-2">
              Per le disdette, contatta il paziente e modifica l’agenda prima di
              chiudere l’avviso.
            </p>
          </Section>
          <Section title="Lista d’attesa">
            <RowList
              rows={(load.data?.attese ?? []).map((w: Data) => ({
                key: w.id,
                title: w.paziente,
                meta:
                  (catalog.terapie.find((t: Data) => t.id === w.therapy_type_id)
                    ?.nome ?? "Visita") +
                  " · " +
                  (w.telefono ?? ""),
                actions: (
                  <SelectField
                    label="Stato richiesta"
                    compact
                    value={w.stato}
                    onChange={(stato) =>
                      a.act(async () => {
                        await api("/prenotazioni/gestisci", {
                          tipo: "attesa",
                          id: w.id,
                          stato,
                          revision: w.revision,
                        });
                        load.reload();
                      })
                    }
                    options={[
                      "in_attesa",
                      "contattato",
                      "prenotato",
                      "chiuso",
                    ].map((t) => ({ value: t, label: t.replaceAll("_", " ") }))}
                  />
                ),
              }))}
            />
          </Section></>}
        </>
      )}
    </LoadState>
  );
}
