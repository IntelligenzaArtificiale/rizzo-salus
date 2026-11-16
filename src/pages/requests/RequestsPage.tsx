/* Elenco richieste: Filter Table con filtri per stato. Clic su una riga apre la scheda; "Nuova" apre la pagina dedicata. */
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import FilterTable from "@/components/app/ExportableTable";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { PrimaryAction } from "@/components/app/IconButton";
import { EmptyState, PageError, PageLoading } from "@/components/app/PageState";
import { listRequests } from "@/api/requests";
import { useLoad } from "@/lib/data/useLoad";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { REQUEST_EXPORT, REQUEST_TABLE_LABELS, toRows } from "@/pages/requests/requestTable";

export function RequestsPage() {
  const navigate = useNavigate();
  const { can } = usePlatform();
  const admin = can("richieste.tutte");
  const { data, loading, error, reload } = useLoad(listRequests);

  return (
    <Page>
      <PageHeader
        title={admin ? "Richieste" : "Le mie richieste"}
        actions={can("richieste.crea") && <PrimaryAction label="Nuova" icon={<Plus size={15} />} to="/richieste/nuova" />}
      />
      {loading && !data && <PageLoading />}
      {error && <PageError onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="Ancora nessuna richiesta." action={<PrimaryAction label="Nuova richiesta" icon={<Plus size={15} />} to="/richieste/nuova" />} />}
      {data && data.length > 0 && (
        <FilterTable fill pageSize={20} rows={toRows(data)} labels={REQUEST_TABLE_LABELS} exportAs={REQUEST_EXPORT} onRowClick={(row) => navigate(`/richieste/${row.id}`)} />
      )}
    </Page>
  );
}
