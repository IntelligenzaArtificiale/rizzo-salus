/*
 * Elenco utenti con la Records Table di Beautiful UI in modalità semplice (readOnly):
 * ruolo e stato come tag, ultimo accesso, livello di attività, email. Il nome apre la scheda.
 */
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { ExportExcelButton } from "@/components/app/ExportExcelButton";
import RecordsTable from "@/components/primitives/RecordsTable";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { PrimaryAction } from "@/components/app/IconButton";
import { PageError, PageLoading } from "@/components/app/PageState";
import { ACTIVITY_LABEL, listUsers, ROLE_LABEL, STATE_LABEL } from "@/api/users";
import { useLoad } from "@/lib/data/useLoad";

/* tag → colore della palette della Records Table */
const TAG_COLORS: Record<string, string> = {
  Amministratore: "purple", Operatore: "cyan", Cliente: "lime",
  Sospeso: "amber", Bloccato: "orange", Disabilitato: "yellow",
};

export function UsersPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad(listUsers);

  return (
    <Page wide>
      <PageHeader title="Utenti" subtitle={data ? `${data.length} account` : undefined} actions={<PrimaryAction label="Nuovo" icon={<UserPlus size={15} />} to="/admin/utenti/nuovo" />} />
      {loading && !data && <PageLoading />}
      {error && <PageError onRetry={reload} />}
      {data && (
        <RecordsTable
          fill
          renderExport={(rows) => <ExportExcelButton filename="utenti"
            headers={["Nome", "Ruolo e stato", "Ultimo accesso", "Attività", "Email"]}
            rows={rows.map((row) => [row.name, row.tags.join(", "), row.last, ACTIVITY_LABEL[row.strength], row.website ?? ""])} />}
          readOnly
          tagColors={TAG_COLORS}
          onOpen={(row) => navigate(`/admin/utenti/${row.id}`)}
          rows={data.map((u) => ({
            id: u.id,
            name: u.nome,
            tags: [ROLE_LABEL[u.ruolo], ...(u.stato === "attivo" ? [] : [STATE_LABEL[u.stato]])],
            last: u.ultimo,
            strength: u.attivita,
            website: u.email,
          }))}
          strengthLabels={ACTIVITY_LABEL}
          labels={{
            table: "Utenti. Scorri in orizzontale e in verticale per vedere tutte le colonne.",
            company: "Nome", categories: "Ruolo", last: "Ultimo accesso", strength: "Attività", links: "Email",
            count: "utenti", average: "attività media", linksCount: "email", selectAll: "Seleziona tutti", select: "Seleziona", noContact: "Mai",
          }}
        />
      )}
    </Page>
  );
}
