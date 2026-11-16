/*
 * Da un indirizzo a una risorsa incorporabile, solo per i servizi ammessi (sicurezza:
 * niente iframe verso siti qualsiasi). Per aggiungerne uno, una riga in PROVIDERS.
 */
export type Embed = { kind: "video" | "mappa" | "documento" | "immagine" | "audio"; src: string; title: string; ratio: string };

const PROVIDERS: { test: RegExp; make: (m: RegExpMatchArray, url: string) => Embed }[] = [
  { test: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/, make: (m) => ({ kind: "video", src: `https://www.youtube-nocookie.com/embed/${m[1]}`, title: "Video YouTube", ratio: "16/9" }) },
  { test: /vimeo\.com\/(\d+)/, make: (m) => ({ kind: "video", src: `https://player.vimeo.com/video/${m[1]}`, title: "Video Vimeo", ratio: "16/9" }) },
  { test: /google\.[a-z.]+\/maps/, make: (_m, url) => ({ kind: "mappa", src: url.includes("output=embed") ? url : `${url}${url.includes("?") ? "&" : "?"}output=embed`, title: "Mappa", ratio: "4/3" }) },
  { test: /open\.spotify\.com\/(track|episode|show|playlist)\/(\w+)/, make: (m) => ({ kind: "audio", src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, title: "Audio Spotify", ratio: "5/2" }) },
  { test: /\.pdf(\?.*)?$/i, make: (_m, url) => ({ kind: "documento", src: url, title: "Documento PDF", ratio: "3/4" }) },
  { test: /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i, make: (_m, url) => ({ kind: "immagine", src: url, title: "Immagine", ratio: "auto" }) },
];

export function parseEmbed(url: string): Embed | null {
  const clean = url.trim();
  if (!/^https:\/\//.test(clean)) return null;
  for (const p of PROVIDERS) {
    const m = clean.match(p.test);
    if (m) return p.make(m, clean);
  }
  return null;
}
