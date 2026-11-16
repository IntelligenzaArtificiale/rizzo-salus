// Materiali della demo originale ricomposti con card, scelte e dettagli del boilerplate.
import { Link, useParams } from "react-router-dom";
import { ClipboardCopy, Printer } from "lucide-react";
import { Page } from "@/layouts/AppLayout";
import { SiteLayout } from "@/layouts/SiteLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { CardGrid, EntityCard } from "@/components/app/EntityCard";
import { IconButton } from "@/components/app/IconButton";
import { Section, DetailList } from "@/components/app/Section";
import { PageLoading, PageError } from "@/components/app/PageState";
import { api, type Data } from "./api";
import { useLoad, useAction, date } from "./common";
import materials from "./materials.json";
export function MapPage() {
  return (
    <Page wide>
      <PageHeader
        title="Mappa dei moduli"
        subtitle="Funzioni disponibili e servizi da configurare."
      />
      <CardGrid>
        {materials.modules.map(([id, title, state, description]) => (
          <EntityCard
            key={id}
            title={title}
            description={description}
            to={"/mappa/" + encodeURIComponent(id)}
            status={{
              label:
                state === "ok"
                  ? "Disponibile"
                  : state === "config"
                    ? "Da configurare"
                    : "Da completare",
              tone:
                state === "ok"
                  ? "green"
                  : state === "config"
                    ? "orange"
                    : "neutral",
            }}
          />
        ))}
      </CardGrid>
    </Page>
  );
}
export function ModulePage() {
  const { id } = useParams();
  const m = materials.modules.find((m) => m[0] === id);
  return (
    <Page>
      <PageHeader
        title={m?.[1] || "Modulo non trovato"}
        back={{ to: "/mappa", label: "Mappa dei moduli" }}
      />
      {m && (
        <>
          <Section title="Funzioni">
            <p className="text-[14px] leading-relaxed text-ink">{m[3]}</p>
          </Section>
          <Section title="Stato del modulo">
            <p className="text-[14px] leading-relaxed text-ink-2">{m[4]}</p>
          </Section>
        </>
      )}
    </Page>
  );
}
export function DecisionsPage() {
  const a = useAction();
  const summary = () =>
    materials.agreed_decisions
      .map(([title, text]) => title + "\n" + text)
      .join("\n\n");
  return (
    <Page>
      <PageHeader
        title="Decisioni della riunione"
        subtitle="Rizzo Salus · riunione del 9 novembre e specifiche Calendar del 10 novembre 2026"
        actions={
          <>
            <IconButton
              label="Copia riepilogo"
              icon={<ClipboardCopy size={16} />}
              onClick={() =>
                a.act(
                  () => navigator.clipboard.writeText(summary()),
                  "Riepilogo copiato",
                )
              }
            />
            <IconButton
              label="Stampa riepilogo"
              icon={<Printer size={16} />}
              onClick={() => window.print()}
            />
          </>
        }
      />
      {materials.agreed_decisions.map(([title, text]) => (
        <Section key={title} title={title}>
          <p className="text-sm leading-relaxed text-ink-2">{text}</p>
        </Section>
      ))}
      <Link className="text-sm text-accent underline" to="/impostazioni">
        Apri i parametri della struttura
      </Link>
    </Page>
  );
}
export function PublicWeekPage() {
  const { token } = useParams();
  const pathToken = location.pathname.startsWith("/s/")
    ? location.pathname.split("/").pop()
    : undefined;
  const load = useLoad(
    () => api("/pubblico/settimana", { token: token || pathToken }),
    [token, pathToken],
  );
  const d = load.data;
  return (
    <SiteLayout>
      {load.loading ? (
        <PageLoading />
      ) : load.error ? (
        <PageError
          message="Il link non è più valido. Contatta la segreteria per conoscere i tuoi appuntamenti."
          onRetry={load.reload}
        />
      ) : (
        d && (
          <div className="flex flex-col gap-6">
            <PageHeader
              title={`Buongiorno ${d.nome}`}
              subtitle={`Appuntamenti dal ${date(d.dal)} al ${date(d.al)}`}
            />
            {d.aggiornato_il && (
              <p className="text-[13px] text-ink-2">
                Orari aggiornati al {date(d.aggiornato_il)}.
              </p>
            )}
            {d.giorni.map((g: Data) => (
              <Section key={g.giorno} title={g.giorno}>
                <DetailList
                  items={g.appuntamenti.map((s: Data) => ({
                    label: `${s.dalle}–${s.alle}`,
                    value: s.tipo,
                  }))}
                />
              </Section>
            ))}
            <a
              className="text-accent-ink"
              href={`tel:${d.struttura.telefono.replace(/\s/g, "")}`}
            >
              Chiama per modifiche · {d.struttura.telefono}
            </a>
          </div>
        )
      )}
    </SiteLayout>
  );
}
