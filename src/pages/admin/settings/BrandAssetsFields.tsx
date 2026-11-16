/*
 * File del marchio: simbolo e logotipo, ciascuno con la variante per il tema scuro.
 * L'anteprima mostra il file sul fondo reale (chiaro e scuro) per accorgersi subito di
 * riquadri bianchi, contrasto basso o proporzioni sbagliate. Specifiche: docs/marchio.md.
 */
import { FileUpload } from "@/components/form/FileUpload";
import type { Brand } from "@/lib/platform/defaults";

type AssetKey = "simbolo" | "simboloScuro" | "logotipo" | "logotipoScuro";

const ASSETS: { key: AssetKey; label: string; hint: string; wide: boolean; dark: boolean }[] = [
  { key: "simbolo", label: "Simbolo", hint: "Quadrato, sfondo trasparente. SVG, oppure PNG almeno 512×512.", wide: false, dark: false },
  { key: "logotipo", label: "Logotipo", hint: "Orizzontale, sfondo trasparente. SVG, oppure PNG alto almeno 120 px.", wide: true, dark: false },
  { key: "simboloScuro", label: "Simbolo per il tema scuro", hint: "Facoltativo: versione chiara del simbolo.", wide: false, dark: true },
  { key: "logotipoScuro", label: "Logotipo per il tema scuro", hint: "Facoltativo: versione chiara del logotipo.", wide: true, dark: true },
];

export function BrandAssetsFields({ brand, onChange }: { brand: Brand; onChange: (key: AssetKey, value: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {ASSETS.map((a) => (
        <div key={a.key} className="flex items-start gap-4">
          <div className={`mt-7 flex h-12 shrink-0 items-center justify-center rounded-[10px] shadow-hairline ${a.wide ? "w-28" : "w-12"} ${a.dark ? "bg-[#17181b]" : "bg-page"}`}>
            {brand[a.key] ? <img src={brand[a.key]} alt={`${a.label} attuale`} className="max-h-8 max-w-[88%] object-contain" /> : <span className="text-[11px] text-ink-3">Vuoto</span>}
          </div>
          <div className="flex-1">
            <FileUpload label={a.label} accept="image/svg+xml,image/png,image/webp" maxMb={1} hint={a.hint} onChange={(f) => f[0]?.url && onChange(a.key, f[0].url)} />
            {brand[a.key] && <button type="button" onClick={() => onChange(a.key, "")} className="-mt-2 mb-3 text-[13px] font-medium text-ink-2 hover:text-ink">Rimuovi</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
