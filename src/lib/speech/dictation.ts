/*
 * Dettatura (voce → testo) con la Web Speech API.
 * Problema noto su mobile, soprattutto Chrome Android: ogni risultato ripete le parole già
 * dette ("ciao ciao come ciao come stai"). Soluzioni applicate:
 * 1. il testo si ricostruisce ogni volta da event.results, mai accodando i pezzi;
 * 2. su Android si tiene solo l'ultimo risultato (contiene già tutta la frase);
 * 3. continuous=false su mobile e riavvio automatico a fine frase, salvando il testo confermato;
 * 4. mergeWithoutRepeat unisce testo confermato e nuovo togliendo la parte sovrapposta.
 */
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null;
};

type RecognitionCtor = new () => Recognition;

const Ctor = (typeof window !== "undefined" &&
  ((window as unknown as { SpeechRecognition?: RecognitionCtor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition)) || null;

export const dictationSupported = Boolean(Ctor);

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isAndroid = () => /Android/i.test(navigator.userAgent);

/** unisce "come stai oggi" a "stai oggi bene" → "come stai oggi bene" (niente parole ripetute) */
export function mergeWithoutRepeat(base: string, next: string): string {
  const a = base.trim().split(/\s+/).filter(Boolean);
  const b = next.trim().split(/\s+/).filter(Boolean);
  if (!a.length) return b.join(" ");
  if (!b.length) return a.join(" ");
  const lower = (w: string[]) => w.map((x) => x.toLowerCase());
  if (lower(b).join(" ").startsWith(lower(a).join(" "))) return b.join(" ");
  for (let k = Math.min(a.length, b.length); k > 0; k--) {
    if (lower(a.slice(-k)).join(" ") === lower(b.slice(0, k)).join(" ")) return [...a, ...b.slice(k)].join(" ");
  }
  return [...a, ...b].join(" ");
}

/**
 * Avvia la dettatura. onText riceve sempre il testo completo (confermato + provvisorio).
 * Restituisce la funzione per fermarla. onError: "non-consentito", "nessun-microfono", "rete".
 */
export function startDictation(onText: (text: string) => void, onError?: (e: string) => void, lang = "it-IT"): () => void {
  if (!Ctor) { onError?.("non-supportato"); return () => {}; }
  let active = true;
  let committed = "";
  let rec: Recognition;

  const run = () => {
    rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = !isMobile();
    let session = "";
    rec.onresult = (e) => {
      let finalText = "";
      let interim = "";
      if (isAndroid()) {
        const last = e.results[e.results.length - 1];
        if (last.isFinal) finalText = last[0].transcript; else interim = last[0].transcript;
      } else {
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += ` ${r[0].transcript}`; else interim += ` ${r[0].transcript}`;
        }
      }
      if (finalText) session = mergeWithoutRepeat(session, finalText);
      onText(mergeWithoutRepeat(mergeWithoutRepeat(committed, session), interim));
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { active = false; onError?.("non-consentito"); }
      else if (e.error === "audio-capture") { active = false; onError?.("nessun-microfono"); }
      else if (e.error === "network") { active = false; onError?.("rete"); }
    };
    rec.onend = () => {
      committed = mergeWithoutRepeat(committed, session);
      if (active) setTimeout(() => active && run(), 150);
    };
    rec.start();
  };

  run();
  return () => { active = false; rec?.stop(); };
}
