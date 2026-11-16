/* Pagine di anteprima: esistono solo con le API simulate e non vanno in produzione. */
import { Route } from "react-router-dom";
import { PreviewIndexPage } from "@/pages/dev/PreviewIndexPage";
import { ComponentsPage } from "@/pages/dev/components/ComponentsPage";
import { EmailPreviewPage } from "@/pages/dev/email/EmailPreviewPage";

export const devRoutes = (
  <>
    <Route path="/anteprima" element={<PreviewIndexPage />} />
    <Route path="/anteprima/componenti" element={<ComponentsPage />} />
    <Route path="/anteprima/componenti/:sezione" element={<ComponentsPage />} />
    <Route path="/anteprima/email" element={<EmailPreviewPage />} />
  </>
);
