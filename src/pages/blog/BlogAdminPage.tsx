import { ExportExcelButton } from "@/components/app/ExportExcelButton";
/* Gestione del blog: elenco paginato con bozze e pubblicati, "Nuovo" apre l'editor. */
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageTabs } from "@/components/app/PageTabs";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { PrimaryAction } from "@/components/app/IconButton";
import { RowList } from "@/components/app/RowList";
import { EmptyState, PageError, PageLoading } from "@/components/app/PageState";
import { listPosts } from "@/api/blog";
import { useLoad } from "@/lib/data/useLoad";
import { formatDate } from "@/lib/format";

const VIEWS = ["Tutti", "Pubblicati", "Bozze"] as const;

export function BlogAdminPage() {
  const { data, loading, error, reload } = useLoad(listPosts);
  const [view, setView] = useState<(typeof VIEWS)[number]>("Tutti");
  const rows = (data ?? []).filter((p) => view === "Tutti" || (view === "Pubblicati") === p.pubblicato);
  return (
    <Page>
      <PageHeader title="Blog" actions={<PrimaryAction label="Nuovo" icon={<Plus size={15} />} to="/admin/blog/nuovo" />} />
      <PageTabs options={VIEWS} value={view} onChange={setView} />
      <ExportExcelButton filename="blog" headers={["Titolo", "Indirizzo", "Data", "Pubblicato"]} rows={rows.map((p) => [p.titolo, `/blog/${p.slug}`, p.data, p.pubblicato ? "Sì" : "No"])} />
      {loading && !data && <PageLoading />}
      {error && <PageError onRetry={reload} />}
      {data && rows.length === 0 && <EmptyState title="Nessun articolo." />}
      {rows.length > 0 && (
        <RowList resetKey={view} rows={rows.map((p) => ({
          key: p.id, to: `/admin/blog/${p.id}`, title: p.titolo, meta: `/blog/${p.slug}`, aside: formatDate(p.data, true),
          mark: <span className={`size-1.5 rounded-full ${p.pubblicato ? "bg-green" : "bg-line-strong"}`} aria-label={p.pubblicato ? "Pubblicato" : "Bozza"} />,
        }))} />
      )}
    </Page>
  );
}
