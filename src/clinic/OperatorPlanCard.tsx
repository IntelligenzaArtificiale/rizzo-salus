import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ClipboardCheck, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/atoms/Button";
import { api, type Data } from "./api";
import { date } from "./common";
const display = (value: string) => /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/.test(value)
  ? `${date(value.slice(0, 10))}${value.length > 10 ? ` · ${value.slice(11, 16)}` : ""}` : value;

/** La conferma trasmette soltanto l'ID del piano conservato sul server. */
export function OperatorPlanCard({ plan, onChanged, onBusy, blocked = false }: { plan: Data; onChanged: (plan: Data) => void; onBusy: (busy: boolean) => void; blocked?: boolean }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const applied = plan.stato === "applicato", closed = applied || plan.stato === "scartato";
  const items: Data[] = applied ? plan.risultati : plan.anteprima;
  const act = async (confirm: boolean) => {
    if (busy || blocked || closed) return;
    setBusy(true); onBusy(true); setError("");
    try {
      const result = confirm
        ? await api("/assistente/conferma", { id: plan.id, conferma: true })
        : await api("/assistente/scarta", { id: plan.id });
      onChanged(result);
    }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); onBusy(false); }
  };
  return <section className="mt-4 flex flex-col gap-4 rounded-card bg-inset p-4 sm:p-5" aria-label="Piano operatore AI">
    <div className="flex items-start gap-3">
      {applied ? <Check size={20} className="mt-0.5 shrink-0 text-green" /> : <ClipboardCheck size={20} className="mt-0.5 shrink-0 text-ink-2" />}
      <div><h3 className="text-sm font-semibold text-ink">{applied ? "Modifiche applicate" : plan.stato === "scartato" ? "Piano scartato" : "Controlla le modifiche"}</h3>
        <p className="mt-1 text-xs text-ink-2">{closed ? (applied ? "I dati sono stati salvati nel gestionale." : "Nessuna modifica è stata applicata.") : `${items.length} ${items.length === 1 ? "operazione pronta" : "operazioni pronte"}. Il salvataggio avviene solo dopo la conferma.`}</p></div>
    </div>
    <ol className="flex flex-col gap-3">{items.map((item, i) => <li key={i} className="rounded-control bg-surface p-3 text-sm">
      <p className="font-medium text-ink">{item.titolo}</p>{item.soggetto && <p className="mt-1 text-ink-2">{item.soggetto}</p>}
      <dl className="mt-2 grid grid-cols-[minmax(90px,0.65fr)_minmax(0,1.5fr)] gap-x-3 gap-y-1.5 text-xs">
        {item.dettagli.map((d: Data, n: number) => <div key={n} className="contents"><dt className="text-ink-2">{d.campo}</dt><dd className="min-w-0 break-words text-ink">
          {d.prima && d.prima !== d.dopo && <><span className="text-ink-2 line-through">{display(d.prima)}</span><span aria-hidden="true"> → </span></>}{display(d.dopo) || "Vuoto"}</dd></div>)}
      </dl>{applied && item.link && <Link className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-3`} to={item.link}>Apri nel gestionale</Link>}
    </li>)}</ol>
    {error && <p role="alert" className="text-sm text-red">{error}</p>}
    {!closed && <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="primary" disabled={busy || blocked} onClick={() => act(true)}><Check size={15} />{busy ? "Attendi…" : "Conferma e applica"}</Button>
      <Button type="button" variant="secondary" disabled={busy || blocked} onClick={() => act(false)}><X size={15} />Scarta piano</Button>
      <span className="text-xs text-ink-2">Valido fino alle {new Date(plan.scade).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span></div>}
  </section>;
}
