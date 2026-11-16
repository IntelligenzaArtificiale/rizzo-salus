/* Testi italiani per Selection Actions e una riscrittura d'esempio (in produzione la fa il backend AI). */
import { ChatBubbleQuestion, EmojiSatisfied, Scissor, Spark, TextBox } from "iconoir-react";
import type { SelectionActionSet } from "@/components/primitives/SelectionActions";

const icon = { width: 14, height: 14, strokeWidth: 1.8, "aria-hidden": true } as const;

export const SELECTION_ACTIONS_IT: SelectionActionSet = {
  primary: [
    { id: "Spiega", icon: <ChatBubbleQuestion {...icon} /> },
    { id: "Migliora", icon: <Spark {...icon} />, action: "Migliora", busyLabel: "Miglioramento in corso" },
  ],
  more: [
    { id: "Accorcia", icon: <Scissor {...icon} />, action: "Accorcia", busyLabel: "Accorciamento in corso" },
    { id: "Tono", icon: <EmojiSatisfied {...icon} />, action: "Cambia tono", busyLabel: "Cambio di tono in corso" },
    { id: "Grammatica", icon: <TextBox {...icon} />, action: "Correggi" },
  ],
};

export const SELECTION_LABELS_IT = { keep: "Tieni", discard: "Scarta", placeholder: "Descrivi la modifica" };

export const improveText = (text: string) =>
  text.replace(/^Servono/, "Il cliente richiede").replace(/\. Il cliente chiede anche/, ", insieme a").replace(/Richiesto/, "Si richiede");
