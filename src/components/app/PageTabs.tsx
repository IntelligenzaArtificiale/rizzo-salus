/**
 * Schede uniformi: gruppi brevi a tutta larghezza su mobile, selettore nativo quando le
 * etichette non ci stanno (più di 4 voci o testo lungo) e lo spazio è stretto.
 * Le schede occupano sempre tutta la larghezza del contenuto, con voci di pari larghezza.
 * label: nome di ciò che si sceglie («Email», «Impostazioni»), non un generico «Sezione».
 */
import { SegmentedControl } from "@/components/atoms/SegmentedControl";
import { SelectField } from "@/components/form/SelectField";

export function PageTabs<T extends string>({
  options,
  value,
  onChange,
  label = "Sezione",
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  if (options.length > 8)
    return (
      <div className="w-full max-w-md">
        <SelectField
          label={label}
          value={value}
          options={options.map((option) => ({ label: option, value: option }))}
          onChange={(next) => {
            const option = options.find((item) => item === next);
            if (option) onChange(option);
          }}
        />
      </div>
    );
  const many = options.length > 4 || options.join("").length > 36;
  return (
    <div className="page-tabs min-w-0 w-full">
      {many && (
        <div className="page-tabs-select">
          <SelectField
            label={label}
            value={value}
            options={options.map((option) => ({
              label: option,
              value: option,
            }))}
            onChange={(next) => {
              const option = options.find((item) => item === next);
              if (option) onChange(option);
            }}
          />
        </div>
      )}
      <div className={many ? "page-tabs-segments" : "w-full"}>
        <SegmentedControl
          options={options}
          value={value}
          onChange={onChange}
          className="w-full"
        />
      </div>
    </div>
  );
}
