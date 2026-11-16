/*
 * Profilo dell'utente collegato, diviso in schede (una cosa per volta): Dati, Sicurezza,
 * Preferenze, Account. La scheda aperta sta nell'indirizzo (?scheda=) così si può condividere.
 */
import { useSearchParams } from "react-router-dom";
import { PageTabs } from "@/components/app/PageTabs";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileData, ProfileSecurity } from "@/pages/profile/ProfileForms";
import { ProfileAccount, ProfilePreferences } from "@/pages/profile/ProfileSettings";
import { readSession } from "@/lib/session";

const TABS = ["Dati", "Sicurezza", "Preferenze", "Account"] as const;
type Tab = (typeof TABS)[number];

export function ProfilePage() {
  const [params, setParams] = useSearchParams();
  const user = readSession()!;
  const tab = (TABS.find((t) => t === params.get("scheda")) ?? "Dati") as Tab;

  return (
    <Page>
      <PageHeader title="Profilo" />
      <div>
        <PageTabs options={TABS} value={tab} onChange={(t) => setParams({ scheda: t }, { replace: true })} />
      </div>
      <div key={tab} className="anim-swap max-w-[560px]">
        {tab === "Dati" && <ProfileData user={user} />}
        {tab === "Sicurezza" && <ProfileSecurity />}
        {tab === "Preferenze" && <ProfilePreferences />}
        {tab === "Account" && <ProfileAccount />}
      </div>
    </Page>
  );
}
