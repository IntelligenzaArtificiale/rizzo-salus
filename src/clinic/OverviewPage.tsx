// Panoramica operativa: solo appuntamenti e riepiloghi reali consentiti al ruolo.
import { CalendarDays, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { IconButton } from "@/components/app/IconButton";
import { StatTile } from "@/components/charts/StatTile";
import { ChartCard } from "@/components/charts/ChartCard";
import { BarList } from "@/components/charts/BarList";
import { EntityCard } from "@/components/app/EntityCard";
import { Section } from "@/components/app/Section";
import { EmptyState } from "@/components/app/PageState";
import { RowList } from "@/components/app/RowList";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { LoadState, useLoad, today, monday, addDays, money } from "./common";
import { AppointmentList } from "./AppointmentList";
import { endedWithoutOutcome } from "./schedule";
export function OverviewPage() {
  const { can, catalog } = useClinic();
  const day = today(),
    week = monday(day);
  const canFinance =
    can("statistiche.economiche") || can("statistiche.economiche_proprie");
  const hasAgenda = can("agenda.vedi_tutto") || can("agenda.vedi_propria");
  const load = useLoad(async () => {
    const [agenda, invoices, messages] = await Promise.all([
      hasAgenda
        ? api("/agenda/vista", {
            da: week,
            a: addDays(week, 6),
            annullati: true,
          })
        : Promise.resolve({ appuntamenti: [] }),
      can("fatture.gestisci")
        ? api("/fatture/elenco")
        : Promise.resolve({ fatture: [] }),
      can("messaggi.invia")
        ? api("/comunicazioni/messaggi")
        : Promise.resolve({ messaggi: [] }),
    ]);
    return { agenda, invoices, messages };
  }, [day]);
  const all: Data[] = load.data?.agenda.appuntamenti || [];
  const active = all.filter(
    (a) => a.tipo !== "nota" && a.stato !== "annullato",
  );
  const daily = active.filter((a) => a.start.startsWith(day));
  const unmarked = daily.filter(endedWithoutOutcome);
  const invoices: Data[] = load.data?.invoices.fatture || [];
  const unpaid = invoices.filter(
    (f) => f.stato === "emessa" && f.tipo === "fattura",
  );
  const pending: Data[] = (load.data?.messages.messaggi || []).filter(
    (m: Data) => ["bozza", "in_coda", "errore"].includes(m.status),
  );
  const bars = catalog.professionisti
    .map((p: Data) => ({
      label: [p.nome, p.cognome].join(" "),
      value: active.filter(
        (a) => a.professional_id === p.id && a.stato !== "assente",
      ).length,
    }))
    .filter((r: { value: number }) => r.value > 0);
  return (
    <LoadState load={load} wide>
      <PageHeader
        title="Panoramica"
        subtitle={new Date(day + "T12:00:00").toLocaleDateString("it-IT", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        actions={
          hasAgenda ? (
            <IconButton
              label="Apri agenda"
              icon={<CalendarDays size={17} />}
              to="/agenda"
            />
          ) : undefined
        }
      />
      <div
        className={`grid gap-3 ${hasAgenda ? "grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"}`}
      >
        {hasAgenda && (
          <>
            <StatTile
              label="Appuntamenti oggi"
              value={String(daily.filter((a) => a.stato !== "assente").length)}
            />
            <StatTile
              label="Eseguiti oggi"
              value={String(daily.filter((a) => a.stato === "eseguito").length)}
            />
            <StatTile
              label="Questa settimana"
              value={String(active.filter((a) => a.stato !== "assente").length)}
            />
          </>
        )}
        {can("fatture.gestisci") ? (
          <StatTile
            label={canFinance ? "Da incassare" : "Fatture da incassare"}
            value={
              canFinance
                ? money(unpaid.reduce((sum, f) => sum + f.totale_cents, 0))
                : String(unpaid.length)
            }
          />
        ) : hasAgenda ? (
          <StatTile
            label="Esiti da registrare"
            value={String(unmarked.length)}
          />
        ) : null}
      </div>
      {hasAgenda && unmarked.length > 0 && can("agenda.segna_eseguita") && (
        <EntityCard
          title={`${unmarked.length} ${unmarked.length === 1 ? "seduta terminata" : "sedute terminate"} senza esito`}
          eyebrow="Da completare oggi"
          description="Registra le sedute eseguite o le assenze per aggiornare i percorsi dei pazienti."
          to={`/agenda?giorno=${day}&vista=Giorno&esiti=1`}
          status={{ label: "Da aggiornare", tone: "orange" }}
        />
      )}
      {hasAgenda && (
        <Section
          title={
            can("agenda.vedi_tutto")
              ? "Appuntamenti di oggi"
              : "I tuoi appuntamenti di oggi"
          }
          aside={
            <IconButton
              label="Apri la giornata"
              icon={<ArrowUpRight size={16} />}
              to={`/agenda?giorno=${day}&vista=Giorno`}
            />
          }
        >
          {daily.length ? (
            <AppointmentList items={daily} onChanged={load.reload} />
          ) : (
            <EmptyState
              title="Nessun appuntamento oggi"
              description="La tua agenda è libera per questa giornata."
            />
          )}
        </Section>
      )}
      {(pending.length > 0 || unpaid.length > 0) && (
        <Section title="Da gestire">
          <RowList
            rows={[
              ...(pending.length
                ? [
                    {
                      key: "messaggi",
                      title: "Comunicazioni in attesa",
                      meta: `${pending.length} messaggi da gestire`,
                      to: "/comunicazioni",
                    },
                  ]
                : []),
              ...(unpaid.length
                ? [
                    {
                      key: "fatture",
                      title: "Fatture da incassare",
                      meta: `${unpaid.length} fatture emesse`,
                      aside: canFinance
                        ? money(unpaid.reduce((s, f) => s + f.totale_cents, 0))
                        : undefined,
                      to: "/fatture",
                    },
                  ]
                : []),
            ]}
          />
        </Section>
      )}
      {hasAgenda && bars.length > 1 && (
        <ChartCard
          title="La settimana per professionista"
          subtitle="Appuntamenti previsti, escluse assenze e cancellazioni."
          rows={bars}
          unit="Appuntamenti"
        >
          <BarList rows={bars} unit="appuntamenti" />
        </ChartCard>
      )}
      {!hasAgenda && !invoices.length && (
        <EmptyState
          title="Nessuna fattura da gestire"
          description="Le fatture della struttura saranno disponibili nella sezione Fatturazione."
        />
      )}
    </LoadState>
  );
}
