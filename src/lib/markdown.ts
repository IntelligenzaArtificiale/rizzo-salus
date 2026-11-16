/*
 * Formato testo degli articoli, volutamente piccolo e sicuro (niente HTML libero):
 * paragrafi separati da riga vuota, "## " titoli, "- " elenchi, "@embed https://…" risorse.
 * Restituisce blocchi da disegnare con React, così il testo non viene mai interpretato come HTML.
 */
export type Block = { type: "p"; text: string } | { type: "h2"; text: string } | { type: "ul"; items: string[] } | { type: "embed"; url: string };

export function parseArticle(source: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of source.replace(/\r/g, "").split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((l) => l.trim());
    let para: string[] = [];
    const flush = () => { if (para.length) blocks.push({ type: "p", text: para.join(" ") }); para = []; };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("## ")) { flush(); blocks.push({ type: "h2", text: line.slice(3) }); }
      else if (line.startsWith("@embed ")) { flush(); blocks.push({ type: "embed", url: line.slice(7).trim() }); }
      else if (line.startsWith("- ")) {
        flush();
        const items: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("- ")) items.push(lines[i++].trim().slice(2));
        i--;
        blocks.push({ type: "ul", items });
      } else para.push(line);
    }
    flush();
  }
  return blocks;
}

/** "Massetto: tempi & spessori!" → "massetto-tempi-spessori" */
export const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
