/* Testo di un articolo dal formato di lib/markdown.ts. Le risorse incorporate passano da lib/embed (solo servizi ammessi). */
import { parseArticle } from "@/lib/markdown";
import { parseEmbed } from "@/lib/embed";
import { EmbedView } from "@/components/content/EmbedView";

export function ArticleBody({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-4 text-[16px] leading-[1.7] text-ink">
      {parseArticle(source).map((b, i) => {
        if (b.type === "h2") return <h2 key={i} className="mt-4 text-[20px] font-semibold tracking-[-0.01em]">{b.text}</h2>;
        if (b.type === "ul") return <ul key={i} className="list-disc space-y-1 pl-5">{b.items.map((it) => <li key={it}>{it}</li>)}</ul>;
        if (b.type === "embed") { const e = parseEmbed(b.url); return e ? <EmbedView key={i} embed={e} /> : null; }
        return <p key={i}>{b.text}</p>;
      })}
    </div>
  );
}
