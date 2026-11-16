// Selettore locale: FileUpload del template invia al vecchio servizio mock, qui l'upload usa l'API clinica.
import { useId } from "react";
import { fieldLabel, fieldMessage } from "@/components/form/fieldStyles";
import type { Data } from "./api";
export function ClinicFileField({
  onChange,
  accept = ".pdf,.png,.jpg,.jpeg,.csv,.xml,.xlsx",
}: {
  onChange: (data: Data) => void;
  accept?: string;
}) {
  const id = useId();
  return (
    <div className="pb-4">
      <label className={fieldLabel} htmlFor={id}>
        Allegato
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        className="mt-2 block w-full rounded-control border border-line-strong bg-field p-3 text-sm text-ink"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 15 * 1024 * 1024) {
            e.target.setCustomValidity("Massimo 15 MB.");
            e.target.reportValidity();
            return;
          }
          e.target.setCustomValidity("");
          const reader = new FileReader();
          reader.onload = () =>
            onChange({
              nome_file: f.name,
              mime:
                f.type ||
                (/\.xml$/i.test(f.name) ? "application/xml" : "text/csv"),
              base64: String(reader.result).split(",")[1],
            });
          reader.readAsDataURL(f);
        }}
      />
      <p className={fieldMessage}>
        PDF, immagini o documenti di importazione. Massimo 15 MB.
      </p>
    </div>
  );
}
