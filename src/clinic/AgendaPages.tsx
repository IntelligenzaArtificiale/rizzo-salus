import { CopySelection } from "./CopySelection";
import { GroupParticipants } from "./GroupParticipants";
// Agenda e copia con contratti originali; i dettagli sono pagine, non modali.
import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, buttonVariants } from "@/components/atoms/Button";
import { CalendarClock, MoveRight } from "lucide-react";
import { DetailList, Section } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { EmptyState } from "@/components/app/PageState";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import {
  LoadState,
  useLoad,
  useAction,
  monday,
  today,
  addDays,
  date,
  name,
  StatePill,
} from "./common";
export { AgendaPage } from "./AgendaPage";
export function AppointmentPage() {
  const { id } = useParams(),
    [params] = useSearchParams();
  const day = params.get("giorno") || today();
  const { catalog, can } = useClinic(),
    a = useAction();
  const [confirm, setConfirm] = useState(false);
  const load = useLoad(async () => {
    const r = await api("/agenda/vista", { da: day, a: day, annullati: true });
    const found = r.appuntamenti.find((x: Data) => x.id === id);
    if (!found) throw new Error("Appuntamento non trovato. Torna all’agenda.");
    return found;
  }, [id, day]);
  const item = load.data,
    pro = catalog.professionisti.find(
      (p: Data) => p.id === item?.professional_id,
    ),
    therapy = catalog.terapie.find((t: Data) => t.id === item?.therapy_type_id);
  const state = (stato: string) =>
    a.act(async () => {
      await api("/agenda/stato", { id, stato });
      load.reload();
    });
  return (
    <LoadState load={load}>
      {item && (
        <>
          <PageHeader
            title={item.tipo === "nota" ? item.titolo || "Appunto" : therapy?.nome || "Appuntamento"}
            back={{ to: `/agenda?settimana=${monday(day)}`, label: "Agenda" }}
            subtitle={`${date(item.start.slice(0, 10))} · ${item.start.slice(11, 16)}–${item.end.slice(11, 16)}`}
          />
          <DetailList
            items={[
              {
                label: "Paziente",
                value:
                  Object.values(item.pazienti_nomi || {}).join(", ") ||
                  item.nota ||
                  "—",
              },
              { label: "Professionista", value: pro ? name(pro) : "—" },
              { label: "Sala e attrezzature", value: [...new Set([item.resource_id, ...(item.resource_ids || [])].filter(Boolean))].map((id) => catalog.risorse.find((r: Data) => r.id === id)?.nome || "Risorsa non disponibile").join(", ") || "Non richieste" },
              { label: "Durata", value: `${Math.round((new Date(item.end).getTime() - new Date(item.start).getTime()) / 60000)} minuti` },
              { label: "Impegno del professionista", value: item.impegna_operatore === false ? (item.durata_operatore_minuti ? `${item.durata_operatore_minuti} minuti iniziali` : "Senza operatore dedicato 1:1") : "Per tutta la durata" },
              { label: "Stato", value: <StatePill value={item.stato} /> },
            ]}
          />
          {can("fatture.gestisci") && <div className="flex flex-wrap gap-2">{Object.entries(item.pazienti_nomi || {}).map(([pid,label]) => <Link key={pid} className={buttonVariants({variant:"secondary",size:"sm"})} to={"/fatture/nuova?paziente="+pid}>Fattura prestazioni · {String(label)}</Link>)}</div>}
          {(item.segnali || []).length > 0 && (
            <Section title="Percorso di cura">
              <DetailList
                items={item.segnali.map((s: Data, i: number) => ({
                  label: item.pazienti_nomi?.[s.patient_id] || `Seduta ${i + 1}`,
                  value: `${s.numero || "—"} di ${s.previste || "—"}${s.prima ? " · Prima seduta" : ""}${s.ultima ? " · Ultima seduta" : ""}`,
                }))}
              />
            </Section>
          )}
          {item.tipo === "gruppo" && (
            <GroupParticipants appointment={item} onSaved={load.reload} />
          )}
          {item.stato !== "annullato" && (
            <div className="flex flex-wrap gap-2">
              {can("agenda.segna_eseguita") && (
                <>
                  <Button
                    variant="primary"
                    disabled={a.busy}
                    onClick={() => state("eseguito")}
                  >
                    Segna eseguita
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={a.busy}
                    onClick={() => state("assente")}
                  >
                    Segna assente
                  </Button>
                </>
              )}
              {can("agenda.modifica") && (
                <>
                  <Link
                    to={`/agenda/${id}/modifica?giorno=${day}`}
                    className={buttonVariants({ variant: "secondary" })}
                  >
                    <MoveRight size={16} aria-hidden="true" />
                    Sposta appuntamento
                  </Link>
                  <Link
                    className={buttonVariants({ variant: "secondary" })}
                    to={`/agenda/${id}/proposte-spostamento`}
                  >
                    <CalendarClock size={16} aria-hidden="true" />
                    Proponi nuovi orari
                  </Link>
                  <Button variant="secondary" className="text-red" disabled={a.busy} onClick={() => setConfirm(true)}>
                    Annulla appuntamento
                  </Button>
                </>
              )}
            </div>
          )}
          <ConfirmDialog
            open={confirm}
            title="Annullare l’appuntamento?"
            actionLabel="Annulla appuntamento"
            busy={a.busy}
            onClose={() => setConfirm(false)}
            onConfirm={() =>
              a.act(async () => {
                await api("/agenda/annulla", { id });
                setConfirm(false);
                load.reload();
              })
            }
          >
            La seduta sarà rimossa dagli appuntamenti attivi.
          </ConfirmDialog>
        </>
      )}
    </LoadState>
  );
}
const reasons: Record<string, string> = {
  sedute_esaurite: "Ciclo concluso",
  gia_copiato: "Appuntamento già copiato",
  festivo_o_chiusura: "Giorno festivo o chiuso",
  professionista_assente: "Professionista assente",
  episodio_chiuso: "Percorso chiuso",
  episodio_sospeso: "Percorso sospeso",
  riga_completata: "Terapia completata",
};
export function CopyWeekPage() {
  const [params] = useSearchParams(),
    week = params.get("settimana") || monday(today()),
    navigate = useNavigate();
  const load = useLoad(
    () => api("/agenda/copia-anteprima", { settimana: week }),
    [week],
  );
  const d = load.data;
  return (
    <LoadState load={load}>
      <PageHeader
        title="Copia settimana"
        subtitle={`Dal ${date(week)} alla settimana del ${date(addDays(week, 7))}`}
        back={{ to: `/agenda?settimana=${week}`, label: "Agenda" }}
      />
      {d && (
        <>
          <DetailList
            items={[
              { label: "Da copiare", value: d.copiati.length },
              { label: "Esclusi", value: d.esclusi.length },
              { label: "Conflitti", value: d.conflitti.length },
            ]}
          />
          <Section title="Appuntamenti esclusi">
            {d.esclusi.length ? (
              <RowList
                rows={d.esclusi.map((x: Data, i: number) => ({
                  key: String(i),
                  to: "#",
                  title: reasons[x.motivo] || "Appuntamento non copiabile",
                  meta: `${date(x.start?.slice(0, 10))} · ${x.start?.slice(11, 16) || ""}`,
                }))}
              />
            ) : (
              <EmptyState title="Nessuna esclusione" />
            )}
          </Section>
          {d.conflitti.length > 0 && (
            <Section title="Conflitti">
              <p className="text-[14px] text-ink-2">
                {d.conflitti.length} appuntamenti non possono occupare gli
                stessi spazi. Saranno applicati i controlli dell’agenda.
              </p>
            </Section>
          )}
          <CopySelection
            data={d}
            week={week}
            onDone={() => navigate(`/agenda?settimana=${addDays(week, 7)}`)}
          />
        </>
      )}
    </LoadState>
  );
}
