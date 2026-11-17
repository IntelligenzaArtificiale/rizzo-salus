// Directory compatta: ricerca sul server e righe che aprono la scheda, senza dati inventati.
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { TableToolbar } from "@/components/app/TableToolbar";
import { PrimaryAction } from "@/components/app/IconButton";
import { PatientDirectory } from "./PatientDirectory";
import { EmptyState } from "@/components/app/PageState";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { LoadState, useLoad } from "./common";
export function PatientsPage() {
  const [q, setQ] = useState(""),
    [search, setSearch] = useState("");
  const { can } = useClinic();
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(q), 200);
    return () => clearTimeout(timeout);
  }, [q]);
  const load = useLoad(
    () => api("/pazienti/cerca", { q: search, limite: 50 }),
    [search],
  );
  const rows: Data[] = load.data?.risultati || [];
  return (
    <LoadState load={{ ...load, loading: load.loading && !load.data }} wide>
      <PageHeader
        title="Pazienti"
        subtitle="Contatti, percorsi di cura e appuntamenti."
        actions={
          can("pazienti.anagrafica") ? (
            <PrimaryAction
              label="Nuovo paziente"
              icon={<Plus size={16} />}
              to="/pazienti/nuovo"
            />
          ) : undefined
        }
      />
      <TableToolbar
        query={q}
        onQuery={setQ}
        placeholder="Cerca nome, telefono o codice fiscale"
      />
      {rows.length ? (
        <PatientDirectory rows={rows} resetKey={search} />
      ) : (
        <EmptyState
          title={q ? "Nessun paziente trovato" : "Non ci sono ancora pazienti"}
          description={
            q
              ? "Prova un altro nome, numero o codice fiscale."
              : "Crea la prima anagrafica per iniziare."
          }
        />
      )}
      {rows.length === 50 && (
        <p className="text-[12px] text-ink-3">
          Sono visualizzati i primi 50 risultati. Affina la ricerca per trovare
          il paziente.
        </p>
      )}
    </LoadState>
  );
}
