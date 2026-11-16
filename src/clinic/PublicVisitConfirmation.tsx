import { useParams } from "react-router-dom";
import { SiteLayout } from "@/layouts/SiteLayout";
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { api } from "./api";
import { useLoad, useAction, date } from "./common";
export function PublicVisitConfirmation() {
  const { token } = useParams();
  const load = useLoad(
    () => api("/pubblico/conferma-visita", { token }),
    [token],
  );
  const a = useAction();
  return (
    <SiteLayout>
      <div className="mx-auto flex max-w-xl flex-col gap-6 p-5">
        <h1 className="text-2xl font-semibold text-ink">
          Conferma la tua visita
        </h1>
        {load.error ? (
          <p role="alert" className="text-red">
            {load.error}
          </p>
        ) : (
          load.data && (
            <>
              <p className="text-lg text-ink">
                {date(load.data.start)} alle {load.data.start.slice(11, 16)}
              </p>
              {load.data.confermata ? (
                <StatusPill tone="green">Presenza confermata</StatusPill>
              ) : (
                <Button
                  disabled={a.busy}
                  onClick={() =>
                    a.act(async () => {
                      await api("/pubblico/conferma-visita", {
                        token,
                        conferma: true,
                      });
                      load.reload();
                    }, "Presenza confermata")
                  }
                >
                  Confermo la mia presenza
                </Button>
              )}
              <p className="text-sm text-ink-2">
                Per modificare o disdire contatta la segreteria oppure usa il
                portale personale.
              </p>
            </>
          )
        )}
      </div>
    </SiteLayout>
  );
}
