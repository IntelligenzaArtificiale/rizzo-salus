/* Parti testuali di una scheda: uso (quando sì / quando no / varianti / personalizzazioni), props, errori comuni. */
import { Check, X } from "lucide-react";
import type { ComponentDoc } from "@/pages/dev/components/types";

function List({ title, items, tone }: { title: string; items: string[]; tone: "yes" | "no" | "plain" }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-[13px] font-semibold text-ink">{title}</h4>
      <ul className="flex flex-col gap-1.5">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-[14px] leading-relaxed text-ink-2">
            {tone === "yes" && <Check size={15} className="mt-[3px] shrink-0 text-green" aria-hidden />}
            {tone === "no" && <X size={15} className="mt-[3px] shrink-0 text-red" aria-hidden />}
            {tone === "plain" && <span aria-hidden className="mt-[9px] size-1 shrink-0 rounded-full bg-ink-3" />}
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocUsage({ doc }: { doc: ComponentDoc }) {
  return (
    <div className="grid max-w-[900px] gap-6 sm:grid-cols-2">
      <List title="Quando usarlo" items={doc.use} tone="yes" />
      <List title="Quando evitarlo" items={doc.avoid} tone="no" />
      {doc.variants && <List title="Varianti" items={doc.variants} tone="plain" />}
      {doc.states && <List title="Stati" items={doc.states} tone="plain" />}
      <List title="Personalizzazioni ammesse" items={doc.customize} tone="plain" />
      <List title="Esempi di dominio" items={doc.demos.map((d) => d.label)} tone="plain" />
    </div>
  );
}

export function DocProps({ doc }: { doc: ComponentDoc }) {
  return (
    <div className="max-w-[900px] overflow-x-auto rounded-card shadow-card">
      <table className="w-full min-w-[520px] bg-surface text-left text-[13.5px]">
        <thead className="bg-inset text-[12.5px] text-ink-2">
          <tr><th className="px-3 py-2 font-medium">Prop o slot</th><th className="px-3 py-2 font-medium">Tipo</th><th className="px-3 py-2 font-medium">A cosa serve</th></tr>
        </thead>
        <tbody>
          {doc.props.map(([name, type, note]) => (
            <tr key={name} className="border-t border-line align-top">
              <td className="px-3 py-2 font-mono text-[12.5px] text-ink">{name}</td>
              <td className="px-3 py-2 font-mono text-[12.5px] text-ink-2">{type}</td>
              <td className="px-3 py-2 text-ink-2">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocMistakes({ doc }: { doc: ComponentDoc }) {
  return (
    <ul className="flex max-w-[900px] flex-col gap-3">
      {doc.mistakes.map((m) => (
        <li key={m.wrong} className="grid gap-2 rounded-card bg-surface p-3.5 shadow-card sm:grid-cols-2 sm:gap-4">
          <p className="flex gap-2 text-[14px] leading-relaxed text-ink-2"><X size={15} className="mt-[3px] shrink-0 text-red" aria-label="Sbagliato" />{m.wrong}</p>
          <p className="flex gap-2 text-[14px] leading-relaxed text-ink"><Check size={15} className="mt-[3px] shrink-0 text-green" aria-label="Corretto" />{m.right}</p>
        </li>
      ))}
    </ul>
  );
}
