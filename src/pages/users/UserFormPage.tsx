/* Creazione e modifica utente su pagina dedicata. Il nuovo utente riceve un'email per scegliere la password. */
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SegmentedControl } from "@/components/atoms/SegmentedControl";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { PageError, PageLoading } from "@/components/app/PageState";
import { TextField } from "@/components/form/TextField";
import { PhoneField } from "@/components/form/PhoneField";
import { FormActions } from "@/components/form/FormActions";
import { fieldLabel } from "@/components/form/fieldStyles";
import { useToast } from "@/components/feedback/toast-context";
import { getUser, ROLE_LABEL, saveUser, type UserItem, type UserRole } from "@/api/users";
import { useFormFields } from "@/lib/forms/useFormFields";
import { useLoad } from "@/lib/data/useLoad";
import { email, phone } from "@/lib/validation";

const ROLES: UserRole[] = ["cliente", "operatore", "admin"];

export function UserFormPage() {
  const { id } = useParams();
  const existing = useLoad(() => (id ? getUser(id) : Promise.resolve({ ok: true as const, data: undefined })), [id]);
  if (id && existing.loading && !existing.data) return <Page><PageLoading /></Page>;
  if (id && (existing.error || !existing.data)) return <Page><PageError onRetry={existing.reload} /></Page>;
  return <UserForm user={existing.data} />;
}

function UserForm({ user }: { user?: UserItem }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [prefix, setPrefix] = useState(user?.telefono.split(" ")[0] ?? "+39");
  const form = useFormFields({
    nome: { initial: user?.nome, rules: [] },
    email: { initial: user?.email, rules: [email] },
    azienda: { initial: user?.azienda, rules: [], optional: true },
    telefono: { initial: user?.telefono.split(" ").slice(1).join(" "), rules: [phone(() => prefix)], optional: true },
  });
  const [role, setRole] = useState(ROLE_LABEL[user?.ruolo ?? "cliente"]);
  const [saving, setSaving] = useState(false);
  const [taken, setTaken] = useState(false);
  const backTo = user ? `/admin/utenti/${user.id}` : "/admin/utenti";

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.isValid || saving) return;
    setSaving(true);
    const v = form.values;
    const ruolo = ROLES.find((r) => ROLE_LABEL[r] === role)!;
    const result = await saveUser({ nome: v.nome.trim(), email: v.email.trim().toLowerCase(), ruolo, azienda: v.azienda.trim(), telefono: v.telefono ? `${prefix} ${v.telefono.trim()}` : "" }, user?.id);
    setSaving(false);
    if (!result.ok) return result.error === "email_esistente" ? setTaken(true) : toast.show({ tone: "error", title: "Salvataggio non riuscito" });
    toast.show({ tone: "success", title: user ? "Modifiche salvate" : "Utente creato", body: user ? undefined : "Riceverà un'email per scegliere la password." });
    navigate(`/admin/utenti/${result.data.id}`);
  }

  const emailField = form.field("email");
  const phoneField = form.field("telefono");

  return (
    <Page>
      <PageHeader back={{ to: backTo, label: user ? user.nome : "Utenti" }} title={user ? "Modifica utente" : "Nuovo utente"} />
      <form onSubmit={submit} noValidate className="flex max-w-[560px] flex-col gap-1">
        <TextField {...form.field("nome")} label="Nome e cognome" autoComplete="off" autoFocus={!user} />
        <TextField {...emailField} onChange={(v) => { setTaken(false); emailField.onChange(v); }} error={taken ? "Questa email è già usata da un altro account." : emailField.error} label="Email" type="email" autoComplete="off" />
        <div className="flex flex-col gap-1.5 pb-[18px]">
          <span className={fieldLabel}>Ruolo</span>
          <SegmentedControl options={ROLES.map((r) => ROLE_LABEL[r])} value={role} onChange={setRole} className="w-full sm:w-fit" />
        </div>
        <TextField {...form.field("azienda")} label="Azienda" hint="Facoltativa." autoComplete="off" />
        <PhoneField {...phoneField} label="Telefono" hint="Facoltativo." prefix={prefix} onPrefixChange={setPrefix} />
        <FormActions cancelTo={backTo} submitLabel={user ? "Salva" : "Crea"} busy={saving} disabled={!form.isValid || taken} />
      </form>
    </Page>
  );
}
