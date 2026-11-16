/*
 * Barra sopra una tabella: ricerca nell'elenco, filtri aggiuntivi, comandi (export, nuovo).
 * Una lista ha un solo proprietario dei filtri: se la tabella ha già i filtri di stato
 * (FilterTable), qui vanno solo ricerca e filtri di altro tipo (categoria, periodo).
 * La ricerca filtra le righe prima di passarle alla tabella; con molti dati la fa il backend.
 */
import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

type Props = { query: string; onQuery: (q: string) => void; placeholder: string; filters?: ReactNode; actions?: ReactNode };

export function TableToolbar({ query, onQuery, placeholder, filters, actions }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex h-9 min-w-0 flex-1 basis-56 items-center gap-2 rounded-control bg-field px-3 shadow-hairline focus-within:shadow-[0_0_0_1.5px_var(--accent)] sm:max-w-80">
        <Search size={15} className="shrink-0 text-ink-3" aria-hidden />
        <input type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden" />
        {query && <button type="button" onClick={() => onQuery("")} aria-label="Svuota la ricerca" className="flex size-6 items-center justify-center rounded-full text-ink-3 hover:bg-hover hover:text-ink"><X size={14} /></button>}
      </label>
      {filters}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Ricerca semplice su più campi di testo, senza accenti e maiuscole. */
export const matches = (q: string, ...fields: (string | undefined)[]) => {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const n = norm(q.trim());
  return !n || fields.some((f) => f && norm(f).includes(n));
};
