import type { Data } from "./api";
export const groups = [
  ["TS", "Strumentali con operatore"],
  ["TSF", "Strumentali fisse"],
  ["manuali", "Manuale e linfodrenaggio"],
  ["palestra", "Palestra"],
  ["piscina", "Piscina"],
  ["visite", "Visite Antonio"],
];
export function category(a: Data, catalog: Data) {
  const t = catalog.terapie.find((v: Data) => v.id === a.therapy_type_id);
  if (a.tipo === "visita") return "visite";
  if (t?.categoria === "manuale") return "manuali";
  if (t?.categoria === "palestra_gruppo") return "palestra";
  if (t?.categoria === "piscina_gruppo") return "piscina";
  return t?.famiglia === "TSF" || a.impegna_operatore === false ? "TSF" : "TS";
}
export function channels(items: Data[], catalog: Data, group: string) {
  if (group === "giorno") return [{ id: "giorno", label: "Appuntamenti", short: "Agenda" }];
  if (group === "professionista")
    return catalog.professionisti
      .filter(
        (p: Data) => p.attivo && items.some((a) => a.professional_id === p.id),
      )
      .map((p: Data) => ({
        id: p.id,
        label: (p.nome + " " + p.cognome).trim(),
        short: p.nome,
      }));
  if (group === "prestazione")
    return catalog.terapie
      .filter(
        (t: Data) => t.attivo && items.some((a) => a.therapy_type_id === t.id),
      )
      .map((t: Data) => ({ id: t.id, label: t.nome, short: t.nome }));
  return groups
    .map(([id, label]) => ({
      id,
      label,
      short:
        id === "palestra"
          ? "RM"
          : id === "piscina"
            ? "IKT"
            : id === "manuali"
              ? "MAN"
              : id === "visite"
                ? "AR"
                : id,
    }));
}
export function channelOf(a: Data, catalog: Data, group: string) {
  if (group === "giorno") return "giorno";
  if (a.tipo === "nota") return "nota";
  return group === "professionista"
    ? a.professional_id
    : group === "prestazione"
      ? a.therapy_type_id
      : category(a, catalog);
}
export function eventColor(a: Data, catalog: Data, colors: Data) {
  const c = category(a, catalog);
  const key = (
    {
      TS: "strumentale",
      TSF: "strumentale_fissa",
      manuali: "manuale",
      palestra: "palestra_gruppo",
      piscina: "piscina_gruppo",
      visite: "visita",
    } as Data
  )[c];
  if (a.tipo !== "gruppo") {
    if (a.segnali?.some((s: Data) => s.ultima))
      return colors.ultima || "#B91C1C";
    if (a.segnali?.some((s: Data) => s.prima)) return colors.prima || "#15803D";
  }
  return (
    colors[key] ||
    (
      {
        TS: "#2F7F9E",
        TSF: "#A16207",
        manuali: "#6B5BB5",
        palestra: "#0369A1",
        piscina: "#0891B2",
        visite: "#7C3AED",
      } as Data
    )[c]
  );
}
export function overlaps(events: Data[]) {
  const out: { a: Data; lane: number; of: number }[] = [];
  const ends: string[] = [];
  [...events]
    .sort((a, b) => a.start.localeCompare(b.start))
    .forEach((a) => {
      let lane = ends.findIndex((e) => e <= a.start);
      if (lane < 0) {
        lane = ends.length;
        ends.push(a.end);
      } else ends[lane] = a.end;
      out.push({ a, lane, of: 1 });
    });
  out.forEach((o) => {
    o.of = Math.max(
      1,
      ...out
        .filter((q) => q.a.start < o.a.end && o.a.start < q.a.end)
        .map((q) => q.lane + 1),
    );
  });
  return out;
}
