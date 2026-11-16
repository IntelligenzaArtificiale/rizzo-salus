/*
 * Sicurezza: regole delle password, verifica in due passaggi, blocco dopo tentativi errati,
 * durata delle sessioni, accesso degli amministratori, sessioni aperte del proprio account.
 * Le regole le applica il backend; qui si scelgono. Salvataggio con SaveBar, sessioni con conferma.
 */
import { useState } from "react";
import { LogOut } from "lucide-react";
import { SegmentedControl } from "@/components/atoms/SegmentedControl";
import { SelectField } from "@/components/form/SelectField";
import { SwitchRow } from "@/components/form/SwitchRow";
import { TextAreaField } from "@/components/form/TextAreaField";
import { fieldLabel } from "@/components/form/fieldStyles";
import { SaveBar, SettingsSection } from "@/components/app/SettingsSection";
import { PageError, PageLoading } from "@/components/app/PageState";
import { IconButton } from "@/components/app/IconButton";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Button } from "@/components/atoms/Button";
import { useToast } from "@/components/feedback/toast-context";
import { endSession, getSecurity, listSessions, saveSecurity, type SecuritySettings } from "@/api/admin";
import { useLoad } from "@/lib/data/useLoad";
import { useSettingsForm } from "@/lib/forms/useSettingsForm";

const opts = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));
const TWO_FA = { facoltativa: "Facoltativa", amministratori: "Amministratori", tutti: "Tutti" } as const;

export function SecurityTab() {
  const { data, error, reload } = useLoad(getSecurity);
  if (error) return <PageError onRetry={reload} />;
  if (!data) return <PageLoading label="Carico le regole di sicurezza" />;
  return <SecurityForm saved={data} />;
}

function SecurityForm({ saved }: { saved: SecuritySettings }) {
  const form = useSettingsForm(saved, async (v) => (await saveSecurity(v)).ok, "Regole di sicurezza aggiornate");
  const s = form.value;
  return (
    <>
    <form onSubmit={form.submit} noValidate>
      <SettingsSection title="Password" description="Valgono per le nuove password e al prossimo cambio.">
        <SelectField label="Lunghezza minima" value={s.passwordMin} onChange={(v) => form.patch({ passwordMin: v })} options={opts([["8", "8 caratteri"], ["10", "10 caratteri"], ["12", "12 caratteri"], ["14", "14 caratteri"]])} />
        <SelectField label="Cambio obbligatorio" value={s.passwordScadenza} onChange={(v) => form.patch({ passwordScadenza: v })} options={opts([["mai", "Mai"], ["90", "Ogni 90 giorni"], ["180", "Ogni 180 giorni"]])} />
        <SwitchRow title="Richiedi un simbolo" description="Oltre a lettere e numeri, almeno un carattere come ! o #." checked={s.passwordSimboli} onChange={(v) => form.patch({ passwordSimboli: v })} />
      </SettingsSection>

      <SettingsSection title="Accesso" description="Come si protegge l'ingresso agli account.">
        <div className="flex flex-col gap-1.5 pb-[18px]">
          <span className={fieldLabel}>Verifica in due passaggi</span>
          <SegmentedControl options={Object.values(TWO_FA)} value={TWO_FA[s.dueFattori as keyof typeof TWO_FA] ?? TWO_FA.facoltativa}
            onChange={(label) => form.patch({ dueFattori: (Object.keys(TWO_FA) as (keyof typeof TWO_FA)[]).find((k) => TWO_FA[k] === label) ?? "facoltativa" })} className="w-full sm:w-fit" />
          <p className="text-[12.5px] text-ink-3">Per chi è obbligatoria: codice da un'app di autenticazione a ogni nuovo accesso.</p>
        </div>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <SelectField label="Tentativi prima del blocco" value={s.tentativi} onChange={(v) => form.patch({ tentativi: v })} options={opts([["3", "3 tentativi"], ["5", "5 tentativi"], ["10", "10 tentativi"]])} />
          <SelectField label="Durata del blocco" value={s.bloccoMinuti} onChange={(v) => form.patch({ bloccoMinuti: v })} options={opts([["5", "5 minuti"], ["15", "15 minuti"], ["60", "1 ora"]])} />
        </div>
        <SelectField label="Uscita automatica dopo" value={s.sessioneInattiva} onChange={(v) => form.patch({ sessioneInattiva: v })} options={opts([["30m", "30 minuti di inattività"], ["2h", "2 ore di inattività"], ["8h", "8 ore di inattività"], ["1g", "1 giorno di inattività"]])} />
        <SwitchRow title="Consenti «Ricordami»" description="Chi lo sceglie resta collegato su quel dispositivo per 30 giorni." checked={s.ricordami} onChange={(v) => form.patch({ ricordami: v })} />
        <SwitchRow title="Avvisa dei nuovi accessi" description="Email quando un account entra da un dispositivo mai usato." checked={s.avvisoNuovoAccesso} onChange={(v) => form.patch({ avvisoNuovoAccesso: v })} />
      </SettingsSection>

      <SettingsSection title="Amministratori" description="Restrizioni in più per chi gestisce la piattaforma.">
        <SwitchRow title="Accesso solo da indirizzi conosciuti" description="Gli amministratori entrano solo dalle reti indicate sotto." checked={s.limitaAdmin} onChange={(v) => form.patch({ limitaAdmin: v })} />
        {s.limitaAdmin && (
          <div className="anim-swap pt-3">
            <TextAreaField label="Indirizzi IP consentiti" value={s.indirizziAdmin} onChange={(v) => form.patch({ indirizziAdmin: v })} rows={3} placeholder="Uno per riga, es. 93.45.12.8" hint="Chiedi gli indirizzi a chi gestisce la rete dell'ufficio." />
          </div>
        )}
      </SettingsSection>

      <SaveBar dirty={form.dirty} busy={form.busy} onReset={form.reset} />
    </form>
    <SettingsSection title="Le tue sessioni" description="Dispositivi collegati al tuo account adesso.">
        <Sessions />
    </SettingsSection>
    {form.dialog}
    </>
  );
}

