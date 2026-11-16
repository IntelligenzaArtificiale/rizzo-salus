/*
 * Superficie APP (area riservata): RequireAuth + AppLayout con SidebarNav.
 * Ogni pagina: sessione obbligatoria, permesso e modulo facoltativi.
 */
import type { ReactNode } from "react";
import { Route } from "react-router-dom";
import { RequireAuth } from "@/components/app/RequireAuth";
import { AppLayout } from "@/layouts/AppLayout";
import { AdminDashboardPage } from "@/pages/dashboard/AdminDashboardPage";
import { UserDashboardPage } from "@/pages/dashboard/UserDashboardPage";
import { RequestsPage } from "@/pages/requests/RequestsPage";
import { RequestDetailPage } from "@/pages/requests/RequestDetailPage";
import { RequestFormPage } from "@/pages/requests/RequestFormPage";
import { UsersPage } from "@/pages/users/UsersPage";
import { UserDetailPage } from "@/pages/users/UserDetailPage";
import { UserFormPage } from "@/pages/users/UserFormPage";
import { AuditPage } from "@/pages/admin/AuditPage";
import { AuditDetailPage } from "@/pages/admin/AuditDetailPage";
import { StatsPage } from "@/pages/admin/StatsPage";
import { SettingsPage } from "@/pages/admin/SettingsPage";
import { NotificationsPage } from "@/pages/notifications/NotificationsPage";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { AssistantPage } from "@/pages/assistant/AssistantPage";
import { BlogAdminPage } from "@/pages/blog/BlogAdminPage";
import { BlogEditorPage } from "@/pages/blog/BlogEditorPage";
import type { FeatureKey, Permission } from "@/lib/platform/defaults";

/** pagina dell'area riservata dentro AppLayout */
const area = (page: ReactNode, perm?: Permission, feature?: FeatureKey) => <RequireAuth perm={perm} feature={feature}><AppLayout>{page}</AppLayout></RequireAuth>;
/** pagina che porta la propria AppLayout (assistente: cronologia nella sidebar) */
const own = (page: ReactNode, perm?: Permission, feature?: FeatureKey) => <RequireAuth perm={perm} feature={feature}>{page}</RequireAuth>;

export const appRoutes = (
  <>
    <Route path="/admin" element={area(<AdminDashboardPage />, "dashboard.admin")} />
    <Route path="/admin/utenti" element={area(<UsersPage />, "utenti.gestisci")} />
    <Route path="/admin/utenti/nuovo" element={area(<UserFormPage />, "utenti.gestisci")} />
    <Route path="/admin/utenti/:id" element={area(<UserDetailPage />, "utenti.gestisci")} />
    <Route path="/admin/utenti/:id/modifica" element={area(<UserFormPage />, "utenti.gestisci")} />
    <Route path="/admin/registro" element={area(<AuditPage />, "registro.vedi")} />
    <Route path="/admin/registro/:id" element={area(<AuditDetailPage />, "registro.vedi")} />
    <Route path="/admin/statistiche" element={area(<StatsPage />, "statistiche.vedi")} />
    <Route path="/admin/impostazioni" element={area(<SettingsPage />, "impostazioni.gestisci")} />
    <Route path="/admin/blog" element={area(<BlogAdminPage />, "blog.gestisci", "blog")} />
    <Route path="/admin/blog/nuovo" element={area(<BlogEditorPage />, "blog.gestisci", "blog")} />
    <Route path="/admin/blog/:id" element={area(<BlogEditorPage />, "blog.gestisci", "blog")} />

    <Route path="/area" element={area(<UserDashboardPage />)} />
    <Route path="/richieste" element={area(<RequestsPage />)} />
    <Route path="/richieste/nuova" element={area(<RequestFormPage />, "richieste.crea")} />
    <Route path="/richieste/:id" element={area(<RequestDetailPage />)} />
    <Route path="/richieste/:id/modifica" element={area(<RequestFormPage />, "richieste.modifica")} />
    <Route path="/notifiche" element={area(<NotificationsPage />, undefined, "notifiche")} />
    <Route path="/profilo" element={area(<ProfilePage />)} />
    <Route path="/assistente" element={own(<AssistantPage />, "assistente.usa", "assistente")} />
    <Route path="/assistente/:id" element={own(<AssistantPage />, "assistente.usa", "assistente")} />
  </>
);
