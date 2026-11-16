/*
 * Solo con i dati finti: sostituisce l'apertura della email per provare il percorso.
 * In produzione (backend collegato) non viene mai mostrato.
 */
import { Link } from "react-router-dom";
import { useMockApi } from "@/config/app";

export function PreviewLink({ to, children }: { to: string; children: string }) {
  if (!useMockApi) return null;
  return (
    <div className="rounded-control border border-dashed border-line-strong px-3.5 py-3 text-[13px] text-ink-2">
      <span className="text-ink-3">Anteprima · </span>
      <Link to={to} className="font-medium text-accent-ink hover:underline">{children}</Link>
    </div>
  );
}
