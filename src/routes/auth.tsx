/*
 * Superficie ACCESSO: AuthLayout (card centrata), dall'ingresso alla prima pagina dell'app.
 * È qui che il boilerplate prende il posto della landing: CTA «Registrati» → /registrazione.
 */
import { Route } from "react-router-dom";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { ConfirmEmailRequestPage } from "@/pages/auth/ConfirmEmailRequestPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { ForbiddenPage, NotFoundPage, SessionExpiredPage } from "@/pages/errors/ErrorPages";

export const authRoutes = (
  <>
    <Route path="/accedi" element={<LoginPage />} />
    <Route path="/registrazione" element={<RegisterPage />} />
    <Route path="/verifica-email/:token" element={<VerifyEmailPage />} />
    <Route path="/conferma-email" element={<ConfirmEmailRequestPage />} />
    <Route path="/password-dimenticata" element={<ForgotPasswordPage />} />
    <Route path="/nuova-password/:token" element={<ResetPasswordPage />} />
    <Route path="/accesso-negato" element={<ForbiddenPage />} />
    <Route path="/sessione-scaduta" element={<SessionExpiredPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </>
);
