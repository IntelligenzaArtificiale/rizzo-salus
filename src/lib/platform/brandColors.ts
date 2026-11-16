/* Colore del marchio → token di Beautiful UI (--accent, --accent-ink, --accent-tint) e controllo del contrasto. */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** contrasto del testo bianco sul colore (WCAG): sotto 4.5 i bottoni si leggono male */
export const whiteContrast = (hex: string) => 1.05 / (luminance(hex) + 0.05);

export const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

export function applyBrandColor(hex: string) {
  if (!isHex(hex)) return;
  const id = "colore-marchio";
  const style = document.getElementById(id) ?? Object.assign(document.createElement("style"), { id });
  style.textContent = `:root{--accent:${hex};--accent-ink:color-mix(in oklch,${hex} 88%,black);--accent-tint:color-mix(in oklch,${hex} 10%,white)}
.dark{--accent:${hex};--accent-ink:color-mix(in oklch,${hex} 55%,white);--accent-tint:color-mix(in oklch,${hex} 22%,transparent)}`;
  document.head.appendChild(style);
}
