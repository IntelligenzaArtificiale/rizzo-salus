/*
 * Backup: pianificazione (frequenza, ora, copie da tenere, allegati), copie disponibili con
 * scarica e ripristina, backup manuale. Il backup e il ripristino li esegue il server.
 * Ripristinare sostituisce i dati attuali: conferma con il testo da riscrivere.
 */
import { useState } from "react";
import { DatabaseBackup, Download, RotateCcw } from "lucide-react";
import { SegmentedControl } from "@/components/atoms/SegmentedControl";
import { StatusPill } from "@/components/atoms/StatusPill";
import { SelectField } from "@/components/form/SelectField";
import { SwitchRow } from "@/components/form/SwitchRow";
import { fieldLabel } from "@/components/form/fieldStyles";
import { SaveBar, SettingsSection } from "@/components/app/SettingsSection";
import { PageError, PageLoading } from "@/components/app/PageState";
import { PrimaryAction } from "@/components/app/IconButton";
import { ActionMenu } from "@/components/app/ActionMenu";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { useToast } from "@/components/feedback/toast-context";
import { createBackup, listBackups, restoreBackup, saveBackupSettings, type BackupItem, type BackupSettings } from "@/api/admin";
import { useLoad } from "@/lib/data/useLoad";
import { useSettingsForm } from "@/lib/forms/useSettingsForm";
import { useSubmit } from "@/lib/forms/useSubmit";
import { useMockApi } from "@/config/app";

const FREQ = ["Ogni giorno", "Ogni settimana", "Spento"] as const;
const HOURS = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00"].map((h) => ({ value: h, label: h }));

export function BackupTab() {
  const { data, error, reload } = useLoad(listBackups);
  if (error) return <PageError onRetry={reload} />;
  if (!data) return <PageLoading label="Carico i backup" />;
  return <BackupForm settings={data.impostazioni} copies={data.copie} reload={reload} />;
}

function BackupForm({ settings, copies, reload }: { settings: BackupSettings; copies: BackupItem[]; reload: () => void }) {
  const form = useSettingsForm(settings, async (v) => (await saveBackupSettings(v)).ok, "Pianificazione aggiornata");
  const s = form.value;
  const off = s.frequenza === "Spento";
  return (
    <>
    <form onSubmit={form.submit} noValidate>
      <SettingsSection title="Pianificazione" description="Copia automatica di dati e documenti, eseguita dal server di notte.">
        <div className="flex flex-col gap-1.5 pb-[18px]">
          <span className={fieldLabel}>Frequenza</span>
          <SegmentedControl options={FREQ} value={s.frequenza as (typeof FREQ)[number]} onChange={(v) => form.patch({ frequenza: v })} className="w-full sm:w-fit" />
          {off && <p className="text-[12.5px] text-orange">Senza backup automatici i dati si possono perdere: tienilo acceso.</p>}
        </div>
        {!off && (
          <div className="grid gap-x-4 sm:grid-cols-2">
            <SelectField label="Ora" value={s.ora} onChange={(v) => form.patch({ ora: v })} options={HOURS} />
            <SelectField label="Copie da tenere" value={s.conserva} onChange={(v) => form.patch({ conserva: v })} options={[["7", "Ultime 7"], ["14", "Ultime 14"], ["30", "Ultime 30"]].map(([value, label]) => ({ value, label }))} />
          </div>
        )}
        <SwitchRow title="Includi i documenti caricati" description="Allegati e immagini, oltre ai dati. Le copie sono più grandi." checked={s.allegati} onChange={(v) => form.patch({ allegati: v })} />
      </SettingsSection>
      <SaveBar dirty={form.dirty} busy={form.busy} onReset={form.reset} />
    </form>
      <SettingsSection title="Copie disponibili" description="Le più recenti per prime. Scarica una copia o riporta la piattaforma a quel momento.">
        <Copies copies={copies} reload={reload} />
      </SettingsSection>
    {form.dialog}
    </>
  );
}

function Copies({ copies, reload }: { copies: BackupItem[]; reload: () => void }) {
  const toast = useToast();
  const { busy, run } = useSubmit();
  const [restore, setRestore] = useState<BackupItem | null>(null);
  const [restoring, setRestoring] = useState(false);

  const create = async () => {
    const r = await run(createBackup);
    if (!r) return;
    toast.show(r.ok ? { tone: "success", title: "Backup creato" } : { tone: "error", title: "Backup non riuscito", body: "Riprova tra qualche minuto." });
    reload();
  };
  const download = (b: BackupItem) => {
    if (!useMockApi) { window.location.assign(`./api/backup/scarica?id=${encodeURIComponent(b.id)}`); return; }
    toast.show({ tone: "info", title: "Download pronto con il backend", body: "Nell'anteprima le copie non contengono file." });
  };
  const doRestore = async () => {
    if (!restore) return;
    setRestoring(true);
    const r = await restoreBackup(restore.id);
    setRestoring(false);
    setRestore(null);
    toast.show(r.ok ? { tone: "success", title: "Ripristino avviato", body: "Ti avvisiamo per email quando è finito." } : { tone: "error", title: "Ripristino non riuscito" });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-ink-2">{copies.length} copie</span>
        <PrimaryAction label={busy ? "Backup in corso" : "Crea backup ora"} icon={busy ? <span aria-hidden className="size-3.5 rounded-full border-2 border-current/30 border-t-current anim-spin" /> : <DatabaseBackup size={15} />} onClick={() => void create()} />
      </div>
      <ul className="overflow-hidden rounded-card bg-surface shadow-card" aria-busy={busy}>
        {copies.map((b, i) => (
          <li key={b.id} data-row className={`flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 ${i === 0 && b.tipo === "Manuale" ? "anim-flash" : ""}`}>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[14px] font-medium text-ink">{b.quando}</span>
              <span className="truncate text-[12.5px] text-ink-2">{b.tipo} · {b.dimensione}</span>
            </span>
            <StatusPill tone={b.esito === "completata" ? "green" : "red"}>{b.esito === "completata" ? "Completato" : "Non riuscito"}</StatusPill>
            {b.esito === "completata" && (
              <ActionMenu label={`Azioni per il backup di ${b.quando}`} visible actions={[
                { label: "Scarica", icon: <Download size={15} />, onSelect: () => download(b) },
                { label: "Ripristina", icon: <RotateCcw size={15} />, danger: true, onSelect: () => setRestore(b) },
              ]} />
            )}
          </li>
        ))}
      </ul>
      <ConfirmDialog open={Boolean(restore)} title="Ripristinare questo backup?" actionLabel="Ripristina" confirmText="RIPRISTINA" busy={restoring} onClose={() => !restoring && setRestore(null)} onConfirm={() => void doRestore()}>
        La piattaforma torna a come era {restore?.quando.toLowerCase()}: le modifiche successive si perdono. Prima del ripristino il server crea una copia dei dati attuali. Scrivi RIPRISTINA per confermare.
      </ConfirmDialog>
    </div>
  );
}
