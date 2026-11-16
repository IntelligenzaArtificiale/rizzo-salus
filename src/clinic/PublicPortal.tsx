import { useState } from "react";
import { SiteLayout } from "@/layouts/SiteLayout";
import { Section } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { RowList } from "@/components/app/RowList";
import { StatusPill } from "@/components/atoms/StatusPill";
import { api, download, type Data } from "./api";
import { useLoad, useAction, date } from "./common";
export function PublicPortal() {
  const [phone, setPhone] = useState(""),
    [cf, setCf] = useState(""),
    [birth, setBirth] = useState(""),
    [otp, setOtp] = useState<Data | null>(null),
    [code, setCode] = useState(""),
    [token, setToken] = useState("");
  const a = useAction();
  const load = useLoad(
    () => (token ? api("/prenota/portale", { token }) : Promise.resolve(null)),
    [token],
  );
  const d = load.data;
  return (
    <SiteLayout>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-5">
        <h1 className="text-2xl font-semibold text-ink">Il tuo percorso</h1>
        {!token ? (
          <Section title="Accesso personale">
            <TextField
              label="Cellulare registrato in struttura"
              type="tel"
              value={phone}
              onChange={setPhone}
            />
            <TextField
              label="Codice fiscale (per distinguere anagrafiche con lo stesso recapito)"
              value={cf}
              onChange={setCf}
            />
            <TextField
              label="Data di nascita"
              type="date"
              value={birth}
              onChange={setBirth}
            />
            {otp ? (
              <>
                <p className="text-sm text-ink-2">
                  {otp.modalita === "live"
                    ? "Inserisci il codice richiesto."
                    : "Modalità prova: il codice è consultabile dalla segreteria nei messaggi di prova."}
                </p>
                <TextField
                  label="Codice ricevuto"
                  value={code}
                  onChange={setCode}
                  maxLength={6}
                />
                <Button
                  disabled={a.busy || code.length !== 6}
                  onClick={() =>
                    a.act(async () => {
                      const r = await api("/prenota/portale-login", {
                        ...otp,
                        codice: code,
                      });
                      setToken(r.token);
                    })
                  }
                >
                  Accedi
                </Button>
              </>
            ) : (
              <Button
                disabled={a.busy || !phone || !birth}
                onClick={() =>
                  a.act(async () =>
                    setOtp(
                      await api("/prenota/portale-otp", {
                        telefono: phone,
                        data_nascita: birth,
                        codice_fiscale: cf || null,
                      }),
                    ),
                  )
                }
              >
                Richiedi codice
              </Button>
            )}
          </Section>
        ) : (
          <>
            {load.error && (
              <p role="alert" className="text-red">
                {load.error}
              </p>
            )}
            {d && (
              <>
                <p className="text-lg text-ink">Ciao {d.nome}</p>
                {!d.rilascio_consentito && (
                  <StatusPill tone="orange">
                    Completa i consensi in segreteria per visualizzare gli
                    appuntamenti futuri
                  </StatusPill>
                )}
                <Section title="Appuntamenti e storico">
                  <RowList
                    rows={d.appuntamenti.map((x: Data) => ({
                      key: x.id,
                      title: x.prestazione,
                      meta: date(x.start) + " · " + x.start.slice(11, 16),
                      actions: (
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone="neutral">{x.stato}</StatusPill>
                          {new Date(x.start) > new Date() &&
                            !["annullato", "eseguito", "assente"].includes(
                              x.stato,
                            ) && (
                              <Button
                                size="sm"
                                disabled={d.richieste.some(
                                  (n: Data) =>
                                    n.appointment_id === x.id &&
                                    n.stato === "aperta",
                                )}
                                onClick={() =>
                                  a.act(async () => {
                                    await api("/prenota/disdetta", {
                                      token,
                                      id: x.id,
                                    });
                                    load.reload();
                                  }, "Richiesta inviata. La segreteria ti contatterà. L’appuntamento resta attivo.")
                                }
                              >
                                Richiedi disdetta
                              </Button>
                            )}
                        </div>
                      ),
                    }))}
                  />
                </Section>
                <Section title="Avanzamento percorsi">
                  {d.percorsi.map((p: Data, i: number) => (
                    <div
                      key={i}
                      className="rounded-card border border-line p-4"
                    >
                      <p className="font-medium text-ink">{p.titolo}</p>
                      {p.avanzamento.map((l: Data) => (
                        <p key={l.line_id} className="text-sm text-ink-2">
                          {l.eseguite} eseguite su {l.sedute_previste} ·{" "}
                          {l.da_eseguire} da eseguire
                        </p>
                      ))}
                    </div>
                  ))}
                </Section>
                <Section title="Documenti condivisi">
                  <RowList
                    rows={d.documenti.map((x: Data) => ({
                      key: x.id,
                      title: x.titolo,
                      actions: (
                        <Button
                          onClick={() =>
                            a.act(() =>
                              download("/prenota/portale-documento", {
                                token,
                                id: x.id,
                              }),
                            )
                          }
                        >
                          Scarica
                        </Button>
                      ),
                    }))}
                  />
                </Section>
              </>
            )}
            <Button
              onClick={() => {
                setToken("");
                setOtp(null);
                setCode("");
              }}
            >
              Esci dal portale
            </Button>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
