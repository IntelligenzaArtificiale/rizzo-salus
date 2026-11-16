/*
 * Dati d'esempio della guida, in domini diversi e plausibili. Mai codici interni, hash o date
 * senza significato: anche gli esempi insegnano cosa mostrare.
 */
import { Dumbbell, Hammer, Plane, Stethoscope, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { statusOf } from "@/lib/status";

const Media = ({ icon }: { icon: ReactNode }) => <div className="flex h-full w-full items-center justify-center bg-accent-tint text-accent-ink">{icon}</div>;

export const PRODUCTS = [
  { id: "p1", title: "Trapano a percussione 800 W", eyebrow: "Utensili · Marchio Forte", status: statusOf("disponibile"), value: "€ 89,00", meta: ["3 negozi vicini", "Ritiro oggi"], media: <Media icon={<Hammer size={28} />} /> },
  { id: "p2", title: "Set chiavi combinate 12 pezzi", eyebrow: "Utensili · Marchio Forte", status: statusOf("su_richiesta"), value: "€ 34,50", meta: ["Arriva in 3 giorni"], media: <Media icon={<Wrench size={28} />} /> },
  { id: "p3", title: "Livella laser a croce", eyebrow: "Misura · Linea Pro", status: statusOf("non_disponibile"), value: "€ 129,00", meta: ["Avvisami quando torna"], media: <Media icon={<Hammer size={28} />} /> },
];

export const OFFERS = [
  { id: "o1", title: "Weekend a Lisbona", eyebrow: "Viaggi Sole · Volo + hotel", status: statusOf("approvata"), value: "−20% fino al 30 novembre", meta: ["Per 2 persone", "Partenze da Roma e Milano"], media: <Media icon={<Plane size={28} />} /> },
  { id: "o2", title: "Abbonamento trimestrale", eyebrow: "Palestra Centro · Nuovi iscritti", status: statusOf("da_approvare"), value: "3 mesi al prezzo di 2", meta: ["Solo sede di via Roma", "Visibile ai clienti"], media: <Media icon={<Dumbbell size={28} />} /> },
];

export const SERVICES = [
  { id: "s1", title: "Visita di controllo", eyebrow: "Studio Medico Riva", status: statusOf("disponibile"), value: "30 minuti · € 60", meta: ["Primo posto: giovedì 9:30"], media: <Media icon={<Stethoscope size={28} />} /> },
  { id: "s2", title: "Manutenzione caldaia", eyebrow: "Termoservice", status: statusOf("su_richiesta"), value: "Da € 90", meta: ["Intervento in 48 ore"], media: <Media icon={<Wrench size={28} />} /> },
];

export const PEOPLE = [
  { id: "u1", name: "Chiara Leone", role: "Amministratrice", email: "chiara.leone@esempio.it", status: statusOf("approvata"), last: "Oggi, 10:24" },
  { id: "u2", name: "Davide Marino", role: "Operatore", email: "davide.marino@esempio.it", status: statusOf("in_attesa"), last: "Invito inviato ieri" },
  { id: "u3", name: "Sara Fontana", role: "Cliente", email: "sara.fontana@esempio.it", status: statusOf("rifiutata"), last: "Disattivato il 2 ottobre" },
];

export const ACCOUNTS = [
  { id: "a1", name: "Ottica Belvedere", plan: "Piano Plus · 5 utenti", status: statusOf("approvata"), value: "Rinnovo il 12 gennaio", meta: ["Fatturazione annuale"] },
  { id: "a2", name: "Panificio Aurora", plan: "Piano Base · 1 utente", status: statusOf("in_attesa"), value: "Pagamento da verificare", meta: ["Prova gratuita finita ieri"] },
];

export const Avatar = ({ name }: { name: string }) => (
  <span className="flex h-full w-full items-center justify-center bg-inset text-[16px] font-semibold text-ink-2">{name.split(" ").map((p) => p[0]).join("")}</span>
);
