import { useState } from "react";
import { TextAreaField } from "@/components/form/TextAreaField";
import { Button } from "@/components/atoms/Button";
import { api, type Data } from "./api";
import { useAction, date } from "./common";
import { useClinic } from "./ClinicContext";
export function EpisodeDiary({ episode }: { episode: Data }) {
  const { can } = useClinic();
  const [entries, setEntries] = useState<Data[]>(episode.diario ?? []),
    [revision, setRevision] = useState(episode.revision),
    [text, setText] = useState(""),
    [key, setKey] = useState(crypto.randomUUID());
  const a = useAction();
  if (!can("pazienti.note_terapeutiche")) return null;
  return (
    <details className="rounded-card border border-line p-4">
      <summary className="cursor-pointer text-sm font-medium text-ink">
        Diario terapeutico · {entries.length} annotazioni
      </summary>
      <div className="flex flex-col gap-3 pt-4">
        {episode.note_terapeutiche && (
          <p className="whitespace-pre-wrap text-sm text-ink-2">
            {episode.note_terapeutiche}
          </p>
        )}
        {entries.map((n) => (
          <div key={n.chiave} className="border-b border-line pb-3">
            <p className="text-xs text-ink-3">
              {date(n.at)} · {n.nome_autore}
            </p>
            <p className="whitespace-pre-wrap text-sm text-ink">{n.testo}</p>
          </div>
        ))}
        <TextAreaField
          label="Nuova annotazione sul percorso"
          value={text}
          onChange={setText}
        />
        <Button
          disabled={!text.trim() || a.busy}
          onClick={() =>
            a.act(async () => {
              const r = await api("/percorsi/nota-salva", {
                id: episode.id,
                revision,
                testo: text,
                chiave: key,
              });
              setEntries(r.diario);
              setRevision(r.revision);
              setText("");
              setKey(crypto.randomUUID());
            }, "Annotazione registrata nel diario")
          }
        >
          Aggiungi annotazione
        </Button>
      </div>
    </details>
  );
}
