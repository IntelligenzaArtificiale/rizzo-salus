// Campi parametrici composti dai controlli del boilerplate.
import { TextField } from "@/components/form/TextField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { Checkbox } from "@/components/form/Checkbox";
import { SelectField } from "@/components/form/SelectField";
import { Button } from "@/components/atoms/Button";
import type { Data } from "./api";
import { labelFor, enums, samples } from "./parameter-labels";
export function ParameterFields({
  value,
  onChange,
  prefix = "",
  hidden = [],
}: {
  value: Data;
  onChange: (v: Data) => void;
  prefix?: string;
  hidden?: string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(value)
        .filter(([k]) => !hidden.includes(k))
        .map(([k, v]) => {
          const path = prefix ? prefix + "." + k : k,
            change = (next: any) => onChange({ ...value, [k]: next });
          if (v !== null && typeof v === "object" && !Array.isArray(v))
            return (
              <details
                key={k}
                className="rounded-card border border-line p-4"
                open={prefix === "" && Object.keys(value).length < 5}
              >
                <summary className="cursor-pointer text-[14px] font-medium text-ink">
                  {labelFor(k)}
                </summary>
                <div className="pt-4">
                  <ParameterFields value={v} onChange={change} prefix={path} />
                </div>
              </details>
            );
          if (Array.isArray(v))
            return (
              <fieldset key={k} className="rounded-card border border-line p-4">
                <legend className="px-1 text-[14px] font-medium text-ink">
                  {labelFor(k)}
                </legend>
                {v.map((entry: any, i: number) => (
                  <div key={i} className="mb-4 flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      {typeof entry === "object" ? (
                        <ParameterFields
                          value={
                            Array.isArray(entry)
                              ? { da: entry[0], a: entry[1] }
                              : entry
                          }
                          prefix={path}
                          onChange={(next) =>
                            change(
                              v.map((x, j) =>
                                j === i
                                  ? Array.isArray(entry)
                                    ? [next.da, next.a]
                                    : next
                                  : x,
                              ),
                            )
                          }
                        />
                      ) : (
                        <TextField
                          label={labelFor(k) + " " + (i + 1)}
                          value={String(entry)}
                          onChange={(next) =>
                            change(v.map((x, j) => (j === i ? next : x)))
                          }
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="quiet"
                      onClick={() => change(v.filter((_, j) => i !== j))}
                    >
                      Rimuovi
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    change([...v, structuredClone(v[0] ?? samples[k] ?? "")])
                  }
                >
                  Aggiungi
                </Button>
              </fieldset>
            );
          if (typeof v === "boolean")
            return (
              <Checkbox
                key={k}
                label={labelFor(k)}
                checked={v}
                onChange={change}
              />
            );
          let opts = enums[k];
          if (k === "ambiente")
            opts = path.includes("aruba")
              ? ["demo", "produzione"]
              : ["test", "produzione"];
          if (k === "modalita" && path.includes("variazioni"))
            opts = ["manuale"];
          if (k === "modalita" && path.startsWith("attesa")) opts = ["semi"];
          if (opts)
            return (
              <SelectField
                key={k}
                label={labelFor(k)}
                value={String(v ?? "")}
                onChange={change}
                options={opts.map((s) => ({
                  value: s,
                  label: s === "interno" ? "Solo coda interna" : labelFor(s),
                }))}
              />
            );
          if (
            [
              "testo",
              "informativa",
              "riferimento_normativo",
              "certificato_cifratura",
            ].includes(k)
          )
            return (
              <TextAreaField
                key={k}
                label={labelFor(k)}
                value={String(v ?? "")}
                onChange={change}
              />
            );
          const type =
            typeof v === "number"
              ? "number"
              : k.includes("email")
                ? "email"
                : ["date", "data", "da", "a", "ora"].includes(k)
                  ? k === "date" ||
                    k === "data" ||
                    path.includes("chiusure") ||
                    path.includes("eccezioni") ||
                    path.includes("fermi")
                    ? "date"
                    : "time"
                  : k === "colore"
                    ? "color"
                    : "text";
          return (
            <TextField
              key={k}
              label={labelFor(k)}
              type={type}
              step={type === "number" ? "any" : undefined}
              value={String(v ?? "")}
              onChange={(s) =>
                change(typeof v === "number" ? (s === "" ? "" : Number(s)) : s)
              }
            />
          );
        })}
    </div>
  );
}
export function HoursFields({
  value,
  onChange,
}: {
  value: Data | null;
  onChange: (v: Data) => void;
}) {
  const days = [
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
    "Domenica",
  ];
  return (
    <div className="flex flex-col gap-4">
      {days.map((name, i) => (
        <fieldset key={i} className="border-b border-line pb-4">
          <legend className="mb-2 text-[14px] font-medium text-ink">
            {name}
          </legend>
          {(value?.[i + 1] ?? []).map((s: string[], j: number) => (
            <div key={j} className="flex flex-wrap items-center gap-3">
              <TextField
                label="Dalle"
                type="time"
                value={s[0]}
                onChange={(t) =>
                  onChange({
                    ...value,
                    [i + 1]: value![i + 1].map((a: string[], n: number) =>
                      n === j ? [t, a[1]] : a,
                    ),
                  })
                }
              />
              <TextField
                label="Alle"
                type="time"
                value={s[1]}
                onChange={(t) =>
                  onChange({
                    ...value,
                    [i + 1]: value![i + 1].map((a: string[], n: number) =>
                      n === j ? [a[0], t] : a,
                    ),
                  })
                }
              />
              <Button
                type="button"
                variant="quiet"
                onClick={() =>
                  onChange({
                    ...value,
                    [i + 1]: value![i + 1].filter(
                      (_: any, n: number) => n !== j,
                    ),
                  })
                }
              >
                Rimuovi fascia
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              onChange({
                ...value,
                [i + 1]: [...(value?.[i + 1] ?? []), ["08:00", "13:00"]],
              })
            }
          >
            Aggiungi fascia
          </Button>
        </fieldset>
      ))}
    </div>
  );
}
