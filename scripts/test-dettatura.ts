// Prova di mergeWithoutRepeat sui casi tipici della dettatura su Android. Esegui: npx tsx scripts/test-dettatura.ts
import { mergeWithoutRepeat as m } from "../src/lib/speech/dictation";

const cases: [string, string, string][] = [
  ["", "ciao", "ciao"],
  ["ciao", "ciao come stai", "ciao come stai"],
  ["ciao come", "come stai", "ciao come stai"],
  ["Ciao come stai", "come stai oggi", "Ciao come stai oggi"],
  ["prima frase.", "seconda frase", "prima frase. seconda frase"],
  ["ciao ciao", "ciao amico", "ciao ciao amico"],
];
let failed = 0;
for (const [a, b, want] of cases) {
  const got = m(a, b);
  if (got !== want) { failed++; console.log(`NO  m("${a}", "${b}") = "${got}", atteso "${want}"`); }
  else console.log(`ok  "${a}" + "${b}" → "${got}"`);
}
process.exit(failed ? 1 : 0);
