import { useState } from "react";
import { Section } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { api, type Data } from "./api";
import { useLoad, useAction, addDays, date } from "./common";
import { useClinic } from "./ClinicContext";
export function AgendaNotes({ week }: { week: string }) {
  const { can } = useClinic(),
    a = useAction(),
    load = useLoad(
      () => api("/agenda/note", { da: week, a: addDays(week, 6) }),
      [week],
    );
  const [edit, setEdit] = useState<Data | null>(null);
  return (
    <Section title="Appunti della segreteria · sabato e giorni della settimana">
      <p className="text-sm text-ink-2">
        Le note restano visibili qui e non occupano slot di terapia.
      </p>
      {load.error && (
        <p role="alert" className="text-red">
          {load.error}
        </p>
      )}
      {load.data?.note.length > 0 ? (
        <RowList
          rows={(load.data?.note ?? []).map((n: Data) => ({
            key: n.id,
            title: n.titolo,
            meta:
              date(n.start) +
              " " +
              n.start.slice(11, 16) +
              (n.nota ? " · " + n.nota : ""),
            actions: can("agenda.modifica") ? (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setEdit(n)}>
                  Modifica nota
                </Button>
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() =>
                    a.act(async () => {
                      await api("/agenda/nota-salva", {
                        ...n,
                        completata: true,
                      });
                      load.reload();
                    }, "Nota archiviata")
                  }
                >
                  Fatto
                </Button>
              </div>
            ) : undefined,
          }))}
        />
      ) : (
        <p className="text-sm text-ink-3">
          Nessun appunto aperto nella settimana.
        </p>
      )}
      {can("agenda.modifica") && (
        <Button
          variant="secondary"
          onClick={() =>
            setEdit({
              start: addDays(week, 5) + "T12:00:00",
              titolo: "",
              nota: "",
            })
          }
        >
          Aggiungi nota
        </Button>
      )}
      {edit && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            a.act(async () => {
              await api("/agenda/nota-salva", edit);
              setEdit(null);
              load.reload();
            }, "Nota salvata");
          }}
        >
          <TextField
            label="Giorno e ora della nota"
            type="datetime-local"
            value={edit.start.slice(0, 16)}
            onChange={(v) => setEdit({ ...edit, start: v + ":00" })}
          />
          <TextField
            label="Titolo della nota"
            value={edit.titolo}
            onChange={(titolo) => setEdit({ ...edit, titolo })}
          />
          <TextAreaField
            label="Dettagli della nota"
            value={edit.nota || ""}
            onChange={(nota) => setEdit({ ...edit, nota })}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={a.busy || !edit.titolo}>
              Salva nota
            </Button>
            <Button type="button" variant="quiet" onClick={() => setEdit(null)}>
              Annulla
            </Button>
          </div>
        </form>
      )}
    </Section>
  );
}
export function CycleAlertsPanel({ week }: { week: string }) {
  const load = useLoad(
    () => api("/agenda/avvisi-ciclo", { da: week, a: addDays(week, 6) }),
    [week],
  );
  return (
    <Section title="Prima e ultima seduta · promemoria al titolare">
      <p className="text-sm text-ink-2">
        Indicazioni iniziali ai fisioterapisti e consigli finali al paziente.
        Nessun messaggio esterno parte da questo elenco.
      </p>
      {load.error && (
        <p role="alert" className="text-red">
          {load.error}
        </p>
      )}
      {load.data?.avvisi.length ? (
        <RowList
          rows={load.data.avvisi.map((v: Data) => ({
            key: v.id,
            title: v.paziente + " · " + v.terapia,
            meta:
              date(v.start) +
              " " +
              v.start.slice(11, 16) +
              " · " +
              v.indicazione,
            to: `/agenda/${v.appointment_id}?giorno=${v.start.slice(0, 10)}`,
          }))}
        />
      ) : (
        <p className="text-sm text-ink-3">
          Nessuna prima o ultima seduta da seguire nella settimana.
        </p>
      )}
    </Section>
  );
}
