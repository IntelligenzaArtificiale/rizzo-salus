/*
 * Scheda utente: dati, stato dell'accesso, eliminazione.
 * Lo stato si cambia con il Segmented Control di Beautiful UI e si salva subito
 * (azione reversibile: niente conferma). Eliminare chiede conferma scrivendo il nome.
 */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { SegmentedControl } from "@/components/atoms/SegmentedControl";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { IconButton } from "@/components/app/IconButton";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { DetailList, Section } from "@/components/app/Section";
import { PageError, PageLoading } from "@/components/app/PageState";
import { useToast } from "@/components/feedback/toast-context";
import { deleteUser, getUser, ROLE_LABEL, setUserState, STATE_LABEL, type UserState } from "@/api/users";
import { useLoad } from "@/lib/data/useLoad";
import { formatDate } from "@/lib/format";

const STATES = ["attivo", "sospeso", "bloccato", "disabilitato"] as const;
const STATE_HINT: Record<UserState, string> = {
  attivo: "Può accedere e usare la piattaforma.",
  sospeso: "Non può accedere finché non lo riattivi. Vede il messaggio \"Account sospeso\".",
  bloccato: "Bloccato per troppi tentativi: può sbloccarsi reimpostando la password.",
  disabilitato: "Accesso disattivato dall'amministratore.",
};

export function UserDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useLoad(() => getUser(id), [id]);
  const [confirm, setConfirm] = useState(false);

  if (loading && !data) return <Page><PageLoading /></Page>;
  if (error || !data) return <Page><PageError onRetry={reload} /></Page>;

  async function changeState(label: string) {
    const stato = STATES.find((s) => STATE_LABEL[s] === label)!;
    const result = await setUserState(id, stato);
    if (result.ok) {
      setData(result.data);
      toast.show({ tone: "success", title: `Stato: ${label.toLowerCase()}` });
    }
  }

  async function remove() {
    await deleteUser(id);
    toast.show({ tone: "success", title: `${data!.nome} eliminato` });
    navigate("/admin/utenti");
  }

  return (
    <Page>
      <PageHeader
        back={{ to: "/admin/utenti", label: "Utenti" }}
        title={data.nome}
        subtitle={data.email}
        actions={
          <>
            <IconButton label="Modifica" icon={<Pencil size={15} />} to={`/admin/utenti/${id}/modifica`} />
            <IconButton label="Elimina" icon={<Trash2 size={15} />} tone="danger" onClick={() => setConfirm(true)} />
          </>
        }
      />

      <DetailList
        items={[
          { label: "Ruolo", value: ROLE_LABEL[data.ruolo] },
          { label: "Azienda", value: data.azienda },
          { label: "Telefono", value: data.telefono },
          { label: "Ultimo accesso", value: data.ultimo },
          { label: "Registrato il", value: formatDate(data.creato) },
        ]}
      />

      <Section title="Accesso">
        <SegmentedControl options={STATES.map((s) => STATE_LABEL[s])} value={STATE_LABEL[data.stato]} onChange={changeState} className="w-full sm:w-fit" />
        <p className="text-[13.5px] text-ink-2">{STATE_HINT[data.stato]}</p>
      </Section>

      <ConfirmDialog open={confirm} title={`Eliminare ${data.nome}?`} actionLabel="Elimina" confirmText={data.nome.split(" ")[0]} onConfirm={remove} onClose={() => setConfirm(false)}>
        L'account e i suoi dati personali verranno cancellati. Le richieste restano nello storico.
      </ConfirmDialog>
    </Page>
  );
}
