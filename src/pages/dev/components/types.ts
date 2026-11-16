/* Scheda di un componente nella guida «Componenti e mapping». Ogni campo corrisponde a una domanda del redesign. */
import type { ReactNode } from "react";

export type Origin = "Beautiful UI" | "Beautiful UI + parametri" | "Wrapper del boilerplate" | "Composizione del boilerplate";

export type DomainDemo = { label: string; render: () => ReactNode };

export type ComponentDoc = {
  id: string;
  name: string;
  importPath: string;
  origin: Origin;
  purpose: string;
  /** esempi dal vivo in domini diversi (il primo è quello iniziale) */
  demos: DomainDemo[];
  variants?: string[];
  states?: string[];
  props: [name: string, type: string, note: string][];
  use: string[];
  avoid: string[];
  /** collegamento a dati e azioni, come codice */
  wiring: string;
  responsive: string;
  a11y: string;
  customize: string[];
  mistakes: { wrong: string; right: string }[];
};

export type GuideSection = { id: string; title: string; intro: string; docs: ComponentDoc[] };
