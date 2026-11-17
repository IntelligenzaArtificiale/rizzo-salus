// Menu operativo e amministrazione, filtrati dai permessi originali.
import {
  House,
  CalendarDays,
  Users,
  MessageSquare,
  Sparkles,
  Shield,
  Settings,
} from "lucide-react";
import type { SidebarNavItem } from "@/components/primitives/SidebarNav";
export function clinicNavigation(
  can: (p: string) => boolean,
): SidebarNavItem[] {
  const admin = [
    { key: "/formazione", label: "Formazione" },
    ...(can("fatture.gestisci") || can("personale.presenze")
      ? [{ key: "/pacchetti", label: "Documenti consulenti" }]
      : []),
    ...(can("impostazioni.gestisci")
      ? [{ key: "/importazione", label: "Importazione dati" }]
      : []),
    ...(can("messaggi.invia")
      ? [{ key: "/relazioni", label: "Ricontatti e campagne" }]
      : []),
    ...(can("compensi.vedi_tutti") || can("compensi.vedi_propri")
      ? [{ key: "/compensi", label: "Compensi" }]
      : []),
    ...(can("statistiche.economiche")
      ? [{ key: "/spese", label: "Entrate e uscite" }]
      : []),
    ...(can("personale.presenze") || can("personale.propria_scheda")
      ? [{ key: "/personale", label: "Personale" }]
      : []),
    ...(can("magazzino.gestisci") || can("magazzino.consumi")
      ? [{ key: "/magazzino", label: "Magazzino" }]
      : []),
    ...(can("fatture.gestisci")
      ? [{ key: "/fatture", label: "Fatturazione" }]
      : []),
    ...(can("agenda.vedi_tutto")
      ? [{ key: "/statistiche", label: "Statistiche" }]
      : []),
  ];
  return [
    { key: "/panoramica", label: "Panoramica", icon: <House size={18} /> },
    ...(can("agenda.vedi_tutto") || can("agenda.vedi_propria")
      ? [{ key: "/agenda", label: "Agenda", icon: <CalendarDays size={18} /> }]
      : []),
    ...(can("pazienti.anagrafica") ||
    can("pazienti.essenziali") ||
    can("pazienti.tutti")
      ? [{ key: "/pazienti", label: "Pazienti", icon: <Users size={18} /> }]
      : []),
    ...(can("messaggi.invia")
      ? [
          {
            key: "/comunicazioni",
            label: "Comunicazioni",
            icon: <MessageSquare size={18} />,
          },
        ]
      : []),
    ...(can("prenotazioni.liste_attesa") ||
    can("prenotazioni.liste_attesa_proprie")
      ? [
          {
            key: "/prenotazioni",
            label: "Prenotazioni e attesa",
            icon: <CalendarDays size={18} />,
          },
        ]
      : []),
    ...(can("ai.assistente")
      ? [
          {
            key: "/assistente",
            label: "AI operatore",
            icon: <Sparkles size={18} />,
          },
        ]
      : []),
    ...(admin.length
      ? [
          {
            key: "amministrazione",
            label: "Amministrazione",
            icon: <Shield size={18} />,
            children: admin,
          },
        ]
      : []),
    ...(can("impostazioni.gestisci")
      ? [
          {
            key: "/impostazioni",
            label: "Impostazioni",
            icon: <Settings size={18} />,
          },
        ]
      : []),
  ];
}
