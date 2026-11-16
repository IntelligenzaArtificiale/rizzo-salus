/*
 * Guida «Componenti e mapping» (solo anteprima). Una sezione per volta, scelta dall'indice:
 * percorso decisionale, superfici, card, tabelle, elenchi, stati e feedback, moduli, pagine,
 * assistente, stati di pagina. Ogni componente ha esempio dal vivo e risposte per il mapping.
 */
import { Link, useParams } from "react-router-dom";
import { DevLayout } from "@/pages/dev/DevLayout";
import { DecisionPath } from "@/pages/dev/components/DecisionPath";
import { DocEntry } from "@/pages/dev/components/DocEntry";
import { SECTIONS } from "@/pages/dev/components/sections";
import { SelectField } from "@/components/form/SelectField";
import { useNavigate } from "react-router-dom";

const INDEX = [{ id: "percorso", title: "Percorso decisionale" }, ...SECTIONS.map((s) => ({ id: s.id, title: s.title }))];

export function ComponentsPage() {
  const { sezione = "percorso" } = useParams();
  const navigate = useNavigate();
  const section = SECTIONS.find((s) => s.id === sezione);
  const title = section?.title ?? "Componenti e mapping";

  const nav = (
    <>
      <div className="lg:hidden">
        <SelectField label="Sezione della guida" value={sezione} onChange={(v) => navigate(`/anteprima/componenti/${v}`)} options={INDEX.map((i) => ({ value: i.id, label: i.title }))} />
      </div>
      <nav aria-label="Sezioni della guida" className="hidden flex-col gap-px lg:flex">
        {INDEX.map((i) => (
          <Link key={i.id} to={`/anteprima/componenti/${i.id}`} aria-current={i.id === sezione ? "page" : undefined}
            className={`motion-state rounded-control px-2.5 py-1.5 text-[14px] ${i.id === sezione ? "bg-hover-2 font-medium text-ink" : "text-ink-2 hover:bg-hover hover:text-ink"}`}>
            {i.title}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <DevLayout
      title={title}
      aside={nav}
      intro={section ? section.intro : "Quale componente usare, come collegarlo ai dati e quali errori evitare. Parti dalla domanda: dove si trova la pagina e cosa deve mostrare."}
    >
      <div key={sezione} className="anim-swap flex flex-col gap-10">
        {section ? section.docs.map((d) => <DocEntry key={d.id} doc={d} />) : <DecisionPath />}
      </div>
    </DevLayout>
  );
}
