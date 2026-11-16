/*
 * Impostazioni della piattaforma (permesso impostazioni.gestisci), una scheda per area.
 * La scheda aperta sta nell'indirizzo (?scheda=). Ruoli solo con ruoli.gestisci.
 * Ogni scheda usa SettingsSection (titolo a sinistra, controlli a destra) e, se si salva
 * con un bottone, SaveBar + avviso di uscita (useSettingsForm).
 */
import { useSearchParams } from "react-router-dom";
import { PageTabs } from "@/components/app/PageTabs";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { ModulesTab } from "@/pages/admin/settings/ModulesTab";
import { BrandTab } from "@/pages/admin/settings/BrandTab";
import { SeoTab } from "@/pages/admin/settings/SeoTab";
import { RolesTab } from "@/pages/admin/settings/RolesTab";
import { AppearanceTab } from "@/pages/admin/settings/AppearanceTab";
import { SecurityTab } from "@/pages/admin/settings/SecurityTab";
import { BackupTab } from "@/pages/admin/settings/BackupTab";
import { AutomationsTab } from "@/pages/admin/settings/AutomationsTab";
import { Integrations } from "@/pages/admin/settings/ExtraTabs";

const ALL = ["Moduli", "Marchio", "Aspetto", "SEO", "Ruoli", "Sicurezza", "Backup", "Automazioni", "Integrazioni"] as const;
type Tab = (typeof ALL)[number];

export function SettingsPage() {
  const { can } = usePlatform();
  const tabs = ALL.filter((t) => t !== "Ruoli" || can("ruoli.gestisci"));
  const [params, setParams] = useSearchParams();
  const tab = (tabs.find((t) => t === params.get("scheda")) ?? "Moduli") as Tab;
  return (
    <Page>
      <PageHeader title="Impostazioni" />
      <PageTabs label="Impostazioni" options={tabs} value={tab} onChange={(t) => setParams({ scheda: t }, { replace: true })} />
      <div key={tab} className="anim-swap">
        {tab === "Moduli" && <ModulesTab />}
        {tab === "Marchio" && <BrandTab />}
        {tab === "Aspetto" && <AppearanceTab />}
        {tab === "SEO" && <SeoTab />}
        {tab === "Ruoli" && <RolesTab />}
        {tab === "Sicurezza" && <SecurityTab />}
        {tab === "Backup" && <BackupTab />}
        {tab === "Automazioni" && <AutomationsTab />}
        {tab === "Integrazioni" && <Integrations />}
      </div>
    </Page>
  );
}
