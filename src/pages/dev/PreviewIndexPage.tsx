/*
 * Indice dei percorsi da provare con i dati finti. Esiste solo senza backend collegato
 * (useMockApi): in produzione la rotta non viene registrata. "Entra come" crea una sessione finta.
 */
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import GlideMenu from "@/components/primitives/GlideMenu";
import { saveSession } from "@/lib/session";

const ADMIN = { id: "u1", name: "Giulia Ferraro", email: "admin@demo.it", role: "admin" as const };
const USER = { id: "u2", name: "Marco Russo", email: "utente@demo.it", role: "utente" as const };

const GROUPS = [
  { title: "Guide", links: [["Componenti e mapping", "/anteprima/componenti"], ["Email", "/anteprima/email"]] },
  { title: "Area riservata", links: [["Entra come amministratore", "/admin", ADMIN], ["Entra come utente", "/area", USER]] },
  { title: "Novità", links: [["Blog pubblico", "/blog"], ["Gestione blog (admin)", "/admin/blog", ADMIN], ["Impostazioni: moduli, marchio, SEO, ruoli", "/admin/impostazioni", ADMIN]] },
  { title: "Accesso e sito", links: [["Accedi", "/accedi"], ["Privacy e termini", "/privacy"]] },
  {
    title: "Registrazione",
    links: [
      ["Verifica email all'inizio", "/registrazione?modo=verifica-prima"],
      ["Verifica email alla fine", "/registrazione?modo=verifica-dopo"],
      ["Link di verifica scaduto", "/verifica-email/scaduto"],
    ],
  },
  { title: "Password", links: [["Password dimenticata", "/password-dimenticata"], ["Nuova password", "/nuova-password/valido"], ["Link scaduto", "/nuova-password/scaduto"]] },
  { title: "Errori", links: [["Pagina non trovata", "/pagina-inesistente"], ["Accesso negato", "/accesso-negato"], ["Sessione scaduta", "/sessione-scaduta"]] },
] as const;

export function PreviewIndexPage() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Anteprima" subtitle="Password degli account di prova: Password123.">
      <div className="flex flex-col gap-6">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="mb-1.5 text-[12.5px] font-medium text-ink-3">{group.title}</h2>
            <GlideMenu className="-mx-2 flex flex-col" highlightClassName="inset-x-0 rounded-control bg-hover">
              {group.links.map(([label, to, as]) => (
                <Link
                  key={label}
                  to={to}
                  onClick={(e) => { if (as) { e.preventDefault(); saveSession(as, false); navigate(to); } }}
                  data-menu-row
                  className="relative z-10 flex h-9 items-center justify-between rounded-control px-2 text-[14px] text-ink"
                >
                  {label}
                  <ChevronRight size={15} className="text-ink-3" />
                </Link>
              ))}
            </GlideMenu>
          </section>
        ))}
      </div>
    </AuthLayout>
  );
}
