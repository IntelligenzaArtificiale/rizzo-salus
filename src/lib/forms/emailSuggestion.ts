/*
 * Suggerisce la correzione dei domini email scritti male più comuni
 * ("gmial.com" → "gmail.com"). Restituisce l'email corretta o null.
 */
const DOMAINS = ["gmail.com", "libero.it", "hotmail.it", "hotmail.com", "outlook.it", "outlook.com", "yahoo.it", "yahoo.com", "icloud.com", "virgilio.it", "tiscali.it", "alice.it", "fastwebnet.it", "pec.it"];

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = temp;
    }
  }
  return row[b.length];
}

export function suggestEmail(email: string): string | null {
  const [user, domain] = email.trim().toLowerCase().split("@");
  if (!user || !domain || DOMAINS.includes(domain)) return null;
  const best = DOMAINS.map((d) => ({ d, n: distance(domain, d) })).sort((x, y) => x.n - y.n)[0];
  return best.n > 0 && best.n <= 2 ? `${user}@${best.d}` : null;
}
