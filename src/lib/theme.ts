/*
 * Tema chiaro/scuro con la classe .dark di Beautiful UI su <html>.
 * Priorità: scelta salvata dal ThemeToggle ("bui-theme"), poi attributo data-theme
 * della radice, poi tema del sistema.
 */
function savedTheme(): string | null {
  try {
    return localStorage.getItem("bui-theme");
  } catch {
    return null;
  }
}

export function syncTheme() {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    /* modulo "temaScuro" spento: sempre chiaro */
    if (root.hasAttribute("data-no-dark")) return root.classList.remove("dark");
    const forced = savedTheme() ?? root.getAttribute("data-theme");
    root.classList.toggle("dark", forced ? forced === "dark" : media.matches);
  };
  apply();
  media.addEventListener("change", apply);
  new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ["data-theme", "data-no-dark"] });
}
