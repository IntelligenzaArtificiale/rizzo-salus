import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { SiteLayout } from "@/layouts/SiteLayout";
import { Section } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { Checkbox } from "@/components/form/Checkbox";
import { StatusPill } from "@/components/atoms/StatusPill";
import { api, type Data } from "./api";
import { useLoad, useAction } from "./common";
export function PublicSignature() {
  const { token } = useParams();
  const load = useLoad(() => api("/firma/pubblico", { token }), [token]);
  const [bottom, setBottom] = useState(false),
    [read, setRead] = useState(false),
    [otp, setOtp] = useState<Data | null>(null),
    [code, setCode] = useState(""),
    [done, setDone] = useState(false);
  const a = useAction();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      load.data &&
      box.current &&
      box.current.scrollHeight <= box.current.clientHeight + 2
    )
      setBottom(true);
  }, [load.data]);
  return (
    <SiteLayout>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-5">
        <h1 className="text-2xl font-semibold text-ink">
          {load.data?.titolo ?? "Documento personale"}
        </h1>
        {load.error ? (
          <p role="alert" className="text-red">
            {load.error}
          </p>
        ) : done ? (
          <StatusPill tone="green">Accettazione registrata</StatusPill>
        ) : (
          load.data && (
            <Section title="Lettura del documento">
              <p className="text-sm text-ink-2">
                Versione {load.data.versione}. Leggi il documento fino in fondo
                prima di richiedere il codice.
              </p>
              <div
                ref={box}
                tabIndex={0}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4)
                    setBottom(true);
                }}
                className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-card border border-line bg-surface p-5 text-[14px] leading-relaxed text-ink"
              >
                {load.data.contenuto}
              </div>
              <fieldset disabled={!bottom}>
                <Checkbox
                  label="Dichiaro di aver letto il documento e desidero accettarlo"
                  checked={read}
                  onChange={(v) => {
                    setRead(v);
                    if (v)
                      a.act(() =>
                        api("/firma/pubblico", { token, letto: true }),
                      );
                  }}
                />
              </fieldset>
              {!otp ? (
                <Button
                  disabled={!read || a.busy}
                  onClick={() =>
                    a.act(async () =>
                      setOtp(await api("/firma/otp", { token })),
                    )
                  }
                >
                  Richiedi codice sul cellulare
                </Button>
              ) : (
                <>
                  <p className="text-sm text-ink-2">
                    {otp.modalita === "live"
                      ? "Codice accodato per il tuo cellulare."
                      : "Modalità prova: il codice è nel messaggio di prova consultabile dalla segreteria."}
                  </p>
                  <TextField
                    label="Codice ricevuto"
                    value={code}
                    inputMode="numeric"
                    maxLength={6}
                    onChange={setCode}
                  />
                  <Button
                    variant="primary"
                    disabled={!read || code.length !== 6 || a.busy}
                    onClick={() =>
                      a.act(async () => {
                        await api("/firma/accetta", {
                          token,
                          challenge: otp.challenge,
                          codice: code,
                        });
                        setDone(true);
                      }, "Accettazione registrata")
                    }
                  >
                    Conferma accettazione
                  </Button>
                </>
              )}
              <p className="text-xs text-ink-3">
                L’operazione registra documento, versione, lettura dichiarata,
                data e verifica mediante codice monouso.
              </p>
            </Section>
          )
        )}
      </div>
    </SiteLayout>
  );
}
