/*
 * Composizione delle email: layout + contenuto + marchio + dati. Restituisce oggetto, HTML e testo.
 * Solo anteprima nel frontend: l'invio reale avviene nel backend con gli stessi file.
 * Tutti i valori dinamici sono escapati; il logo ha sempre un testo alternativo.
 */
import type { Brand } from "@/lib/platform/defaults";
import type { EmailTemplate } from "@/email/catalog";
import layout from "@/email/layout.html?raw";

const html = import.meta.glob("./templates/*.html", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const text = import.meta.glob("./templates/*.txt", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fill = (tpl: string, data: Record<string, string>) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k: string) => data[k] ?? "");
const FONT = "-apple-system,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif";

function logoHtml(brand: Brand) {
  const name = esc(brand.nome);
  const light = brand.logotipo || brand.simbolo;
  if (!light) return `<span class="ink" style="font-family:${FONT};font-size:17px;font-weight:600;color:#18181b;">${name}</span>`;
  const dark = brand.logotipoScuro || brand.simboloScuro;
  const h = brand.logotipo ? 28 : 32;
  const img = (src: string, cls: string, hidden: boolean) => `<img src="${esc(src)}" alt="${name}" height="${h}" class="${cls}" style="height:${h}px;width:auto;border:0;${hidden ? "display:none;" : "display:inline-block;"}">`;
  return dark ? img(light, "logo-light", false) + img(dark, "logo-dark", true) : img(light, "", false);
}

function buttonHtml(action: { text: string; url: string } | undefined, color: string) {
  if (!action) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:${esc(color)};">
<a href="${esc(action.url)}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(action.text)}</a></td></tr></table>`;
}

export type RenderedEmail = { subject: string; html: string; text: string };

/** dark: undefined segue il client, true/false forzano il tema (anteprima). */
export function renderEmail(t: EmailTemplate, brand: Brand, dark?: boolean): RenderedEmail {
  const data: Record<string, string> = Object.fromEntries(Object.entries({ ...t.sample, marchio_nome: brand.nome }).map(([k, v]) => [k, esc(v)]));
  const rows = (t.rows ?? []).map((r) => `<tr><td class="ink3 line" style="padding:10px 0;border-bottom:1px solid #e4e4e7;font-family:${FONT};font-size:13px;color:#71717a;width:40%;">${esc(r.label)}</td><td class="ink line" style="padding:10px 0;border-bottom:1px solid #e4e4e7;font-family:${FONT};font-size:14px;color:#18181b;">${esc(r.value)}</td></tr>`).join("");
  const body = fill(html[`./templates/${t.key}.html`] ?? "", { ...data, bottone: buttonHtml(t.action, brand.colore), righe: rows });
  const page = fill(layout, {
    oggetto: esc(t.subject), anteprima_testo: esc(t.preheader), colore: esc(brand.colore), tema: dark === undefined ? "" : dark ? "dark" : "light",
    logo: logoHtml(brand), contenuto: body, marchio_nome: esc(brand.nome), indirizzo: esc(brand.indirizzo), email_contatto: esc(brand.email),
  });
  const plainData = { ...t.sample, marchio_nome: brand.nome, azione_testo: t.action?.text ?? "", azione_url: t.action?.url ?? "", righe_testo: (t.rows ?? []).map((r) => `${r.label}: ${r.value}`).join("\n") };
  const plain = `${fill(text[`./templates/${t.key}.txt`] ?? "", plainData).trim()}\n\n--\n${brand.nome} · ${brand.indirizzo}\nAssistenza: ${brand.email}\n`;
  return { subject: t.subject, html: page, text: plain };
}
