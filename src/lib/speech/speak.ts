/*
 * Lettura ad alta voce (testo → voce) con speechSynthesis.
 * Accortezze: si ferma ogni lettura precedente; il testo si divide in frasi brevi
 * (Chrome interrompe gli enunciati lunghi dopo ~15 secondi); voce italiana se presente.
 */
export const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

function chunks(text: string, max = 180): string[] {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?;:]+[.!?;:]?/g) ?? [text];
  const out: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > max && current) { out.push(current.trim()); current = ""; }
    current += s;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

export function speak(text: string, onEnd?: () => void, lang = "it-IT") {
  if (!speechSupported) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voice = synth.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)));
  const parts = chunks(text);
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = lang;
    if (voice) u.voice = voice;
    if (i === parts.length - 1) u.onend = () => onEnd?.();
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (speechSupported) window.speechSynthesis.cancel();
}
