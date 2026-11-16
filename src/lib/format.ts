/* Formati per l'interfaccia: date in italiano, leggibili da una persona. */
const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

/** "2026-11-02" → "2 nov 2026"; con short omette l'anno corrente */
export function formatDate(iso: string, short = false): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const year = short && y === new Date().getFullYear() ? "" : ` ${y}`;
  return `${d} ${MONTHS[m - 1]}${year}`;
}

/** "2026-11-02 09:14" → "2 nov 2026, 09:14" */
export function formatDateTime(value: string): string {
  const [date, time] = value.split(" ");
  return time ? `${formatDate(date)}, ${time}` : formatDate(date);
}
