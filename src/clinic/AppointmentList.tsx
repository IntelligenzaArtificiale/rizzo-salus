// Elenco operativo riusando RowList e ActionMenu. Le azioni chiamano il backend originale.
import { useNavigate } from "react-router-dom";
import { Check, UserRoundX, ArrowUpRight } from "lucide-react";
import { RowList } from "@/components/app/RowList";
import { ActionMenu } from "@/components/app/ActionMenu";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { useAction, date } from "./common";
import { appointmentNames, appointmentStatus } from "./schedule";
export function AppointmentList({
  items,
  onChanged,
  patientContext = false,
  showDate = false,
  patientId,
}: {
  items: Data[];
  onChanged?: () => void;
  patientContext?: boolean;
  showDate?: boolean;
  patientId?: string;
}) {
  const { catalog, can, user } = useClinic(),
    navigate = useNavigate(),
    action = useAction();
  const rows = [...items]
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((a) => {
      const pro = catalog.professionisti.find(
        (p: Data) => p.id === a.professional_id,
      );
      const therapy =
        catalog.terapie.find((t: Data) => t.id === a.therapy_type_id)?.nome ||
        "Appuntamento";
      const to = `/agenda/${a.id}?giorno=${a.start.slice(0, 10)}`;
      const set = (stato: string) =>
        action.act(
          async () => {
            await api("/agenda/stato", {
              id: a.id,
              stato,
              ...(patientContext && patientId && a.tipo === "gruppo"
                ? { patient_id: patientId }
                : {}),
            });
            onChanged?.();
          },
          stato === "eseguito"
            ? "Seduta segnata come eseguita"
            : "Assenza registrata",
        );
      const editable =
        (can("agenda.modifica") ||
          (can("agenda.segna_eseguita") &&
            a.professional_id === user?.professional_id)) &&
        a.stato !== "annullato";
      return {
        key: a.id,
        to,
        title: patientContext ? therapy : appointmentNames(a),
        meta: [
          showDate ? date(a.start.slice(0, 10)) : null,
          `${a.start.slice(11, 16)}–${a.end.slice(11, 16)}`,
          patientContext
            ? [pro?.nome, pro?.cognome].filter(Boolean).join(" ")
            : therapy,
        ]
          .filter(Boolean)
          .join(" · "),
        status: appointmentStatus(
          patientContext && patientId && a.tipo === "gruppo"
            ? a.participants?.find((p: Data) => p.patient_id === patientId)
                ?.stato || a.stato
            : a.stato,
        ),
        actions: (
          <ActionMenu
            visible
            label={`Azioni ${appointmentNames(a)} ${a.start.slice(11, 16)}`}
            actions={[
              {
                label: "Apri dettaglio",
                icon: <ArrowUpRight size={15} />,
                onSelect: () => navigate(to),
              },
              ...(editable
                ? [
                    {
                      label: "Segna eseguita",
                      icon: <Check size={15} />,
                      onSelect: () => set("eseguito"),
                    },
                    {
                      label: "Segna assente",
                      icon: <UserRoundX size={15} />,
                      onSelect: () => set("assente"),
                    },
                  ]
                : []),
            ]}
          />
        ),
      };
    });
  return <RowList rows={rows} wrap />;
}
