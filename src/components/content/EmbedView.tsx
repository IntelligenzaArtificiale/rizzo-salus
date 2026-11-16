/* Mostra una risorsa incorporata (lib/embed): iframe isolato, caricamento differito, proporzioni corrette. */
import type { Embed } from "@/lib/embed";

export function EmbedView({ embed }: { embed: Embed }) {
  if (embed.kind === "immagine") return <img src={embed.src} alt="" loading="lazy" className="w-full rounded-card shadow-hairline" />;
  return (
    <div className="w-full overflow-hidden rounded-card bg-field shadow-hairline" style={{ aspectRatio: embed.ratio }}>
      <iframe
        src={embed.src}
        title={embed.title}
        loading="lazy"
        className="size-full border-0"
        allow="encrypted-media; picture-in-picture; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
