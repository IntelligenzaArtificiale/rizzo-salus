/*
 * SEO lato client: titolo, descrizione, Open Graph, robots e canonical della pagina aperta.
 * Attenzione: l'app è una SPA con rotte a hash. Per far indicizzare bene blog e pagine
 * pubbliche il PHP deve servire gli stessi meta nell'HTML iniziale (vedi docs/seo.md).
 */
import { useEffect } from "react";
import { usePlatform } from "@/lib/platform/PlatformContext";

function setMeta(attr: "name" | "property", key: string, value: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) { tag = document.createElement("meta"); tag.setAttribute(attr, key); document.head.appendChild(tag); }
  tag.content = value;
}

export function useSeo(title: string, description?: string, image?: string, noindex = false) {
  const { settings } = usePlatform();
  useEffect(() => {
    const full = settings.seo.titolo.includes("%s") ? settings.seo.titolo.replace("%s", title) : `${title} · ${settings.brand.nome}`;
    document.title = full;
    const desc = description || settings.seo.descrizione;
    setMeta("name", "description", desc);
    setMeta("property", "og:title", full);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", "website");
    const img = image || settings.seo.immagine;
    if (img) setMeta("property", "og:image", img);
    setMeta("name", "robots", noindex || !settings.seo.indicizza ? "noindex, nofollow" : "index, follow");
  }, [title, description, image, noindex, settings]);
}
