import { TrainingPage } from "@/clinic/TrainingPage";
// Frontend del gestionale con le tre superfici del boilerplate e API PHP reali.
import {
  createHashRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { PlatformProvider } from "@/lib/platform/PlatformContext";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { SiteLayout } from "@/layouts/SiteLayout";
import { AppLayout, Page } from "@/layouts/AppLayout";
import { PageLoading, EmptyState } from "@/components/app/PageState";
import { landingFor } from "@/clinic/access";
import { ClinicProvider, useClinic } from "@/clinic/ClinicContext";
import { LoginPage, ForgotPage, ResetPage } from "@/clinic/AuthPages";
import {
  AgendaPage,
  AppointmentPage,
  CopyWeekPage,
} from "@/clinic/AgendaPages";
import { PatientsPage, PatientPage, PlanningPage } from "@/clinic/PatientPages";
import { PatientFormPage } from "@/clinic/PatientForm";
import {
  CommunicationsPage,
  MessagePage,
  VariationPage,
} from "@/clinic/CommunicationsPages";
import { OverviewPage } from "@/clinic/OverviewPage";
import { StatsPage } from "@/clinic/StatsPage";
import { BillingPage, InvoicePage } from "@/clinic/BillingPages";
import { NewInvoicePage, CreditNotePage } from "@/clinic/InvoiceForms";
import { ReviewExportsPage } from "@/clinic/ReviewExportsPage";
import { MoveSuggestionsPage } from "@/clinic/MoveSuggestions";
import { AppointmentFormPage } from "@/clinic/AppointmentForm";
import { CareCommunicationsPage } from "@/clinic/CareCommunicationsPage";
import { PublicVisitConfirmation } from "@/clinic/PublicVisitConfirmation";
import { ImportPage } from "@/clinic/ImportPage";
import { CompensationsPage } from "@/clinic/CompensationsPage";
import { StockPage } from "@/clinic/StockPage";
import { StaffPage } from "@/clinic/StaffPage";
import { ExpensesPage } from "@/clinic/ExpensesPage";
import { PublicBooking } from "@/clinic/PublicBooking";
import { PublicPortal } from "@/clinic/PublicPortal";
import { BookingManagement } from "@/clinic/BookingManagement";
import { EpisodeFormPage } from "@/clinic/EpisodeForm";
import { PublicSignature } from "@/clinic/PublicSignature";
import { SettingsPage } from "@/clinic/SettingsPage";
import { ProfilePage } from "@/clinic/ProfilePage";
import { AssistantPage } from "@/clinic/AssistantPage";
import {
  MapPage,
  ModulePage,
  DecisionsPage,
  PublicWeekPage,
} from "@/clinic/MaterialsPages";
function Protected() {
  const { user, loading } = useClinic();
  const { pathname } = useLocation();
  if (loading) return <PageLoading />;
  if (!user) return <Navigate to="/accedi" replace />;
  if (user.attiva_due_fattori && pathname !== "/profilo")
    return <Navigate to="/profilo?scheda=Sicurezza" replace />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
function Permission({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { can } = useClinic();
  return can(permission) ? (
    children
  ) : (
    <Page>
      <EmptyState
        title="Non hai accesso a questa pagina"
        description="Il tuo ruolo non permette questa operazione."
      />
    </Page>
  );
}
function Home() {
  const { user, loading, can } = useClinic();
  if (loading) return <PageLoading />;
  return (
    <Navigate
      to={
        location.pathname.startsWith("/s/")
          ? "/settimana/" + location.pathname.split("/").pop()
          : user
            ? landingFor(can)
            : "/accedi"
      }
      replace
    />
  );
}
const router = createHashRouter(
  createRoutesFromElements(
    <>
      <Route
        path="/privacy"
        element={
          <SiteLayout>
            <EmptyState
              title="Privacy e termini"
              description="Le informative della struttura non sono incluse in questa copia locale. Per informazioni sul trattamento dei dati contatta il Poliambulatorio Rizzo."
            />
          </SiteLayout>
        }
      />
      <Route path="/" element={<Home />} />
      <Route path="/accedi" element={<LoginPage />} />
      <Route path="/password-dimenticata" element={<ForgotPage />} />
      <Route path="/nuova-password/:token" element={<ResetPage />} />
      <Route
        path="/conferma-visita/:token"
        element={<PublicVisitConfirmation />}
      />
      <Route path="/prenota" element={<PublicBooking />} />
      <Route path="/portale" element={<PublicPortal />} />
      <Route path="/firma/:token" element={<PublicSignature />} />
      <Route path="/settimana/:token" element={<PublicWeekPage />} />
      <Route element={<Protected />}>
        <Route path="/formazione" element={<TrainingPage />} />
        <Route path="/pacchetti" element={<ReviewExportsPage />} />
        <Route
          path="/relazioni"
          element={
            <Permission permission="messaggi.invia">
              <CareCommunicationsPage />
            </Permission>
          }
        />
        <Route
          path="/importazione"
          element={
            <Permission permission="impostazioni.gestisci">
              <ImportPage />
            </Permission>
          }
        />
        <Route path="/compensi" element={<CompensationsPage />} />
        <Route path="/magazzino" element={<StockPage />} />
        <Route path="/personale" element={<StaffPage />} />
        <Route
          path="/spese"
          element={
            <Permission permission="statistiche.economiche">
              <ExpensesPage />
            </Permission>
          }
        />
        <Route path="/prenotazioni" element={<BookingManagement />} />
        <Route path="/panoramica" element={<OverviewPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route
          path="/agenda/copia"
          element={
            <Permission permission="agenda.modifica">
              <CopyWeekPage />
            </Permission>
          }
        />
        <Route
          path="/agenda/nuovo"
          element={
            <Permission permission="agenda.modifica">
              <AppointmentFormPage />
            </Permission>
          }
        />
        <Route
          path="/agenda/:id/modifica"
          element={
            <Permission permission="agenda.modifica">
              <AppointmentFormPage />
            </Permission>
          }
        />
        <Route
          path="/agenda/:id/proposte-spostamento"
          element={
            <Permission permission="agenda.modifica">
              <MoveSuggestionsPage />
            </Permission>
          }
        />
        <Route path="/agenda/:id" element={<AppointmentPage />} />
        <Route path="/pazienti" element={<PatientsPage />} />
        <Route
          path="/pazienti/nuovo"
          element={
            <Permission permission="pazienti.anagrafica">
              <PatientFormPage />
            </Permission>
          }
        />
        <Route
          path="/pazienti/:id/modifica"
          element={
            <Permission permission="pazienti.anagrafica">
              <PatientFormPage />
            </Permission>
          }
        />
        <Route
          path="/percorsi/:id"
          element={
            <Permission permission="pazienti.anagrafica">
              <EpisodeFormPage />
            </Permission>
          }
        />
        <Route path="/pazienti/:id" element={<PatientPage />} />
        <Route
          path="/pianificazione/:id"
          element={
            <Permission permission="ai.pianificazione">
              <PlanningPage />
            </Permission>
          }
        />
        <Route
          path="/comunicazioni"
          element={
            <Permission permission="messaggi.invia">
              <CommunicationsPage />
            </Permission>
          }
        />
        <Route
          path="/comunicazioni/variazione/:id"
          element={
            <Permission permission="messaggi.invia">
              <VariationPage />
            </Permission>
          }
        />
        <Route
          path="/comunicazioni/:id"
          element={
            <Permission permission="messaggi.invia">
              <MessagePage />
            </Permission>
          }
        />
        <Route
          path="/statistiche"
          element={
            <Permission permission="agenda.vedi_tutto">
              <StatsPage />
            </Permission>
          }
        />
        <Route
          path="/fatture"
          element={
            <Permission permission="fatture.gestisci">
              <BillingPage />
            </Permission>
          }
        />
        <Route
          path="/fatture/nuova"
          element={
            <Permission permission="fatture.gestisci">
              <NewInvoicePage />
            </Permission>
          }
        />
        <Route
          path="/fatture/:id/storno"
          element={
            <Permission permission="fatture.gestisci">
              <CreditNotePage />
            </Permission>
          }
        />
        <Route
          path="/fatture/:id"
          element={
            <Permission permission="fatture.gestisci">
              <InvoicePage />
            </Permission>
          }
        />
        <Route
          path="/impostazioni"
          element={
            <Permission permission="impostazioni.gestisci">
              <SettingsPage />
            </Permission>
          }
        />
        <Route path="/profilo" element={<ProfilePage />} />
        <Route
          path="/assistente"
          element={
            <Permission permission="ai.assistente">
              <AssistantPage />
            </Permission>
          }
        />
        <Route path="/mappa" element={<MapPage />} />
        <Route path="/mappa/:id" element={<ModulePage />} />
        <Route path="/decisioni" element={<DecisionsPage />} />
        <Route
          path="*"
          element={
            <Page>
              <EmptyState
                title="Pagina non trovata"
                description="Scegli una pagina dal menu per continuare."
              />
            </Page>
          }
        />
      </Route>
    </>,
  ),
);
export default function App() {
  return (
    <PlatformProvider>
      <ToastProvider>
        <ClinicProvider>
          <RouterProvider router={router} />
        </ClinicProvider>
      </ToastProvider>
    </PlatformProvider>
  );
}
