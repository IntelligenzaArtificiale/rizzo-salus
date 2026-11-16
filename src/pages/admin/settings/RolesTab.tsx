/*
 * Ruoli e permessi (RBAC). In alto i ruoli con quante persone li hanno e quanti permessi danno;
 * sotto la matrice permesso × ruolo con le checkbox delle Records Table, raggruppata per area,
 * con «tutti/nessuno» per gruppo. L'amministratore ha sempre tutto: nessuno può chiudersi fuori.
 */
import { Check, Minus } from "lucide-react";
import { SaveBar, SettingsSection } from "@/components/app/SettingsSection";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { PERMISSIONS, type Permission, type RoleKey } from "@/lib/platform/defaults";
import { useSettingsForm } from "@/lib/forms/useSettingsForm";
import { useLoad } from "@/lib/data/useLoad";
import { listUsers } from "@/api/users";

/* ruoli degli utenti → chiavi dei ruoli della piattaforma */
const USER_ROLE: Record<string, RoleKey> = { admin: "admin", operatore: "operatore", cliente: "utente", utente: "utente" };
const ROLE_NOTE: Record<RoleKey, string> = {
  admin: "Gestisce tutto, comprese impostazioni e ruoli.",
  operatore: "Lavora sulle richieste di tutti i clienti.",
  utente: "Vede e crea solo le proprie richieste.",
};

function Box({ state, label, disabled, onClick }: { state: "on" | "off" | "some"; label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <label className={`records-checkbox ${disabled ? "opacity-60" : "cursor-pointer"}`} title={label}>
      <input type="checkbox" checked={state === "on"} disabled={disabled} onChange={onClick} aria-label={label} aria-checked={state === "some" ? "mixed" : state === "on"} />
      <span className={`records-checkbox-box ${state !== "off" ? "is-active" : ""}`}>
        {state === "on" && <Check size={12} strokeWidth={2.5} />}{state === "some" && <Minus size={12} strokeWidth={2.5} />}
      </span>
    </label>
  );
}

export function RolesTab() {
  const { settings, update } = usePlatform();
  const form = useSettingsForm(settings.roles, (roles) => update({ roles }), "Permessi aggiornati");
  const roles = form.value;
  const users = useLoad(listUsers);
  const keys = Object.keys(roles) as RoleKey[];
  const groups = [...new Set(PERMISSIONS.map((p) => p.group))];
  const count = (k: RoleKey) => users.data?.filter((u) => USER_ROLE[u.ruolo] === k).length;

  const setPerms = (role: RoleKey, perms: Permission[], on: boolean) => form.setValue((r) => {
    const cur = new Set(r[role].permessi);
    perms.forEach((p) => (on ? cur.add(p) : cur.delete(p)));
    return { ...r, [role]: { ...r[role], permessi: [...cur] } };
  });

  return (
    <>
    <form onSubmit={form.submit} noValidate>
      <SettingsSection title="Ruoli" description="Ogni persona ha un ruolo; il ruolo decide cosa vede e cosa può fare.">
        <ul className="grid gap-3 sm:grid-cols-3">
          {keys.map((k) => (
            <li key={k} className="flex flex-col gap-1 rounded-card bg-surface p-3.5 shadow-card">
              <span className="text-[14px] font-semibold text-ink">{roles[k].label}</span>
              <span className="text-[12.5px] leading-snug text-ink-2">{ROLE_NOTE[k]}</span>
              <span className="mt-1 text-[12.5px] text-ink-3 tabular-nums">
                {count(k) === undefined ? "…" : `${count(k)} ${count(k) === 1 ? "persona" : "persone"}`} · {roles[k].permessi.length} di {PERMISSIONS.length} permessi
              </span>
            </li>
          ))}
        </ul>
      </SettingsSection>
      <SettingsSection title="Permessi" description="Spunta cosa può fare ogni ruolo. La casella del gruppo li accende o spegne tutti insieme.">
        <div className="overflow-x-auto rounded-card bg-surface shadow-card">
          <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-[var(--grid-line)] text-left text-[12.5px] text-ink-2">
                <th className="px-4 py-2.5 font-medium">Permesso</th>
                {keys.map((k) => <th key={k} className="w-28 px-2 py-2.5 text-center font-medium">{roles[k].label}</th>)}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const perms = PERMISSIONS.filter((p) => p.group === g);
                return [
                  <tr key={g} className="bg-inset">
                    <td className="px-4 py-1.5 text-[12px] font-medium text-ink-3">{g}</td>
                    {keys.map((k) => {
                      const n = perms.filter((p) => roles[k].permessi.includes(p.key)).length;
                      const state = n === perms.length ? "on" : n ? "some" : "off";
                      return <td key={k} className="px-2 py-1.5 text-center"><Box state={state} disabled={k === "admin"} label={`${roles[k].label}: tutto ${g}`} onClick={() => setPerms(k, perms.map((p) => p.key), state !== "on")} /></td>;
                    })}
                  </tr>,
                  ...perms.map((p) => (
                    <tr key={p.key} className="border-b border-[var(--grid-line)] last:border-0">
                      <td className="px-4 py-2.5 text-ink">{p.label}</td>
                      {keys.map((k) => {
                        const on = roles[k].permessi.includes(p.key);
                        return <td key={k} className="px-2 py-2 text-center"><Box state={on ? "on" : "off"} disabled={k === "admin"} label={k === "admin" ? "L'amministratore ha sempre tutti i permessi" : `${roles[k].label}: ${p.label}`} onClick={() => setPerms(k, [p.key], !on)} /></td>;
                      })}
                    </tr>
                  )),
                ];
              })}
            </tbody>
          </table>
        </div>
      </SettingsSection>
      <SaveBar dirty={form.dirty} busy={form.busy} onReset={form.reset} />
    </form>
    {form.dialog}
    </>
  );
}
