/* Moduli: ogni funzione si accende o si spegne, raggruppate per area. Ogni interruttore si salva da solo. */
import { SwitchRow } from "@/components/form/SwitchRow";
import { SettingsSection } from "@/components/app/SettingsSection";
import { useToast } from "@/components/feedback/toast-context";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { FEATURES, type FeatureGroup, type FeatureKey } from "@/lib/platform/defaults";

const GROUPS: { group: FeatureGroup; description: string }[] = [
  { group: "Accesso", description: "Chi può entrare nella piattaforma." },
  { group: "Contenuti", description: "Pagine pubbliche e file caricati." },
  { group: "Assistente", description: "Chat, voce e lettura delle risposte." },
  { group: "Interfaccia", description: "Notifiche, ricerca e aspetto." },
];

export function ModulesTab() {
  const { settings, update } = usePlatform();
  const toast = useToast();
  const toggle = (key: FeatureKey, on: boolean) =>
    update({ features: { ...settings.features, [key]: on } }).then((ok) =>
      toast.show(ok ? { tone: "success", title: on ? "Modulo acceso" : "Modulo spento" } : { tone: "error", title: "Modifica non salvata" }));
  return (
    <div>
      {GROUPS.map(({ group, description }) => (
        <SettingsSection key={group} title={group} description={description}>
          {FEATURES.filter((f) => f.group === group).map((f) => (
            <SwitchRow key={f.key} title={f.label} description={f.description} checked={settings.features[f.key]} onChange={(v) => toggle(f.key, v)} />
          ))}
        </SettingsSection>
      ))}
    </div>
  );
}
