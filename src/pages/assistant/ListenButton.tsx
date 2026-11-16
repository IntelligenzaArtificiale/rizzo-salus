/* "Ascolta" sotto una risposta: lettura ad alta voce, si ferma al secondo clic o all'uscita dalla pagina. */
import { useEffect, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { speak, speechSupported, stopSpeaking } from "@/lib/speech/speak";

export function ListenButton({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => stopSpeaking(), []);
  if (!speechSupported) return null;
  const toggle = () => {
    if (playing) { stopSpeaking(); setPlaying(false); return; }
    setPlaying(true);
    speak(text, () => setPlaying(false));
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={playing} className="-mt-2 flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] font-medium text-ink-2 hover:bg-hover hover:text-ink">
      {playing ? <Square size={13} /> : <Volume2 size={14} />}
      {playing ? "Ferma" : "Ascolta"}
    </button>
  );
}
