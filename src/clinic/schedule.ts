// Presentazione degli appuntamenti: nessuna transizione di stato calcolata qui.
import type { Data } from "./api";
export const appointmentNames = (a: Data) =>
  Object.values(a.pazienti_nomi || {}).join(", ") || a.nota || "Appuntamento";
export function endedWithoutOutcome(a: Data) {
  const now = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date())
    .replace(" ", "T");
  return ["programmato", "confermato"].includes(a.stato) && a.end < now;
}
export const appointmentStatus = (value: string) => ({
  label:
    (
      {
        programmato: "Programmata",
        confermato: "Confermata",
        eseguito: "Eseguita",
        assente: "Assente",
        annullato: "Annullata",
      } as Record<string, string>
    )[value] || value,
  tone: (value === "eseguito"
    ? "green"
    : value === "assente" || value === "annullato"
      ? "red"
      : value === "confermato"
        ? "accent"
        : "neutral") as "green" | "red" | "accent" | "neutral",
});
