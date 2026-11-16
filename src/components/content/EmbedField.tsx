/* Incolla un link (YouTube, Vimeo, Google Maps, Spotify, PDF, immagine): anteprima subito, poi "Inserisci". */
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { EmbedView } from "@/components/content/EmbedView";
import { parseEmbed } from "@/lib/embed";

export function EmbedField({ onInsert }: { onInsert: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const embed = parseEmbed(url);
  const error = url.trim() && !embed ? "Link non supportato. Funzionano YouTube, Vimeo, Google Maps, Spotify, PDF e immagini (https)." : null;
  return (
    <div className="flex flex-col gap-3">
      <TextField label="Incorpora una risorsa" value={url} onChange={setUrl} placeholder="https://www.youtube.com/watch?v=…" error={error} inputMode="url"
        trailing={embed && <Button type="button" variant="primary" size="sm" onClick={() => { onInsert(url.trim()); setUrl(""); }}>Inserisci</Button>} />
      {embed && <div className="-mt-3 max-w-[420px]"><EmbedView embed={embed} /></div>}
    </div>
  );
}
