/* Ordine delle sezioni della guida «Componenti e mapping». */
import type { GuideSection } from "@/pages/dev/components/types";
import { pages } from "@/pages/dev/components/sections/pages";
import { cards } from "@/pages/dev/components/sections/cards";
import { tables } from "@/pages/dev/components/sections/tables";
import { lists } from "@/pages/dev/components/sections/lists";
import { feedback } from "@/pages/dev/components/sections/feedback";
import { forms } from "@/pages/dev/components/sections/forms";
import { assistant } from "@/pages/dev/components/sections/assistant";
import { states } from "@/pages/dev/components/sections/states";
import { charts } from "@/pages/dev/components/sections/charts";
import { settings } from "@/pages/dev/components/sections/settings";

export const SECTIONS: GuideSection[] = [pages, cards, tables, lists, charts, feedback, forms, settings, assistant, states];
