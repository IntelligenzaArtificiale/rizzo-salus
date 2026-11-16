/*
 * Marchio dalle impostazioni (white label). Specifiche dei file in docs/marchio.md.
 * BrandLogo: il SIMBOLO quadrato (sidebar, spazi stretti). Senza simbolo: iniziale su fondo inchiostro.
 *   Mai un logotipo orizzontale schiacciato nel quadrato, mai un riquadro bianco dietro.
 * BrandMark: con `wordmark` usa il LOGOTIPO orizzontale (header del sito e dell'accesso);
 *   senza logotipo compone simbolo + nome. Il nome non si ripete se il logotipo lo contiene già.
 * Le varianti scure si alternano con il tema via CSS, senza JavaScript.
 */
import { usePlatform } from "@/lib/platform/PlatformContext";

function Themed({ light, dark, className, alt }: { light: string; dark: string; className: string; alt: string }) {
  if (!dark || dark === light) return <img src={light} alt={alt} className={className} />;
  return (
    <>
      <img src={light} alt={alt} className={`${className} dark:hidden`} />
      <img src={dark} alt={alt} className={`${className} hidden dark:block`} />
    </>
  );
}

const SIZE: Record<number, string> = { 16: "size-4", 20: "size-5", 24: "size-6", 28: "size-7", 32: "size-8", 40: "size-10" };

export function BrandLogo({ size = 28 }: { size?: 16 | 20 | 24 | 28 | 32 | 40 }) {
  const { brand } = usePlatform().settings;
  const box = SIZE[size];
  if (brand.simbolo) return <Themed light={brand.simbolo} dark={brand.simboloScuro} alt="" className={`${box} shrink-0 object-contain`} />;
  return (
    <span aria-hidden className={`${box} brand-monogram flex shrink-0 items-center justify-center rounded-[28%] bg-ink font-semibold text-canvas`} data-size={size}>
      {brand.nome.charAt(0).toUpperCase()}
    </span>
  );
}

export function BrandMark({ wordmark = false }: { wordmark?: boolean }) {
  const { brand } = usePlatform().settings;
  if (wordmark && brand.logotipo) return <Themed light={brand.logotipo} dark={brand.logotipoScuro} alt={brand.nome} className="h-7 w-auto max-w-[180px] object-contain" />;
  return (
    <span className="flex items-center gap-2">
      <BrandLogo />
      <span className="text-[14.5px] font-semibold tracking-[-0.01em] text-ink">{brand.nome}</span>
    </span>
  );
}
