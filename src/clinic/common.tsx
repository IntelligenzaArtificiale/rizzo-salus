// Composizioni dei wrapper originali: stato asincrono, impaginazione e date locali.
import {
  useEffect,
  useState,
  type ReactNode,
  type DependencyList,
} from "react";
import { Page } from "@/layouts/AppLayout";
import { PageLoading, PageError } from "@/components/app/PageState";
import { StatusPill } from "@/components/atoms/StatusPill";
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const addDays = (s: string, n: number) => {
  const d = new Date(s + "T12:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const monday = (s: string) =>
  addDays(s, -((new Date(s + "T12:00:00").getDay() + 6) % 7));
export const date = (s?: string) =>
  s
    ? new Date(s.length === 10 ? s + "T12:00:00" : s).toLocaleDateString(
        "it-IT",
        { day: "numeric", month: "short", year: "numeric" },
      )
    : "—";
export const money = (c: number = 0) =>
  (c / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
export const name = (p: Record<string, any>) =>
  [p.cognome, p.nome].filter(Boolean).join(" ");
export function useLoad<T>(
  loader: () => Promise<T>,
  deps: DependencyList = [],
) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loader()
      .then((v) => {
        if (active) setData(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [...deps, version]);
  return { data, error, loading, reload: () => setVersion((v) => v + 1) };
}
export function LoadState({
  load,
  children,
  wide = false,
}: {
  load: { loading: boolean; error: string; reload: () => void };
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Page wide={wide}>
      {load.loading ? (
        <PageLoading />
      ) : load.error ? (
        <PageError message={load.error} onRetry={load.reload} />
      ) : (
        children
      )}
    </Page>
  );
}
export { useAction } from "./actions";
const labels: Record<string, string> = {
  programmato: "Programmata",
  confermato: "Confermata",
  eseguito: "Eseguita",
  assente: "Assente",
  annullato: "Annullata",
  bozza: "Bozza",
  emessa: "Emessa",
  pagata: "Pagata",
  annullata: "Stornata",
  in_coda: "In coda",
  inviato: "Inviato",
  errore: "Da riprovare",
  da_inviare: "Da approvare",
  da_comunicare: "Da chiamare",
  attivo: "Attivo",
  aperto: "Aperto",
  chiuso: "Chiuso",
  sospeso: "Sospeso",
  approvata: "Approvata",
  scartata: "Scartata",
  proposta: "Da approvare",
};
export const statusLabel = (s: string) =>
  labels[s] || s?.replaceAll("_", " ") || "—";
export function StatePill({ value }: { value: string }) {
  return (
    <StatusPill
      tone={
        ["eseguito", "pagata", "inviato", "attivo", "approvata"].includes(value)
          ? "green"
          : ["errore", "annullato", "annullata", "assente"].includes(value)
            ? "red"
            : ["bozza", "in_coda", "da_inviare", "proposta"].includes(value)
              ? "orange"
              : "neutral"
      }
    >
      {statusLabel(value)}
    </StatusPill>
  );
}
