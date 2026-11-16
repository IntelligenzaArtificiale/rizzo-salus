/*
 * Link dell'header del SITO pubblico. La landing del progetto non è qui:
 * si progetta a parte (docs/superfici.md) e porta a /registrazione o /accedi.
 */
import type { FeatureKey } from "@/lib/platform/defaults";

export type SiteLink = { to: string; label: string; feature?: FeatureKey };

export const SITE_LINKS: SiteLink[] = [
  { to: "/blog", label: "Blog", feature: "blog" },
];