function Sessions() {
  const toast = useToast();
  const { data, reload } = useLoad(listSessions);
  const [confirmAll, setConfirmAll] = useState(false);
  const close = async (id: string) => {
    const r = await endSession(id);
    toast.show(r.ok ? { tone: "success", title: id === "altre" ? "Altre sessioni chiuse" : "Sessione chiusa" } : { tone: "error", title: "Sessione non chiusa" });
    setConfirmAll(false);
    reload();
  };
  if (!data) return <PageLoading label="Carico le sessioni" />;
  const others = data.filter((s) => !s.corrente);
  return (
    <div className="flex flex-col gap-3">
      <ul className="overflow-hidden rounded-card bg-surface shadow-card">
        {data.map((s) => (
          <li key={s.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[14px] font-medium text-ink">{s.dispositivo}{s.corrente && <span className="ml-2 text-[12.5px] font-normal text-green">questo dispositivo</span>}</span>
              <span className="truncate text-[12.5px] text-ink-2">{s.luogo} · {s.ultimo}</span>
            </span>
            {!s.corrente && <IconButton label={`Disconnetti ${s.dispositivo}`} icon={<LogOut size={15} />} onClick={() => void close(s.id)} />}
          </li>
        ))}
      </ul>
      {others.length > 0 && <Button type="button" variant="secondary" size="sm" className="w-fit" onClick={() => setConfirmAll(true)}>Disconnetti tutte le altre</Button>}
      <ConfirmDialog open={confirmAll} title="Disconnettere gli altri dispositivi?" actionLabel="Disconnetti" onClose={() => setConfirmAll(false)} onConfirm={() => void close("altre")}>
        Su {others.length === 1 ? "un dispositivo" : `${others.length} dispositivi`} servirà accedere di nuovo.
      </ConfirmDialog>
    </div>
  );
}
