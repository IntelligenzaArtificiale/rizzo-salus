/* Dettaglio di un evento del registro: le modifiche come differenza, con il Code Block (vista Diff) di Beautiful UI. */
import { useParams } from "react-router-dom";
import CodeBlock, { type DiffRow } from "@/components/primitives/CodeBlock";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { DetailList, Section } from "@/components/app/Section";
import { PageError, PageLoading } from "@/components/app/PageState";
import { getAudit, type AuditItem } from "@/api/feed";
import { useLoad } from "@/lib/data/useLoad";
import { formatDateTime } from "@/lib/format";

function toDiff(changes: AuditItem["modifiche"]): DiffRow[] {
  let old = 1, cur = 1;
  return changes.flatMap((c) => {
    const rows: DiffRow[] = [];
    if (c.prima !== "—") rows.push({ old: old++, cur: null, type: "del", pieces: [{ text: `${c.campo}: ` }, { text: c.prima, change: "del" }] });
    if (c.dopo !== "—") rows.push({ old: null, cur: cur++, type: "add", pieces: [{ text: `${c.campo}: ` }, { text: c.dopo, change: "add" }] });
    return rows;
  });
}

export function AuditDetailPage() {
  const { id = "" } = useParams();
  const { data, loading, error, reload } = useLoad(() => getAudit(id), [id]);
  if (loading && !data) return <Page><PageLoading /></Page>;
  if (error || !data) return <Page><PageError onRetry={reload} /></Page>;

  return (
    <Page>
      <PageHeader back={{ to: "/admin/registro", label: "Registro attività" }} title={data.descrizione} subtitle={data.oggetto} />
      <DetailList items={[{ label: "Chi", value: data.chi }, { label: "Quando", value: formatDateTime(data.quando) }]} />
      {data.modifiche.length > 0 && (
        <Section title="Modifiche">
          <CodeBlock variant="Diff" filename={data.oggetto} diff={toDiff(data.modifiche)} labels={{ copy: "Copia", copied: "Copiato" }} />
        </Section>
      )}
    </Page>
  );
}
