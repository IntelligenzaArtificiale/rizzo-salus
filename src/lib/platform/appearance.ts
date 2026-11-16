/*
 * Applica l'aspetto scelto dall'amministratore come attributi su un elemento (la radice, oppure
 * il riquadro di anteprima). Gli stili sono in src/styles/aspetto.css.
 * Tema: diventa il tema iniziale (data-theme); la scelta personale del ThemeToggle prevale.
 * Movimento: «ridotto» spegne le animazioni per tutti; «dispositivo» segue prefers-reduced-motion.
 */
import type { Appearance } from "@/lib/platform/defaults";

export function applyAppearance(el: HTMLElement, a: Appearance) {
  el.dataset.angoli = a.angoli;
  el.dataset.densita = a.densita;
  el.dataset.movimento = a.movimento;
  el.dataset.carattere = a.carattere;
  if (el === document.documentElement) {
    if (a.tema === "sistema") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", a.tema === "scuro" ? "dark" : "light");
  }
}
