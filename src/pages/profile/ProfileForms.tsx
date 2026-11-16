/* Schede Dati e Sicurezza del profilo. Salvataggio con un bottone, attivo solo se c'è qualcosa da salvare. */
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { PasswordField } from "@/components/form/PasswordField";
import { PasswordChecklist } from "@/components/form/PasswordChecklist";
import { PhoneField } from "@/components/form/PhoneField";
import { useToast } from "@/components/feedback/toast-context";
import { changePassword, saveAccount } from "@/api/feed";
import type { SessionUser } from "@/api/auth";
import { useFormFields } from "@/lib/forms/useFormFields";
import { email, newPassword, phone, samePassword } from "@/lib/validation";
import { saveSession } from "@/lib/session";

function SaveButton({ disabled, busy, label = "Salva" }: { disabled: boolean; busy: boolean; label?: string }) {
  return (
    <div className="flex justify-end border-t border-line pt-5">
      <Button type="submit" variant="primary" disabled={disabled || busy} className="h-9 min-w-24">{busy ? "Salvataggio" : label}</Button>
    </div>
  );
}

export function ProfileData({ user }: { user: SessionUser }) {
  const toast = useToast();
  const [prefix, setPrefix] = useState("+39");
  const form = useFormFields({
    nome: { initial: user.name, rules: [] },
    email: { initial: user.email, rules: [email] },
    telefono: { rules: [phone(() => prefix)], optional: true },
  });
  const [busy, setBusy] = useState(false);
  const changed = form.values.nome !== user.name || form.values.email !== user.email || form.values.telefono !== "";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.isValid || !changed) return;
    setBusy(true);
    await saveAccount(form.values);
    setBusy(false);
    saveSession({ ...user, name: form.values.nome.trim(), email: form.values.email.trim() }, true);
    toast.show({ tone: "success", title: "Dati aggiornati" });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1">
      <TextField {...form.field("nome")} label="Nome e cognome" autoComplete="name" />
      <TextField {...form.field("email")} label="Email" type="email" autoComplete="email" hint="Se la cambi, ti mandiamo un link per confermarla." />
      <PhoneField {...form.field("telefono")} label="Telefono" hint="Facoltativo." prefix={prefix} onPrefixChange={setPrefix} />
      <SaveButton disabled={!form.isValid || !changed} busy={busy} />
    </form>
  );
}

export function ProfileSecurity() {
  const toast = useToast();
  const newValue = useRef("");
  const form = useFormFields({
    attuale: { rules: [] },
    nuova: { rules: [newPassword] },
    conferma: { rules: [samePassword(() => newValue.current)] },
  });
  newValue.current = form.values.nuova;
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const nuova = form.field("nuova");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.isValid) return;
    setBusy(true);
    const result = await changePassword(form.values.attuale, form.values.nuova);
    setBusy(false);
    if (!result.ok) { setWrong(true); form.setValue("attuale", ""); return; }
    ["attuale", "nuova", "conferma"].forEach((k) => form.setValue(k as "attuale", ""));
    toast.show({ tone: "success", title: "Password aggiornata" });
  }

  const attuale = form.field("attuale");
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1">
      <PasswordField {...attuale} onChange={(v) => { setWrong(false); attuale.onChange(v); }} label="Password attuale" autoComplete="current-password" error={wrong ? "La password attuale non è corretta." : null} />
      <PasswordField {...nuova} error={null} label="Nuova password" autoComplete="new-password" />
      <PasswordChecklist value={nuova.value} />
      <PasswordField {...form.field("conferma")} label="Ripeti la nuova password" autoComplete="new-password" />
      <SaveButton disabled={!form.isValid} busy={busy} label="Cambia password" />
    </form>
  );
}
