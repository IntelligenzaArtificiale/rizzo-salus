/* Backend finto per impostazioni, blog e caricamento a blocchi. */
import type { ApiResult } from "@/api/client";
import { DEFAULT_SETTINGS, type PlatformSettings } from "@/lib/platform/defaults";
import { POSTS, type BlogPost } from "@/api/mock/data/blog.data";

const ok = <T>(data: T): ApiResult<T> => ({ ok: true, data });
const fail = (error: string): ApiResult<never> => ({ ok: false, error });
type B = Record<string, unknown>;

let settings: PlatformSettings = structuredClone(DEFAULT_SETTINGS);
let posts: BlogPost[] = structuredClone(POSTS);
const uploads = new Map<string, { nome: string; parti: number }>();

export const extraMocks: Record<string, (body: unknown) => ApiResult<unknown>> = {
  "/impostazioni/leggi": () => ok(settings),
  "/impostazioni/salva": (b) => { settings = (b as { dati: PlatformSettings }).dati; return ok({}); },

  "/blog/pubblici": () => ok(posts.filter((p) => p.pubblicato).sort((a, b) => b.data.localeCompare(a.data))),
  "/blog/articolo": (b) => { const p = posts.find((x) => x.slug === (b as B).slug && x.pubblicato); return p ? ok(p) : fail("non_trovato"); },
  "/blog/elenco": () => ok(posts),
  "/blog/dettaglio": (b) => { const p = posts.find((x) => x.id === (b as B).id); return p ? ok(p) : fail("non_trovato"); },
  "/blog/salva": (b) => {
    const { id, dati } = b as { id?: string; dati: Partial<BlogPost> };
    if (posts.some((p) => p.slug === dati.slug && p.id !== id)) return fail("slug_esistente");
    if (id) { const p = posts.find((x) => x.id === id)!; Object.assign(p, dati); return ok(p); }
    const p = { ...dati, id: `p${Date.now()}`, data: new Date().toISOString().slice(0, 10), autore: "Giulia Ferraro" } as BlogPost;
    posts.unshift(p);
    return ok(p);
  },
  "/blog/elimina": (b) => { posts = posts.filter((p) => p.id !== (b as B).id); return ok({}); },

  /* caricamento a blocchi: inizia → parte (n volte) → completa */
  "/upload/inizia": (b) => { const id = `up${Date.now()}`; uploads.set(id, { nome: String((b as B).nome), parti: 0 }); return ok({ uploadId: id, ricevute: 0 }); },
  "/upload/parte": (b) => { const u = uploads.get(String((b as B).uploadId)); if (!u) return fail("upload_sconosciuto"); u.parti++; return ok({ ricevute: u.parti }); },
  "/upload/completa": (b) => ok({ id: String((b as B).uploadId), url: String((b as B).anteprima ?? "") }),
};
