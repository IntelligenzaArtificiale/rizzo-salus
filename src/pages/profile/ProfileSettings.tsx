/* Schede Preferenze (si salvano da sole) e Account (eliminazione con conferma scritta). */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/atoms/Button";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { SwitchRow } from "@/components/form/SwitchRow";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { useToast } from "@/components/feedback/toast-context";
import { deleteAccount } from "@/api/feed";
import { clearSession } from "@/lib/session";

export function ProfilePreferences() {
  const [prefs, setPrefs] = useState({ richieste: true, riepilogo: false, novita: false });
  const set = (k: keyof typeof prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));
  return (
    <div className="flex flex-col">
      <SwitchRow title="Aggiornamenti sulle richieste" description="Un'email quando cambia lo stato di una tua richiesta." checked={prefs.richieste} onChange={set("richieste")} />
      <SwitchRow title="Riepilogo settimanale" description="Il lunedì mattina, con le richieste aperte." checked={prefs.riepilogo} onChange={set("riepilogo")} />
      <SwitchRow title="Novità e offerte" checked={prefs.novita} onChange={set("novita")} />
      <div className="flex items-center gap-4 py-3.5">
        <p className="flex-1 text-[14px] font-medium text-ink">Tema</p>
        <ThemeToggle />
      </div>
    </div>
  );
}

export function ProfileAccount() {
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await deleteAccount("Password123");
    setBusy(false);
    clearSession();
    toast.show({ tone: "success", title: "Account eliminato" });
    navigate("/accedi");
  }

  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-line p-5">
      <p className="text-[15px] font-semibold text-ink">Elimina account</p>
      <p className="text-[14px] text-ink-2">Cancella i tuoi dati personali. Non si può annullare.</p>
      <Button type="button" variant="secondary" className="text-red" onClick={() => setOpen(true)}>Elimina account</Button>
      <ConfirmDialog open={open} title="Eliminare il tuo account?" actionLabel="Elimina" confirmText="ELIMINA" busy={busy} onConfirm={remove} onClose={() => setOpen(false)}>
        Perderai l'accesso e lo storico delle tue richieste.
      </ConfirmDialog>
    </div>
  );
}
