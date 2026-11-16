/*
 * Superficie SITO (pubblica): SiteLayout, nessuna sessione richiesta, nessuna sidebar.
 * Aggiungere qui pagine pubbliche del progetto (cataloghi consultabili, note legali, blog).
 */
import { Route } from "react-router-dom";
import { RequireFeature } from "@/components/app/RequireAuth";
import { BlogListPage, BlogPostPage } from "@/pages/blog/BlogPublicPages";
import { LegalPage } from "@/pages/site/LegalPage";

export const siteRoutes = (
  <>
    <Route path="/privacy" element={<LegalPage />} />
    <Route path="/blog" element={<RequireFeature name="blog"><BlogListPage /></RequireFeature>} />
    <Route path="/blog/:slug" element={<RequireFeature name="blog"><BlogPostPage /></RequireFeature>} />
  </>
);
