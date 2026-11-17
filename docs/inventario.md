# Inventario del sorgente

Generato da `python3 scripts/catalogue.py`. Non sostituisce la lettura dei tipi e delle logiche.

## Componenti

| File | Livello | Esportazioni | Usato da |
|---|---|---|---|
| [app/ActionMenu.tsx](../src/components/app/ActionMenu.tsx) | app | MenuAction, ActionMenu | `src/clinic/AppointmentList.tsx`, `src/pages/assistant/useChatHistory.tsx`, `src/pages/dev/components/sections/cards.tsx`, `src/pages/dev/components/sections/assistant.tsx`, `src/pages/admin/settings/BackupTab.tsx`, `src/pages/admin/settings/AutomationsTab.tsx` |
| [app/CollapsiblePanel.tsx](../src/components/app/CollapsiblePanel.tsx) | app | CollapsiblePanel | `src/clinic/EpisodeDiary.tsx`, `src/clinic/CatalogSettings.tsx`, `src/clinic/ParameterFields.tsx`, `src/clinic/PatientForm.tsx` |
| [app/ConfirmDialog.tsx](../src/components/app/ConfirmDialog.tsx) | app | ConfirmDialog | `src/clinic/MoveSuggestions.tsx`, `src/clinic/AppointmentForm.tsx`, `src/clinic/InvoiceFiscalActions.tsx`, `src/clinic/AgendaPages.tsx`, `src/clinic/PatientForm.tsx`, `src/clinic/TrainingPage.tsx`, `src/lib/forms/useUnsavedChanges.tsx`, `src/pages/profile/ProfileSettings.tsx`, `src/pages/requests/RequestDetailPage.tsx`, `src/pages/assistant/useChatHistory.tsx`, `src/pages/blog/BlogEditorPage.tsx`, `src/pages/users/UserDetailPage.tsx`, `src/pages/dev/components/sections/feedback.tsx`, `src/pages/dev/components/sections/assistant.tsx`, `src/pages/admin/settings/BackupTab.tsx`, `src/pages/admin/settings/SecurityTab.tsx` |
| [app/EntityCard.tsx](../src/components/app/EntityCard.tsx) | app | EntityCardProps, EntityCard, CardGrid | `src/clinic/OverviewPage.tsx`, `src/clinic/MaterialsPages.tsx`, `src/pages/dev/components/sections/cards.tsx`, `src/pages/admin/settings/AppearanceTab.tsx` |
| [app/ExportExcelButton.tsx](../src/components/app/ExportExcelButton.tsx) | app | ExcelValue, ExportExcelButton | `src/components/app/ExportableTable.tsx`, `src/pages/admin/AuditPage.tsx`, `src/pages/assistant/ReplyExtra.tsx`, `src/pages/blog/BlogAdminPage.tsx`, `src/pages/users/UsersPage.tsx` |
| [app/ExportableTable.tsx](../src/components/app/ExportableTable.tsx) | app | ExportSpec, ExportableTable | `src/pages/dashboard/AdminDashboardPage.tsx`, `src/pages/dashboard/UserDashboardPage.tsx`, `src/pages/requests/RequestsPage.tsx`, `src/pages/dev/components/sections/tables.tsx`, `src/pages/dev/components/sections/tableDemos.tsx`, `src/pages/requests/requestTable.ts` |
| [app/GlobalSearch.tsx](../src/components/app/GlobalSearch.tsx) | app | SearchTarget, GlobalSearch | Non importato direttamente |
| [app/HomeRedirect.tsx](../src/components/app/HomeRedirect.tsx) | app | HomeRedirect | Non importato direttamente |
| [app/IconButton.tsx](../src/components/app/IconButton.tsx) | app | IconButton, PrimaryAction | `src/clinic/PatientDetail.tsx`, `src/clinic/OverviewPage.tsx`, `src/clinic/CommunicationsPages.tsx`, `src/clinic/AgendaPage.tsx`, `src/clinic/BillingPages.tsx`, `src/clinic/StatsPage.tsx`, `src/clinic/AgendaControls.tsx`, `src/clinic/MaterialsPages.tsx`, `src/clinic/PatientCare.tsx`, `src/clinic/PatientsPage.tsx`, `src/pages/dashboard/UserDashboardPage.tsx`, `src/pages/notifications/NotificationsPage.tsx`, `src/pages/requests/RequestsPage.tsx`, `src/pages/requests/RequestDetailPage.tsx`, `src/pages/blog/BlogAdminPage.tsx`, `src/pages/blog/BlogEditorPage.tsx`, `src/pages/users/UsersPage.tsx`, `src/pages/users/UserDetailPage.tsx`, `src/pages/dev/components/sections/pages.tsx`, `src/pages/dev/components/sections/states.tsx`, `src/pages/dev/components/sections/tableDemos.tsx`, `src/pages/dev/components/sections/cards.tsx`, `src/pages/admin/settings/BackupTab.tsx`, `src/pages/admin/settings/SecurityTab.tsx` |
| [app/InlineRename.tsx](../src/components/app/InlineRename.tsx) | app | InlineRename | `src/pages/assistant/useChatHistory.tsx`, `src/pages/dev/components/sections/assistant.tsx` |
| [app/PageHeader.tsx](../src/components/app/PageHeader.tsx) | app | PageHeader | `src/clinic/SettingsPage.tsx`, `src/clinic/MoveSuggestions.tsx`, `src/clinic/PatientDetail.tsx`, `src/clinic/CareCommunicationsPage.tsx`, `src/clinic/OverviewPage.tsx`, `src/clinic/ProfilePage.tsx`, `src/clinic/AppointmentForm.tsx`, `src/clinic/StaffPage.tsx`, `src/clinic/StockPage.tsx`, `src/clinic/CommunicationsPages.tsx`, `src/clinic/AgendaPage.tsx`, `src/clinic/EpisodeForm.tsx`, `src/clinic/BillingPages.tsx`, `src/clinic/StatsPage.tsx`, `src/clinic/AgendaPages.tsx`, `src/clinic/AssistantPage.tsx`, `src/clinic/PlanningPage.tsx`, `src/clinic/InvoiceForms.tsx`, `src/clinic/PatientForm.tsx`, `src/clinic/ExpensesPage.tsx`, `src/clinic/BookingManagement.tsx`, `src/clinic/ImportPage.tsx`, `src/clinic/CompensationsPage.tsx`, `src/clinic/MaterialsPages.tsx`, `src/clinic/TrainingPage.tsx`, `src/clinic/ReviewExportsPage.tsx`, `src/clinic/PatientsPage.tsx`, `src/pages/profile/ProfilePage.tsx`, `src/pages/admin/SettingsPage.tsx`, `src/pages/admin/StatsPage.tsx`, `src/pages/admin/AuditPage.tsx`, `src/pages/admin/AuditDetailPage.tsx`, `src/pages/dashboard/AdminDashboardPage.tsx`, `src/pages/dashboard/UserDashboardPage.tsx`, `src/pages/notifications/NotificationsPage.tsx`, `src/pages/requests/RequestsPage.tsx`, `src/pages/requests/RequestDetailPage.tsx`, `src/pages/requests/RequestFormPage.tsx`, `src/pages/blog/BlogAdminPage.tsx`, `src/pages/blog/BlogEditorPage.tsx`, `src/pages/users/UsersPage.tsx`, `src/pages/users/UserFormPage.tsx`, `src/pages/users/UserDetailPage.tsx`, `src/pages/dev/components/sections/pages.tsx` |
| [app/PageState.tsx](../src/components/app/PageState.tsx) | app | PageLoading, PageError, EmptyState | `src/App.tsx`, `src/clinic/OverviewPage.tsx`, `src/clinic/CommunicationsPages.tsx`, `src/clinic/AgendaPage.tsx`, `src/clinic/PatientDocuments.tsx`, `src/clinic/BillingPages.tsx`, `src/clinic/SettingsPeople.tsx`, `src/clinic/AgendaPages.tsx`, `src/clinic/AssistantPage.tsx`, `src/clinic/InvoiceForms.tsx`, `src/clinic/AuthPages.tsx`, `src/clinic/PublicBooking.tsx`, `src/clinic/common.tsx`, `src/clinic/MaterialsPages.tsx`, `src/clinic/PatientCare.tsx`, `src/clinic/TrainingPage.tsx`, `src/clinic/PatientsPage.tsx`, `src/pages/admin/StatsPage.tsx`, `src/pages/admin/AuditPage.tsx`, `src/pages/admin/AuditDetailPage.tsx`, `src/pages/dashboard/AdminDashboardPage.tsx`, `src/pages/dashboard/UserDashboardPage.tsx`, `src/pages/notifications/NotificationsPage.tsx`, `src/pages/requests/RequestsPage.tsx`, `src/pages/requests/RequestDetailPage.tsx`, `src/pages/requests/RequestFormPage.tsx`, `src/pages/blog/BlogAdminPage.tsx`, `src/pages/blog/BlogPublicPages.tsx`, `src/pages/blog/BlogEditorPage.tsx`, `src/pages/users/UsersPage.tsx`, `src/pages/users/UserFormPage.tsx`, `src/pages/users/UserDetailPage.tsx`, `src/pages/dev/components/sections/states.tsx`, `src/pages/admin/settings/BackupTab.tsx`, `src/pages/admin/settings/AutomationsTab.tsx`, `src/pages/admin/settings/SecurityTab.tsx` |
| [app/PageTabs.tsx](../src/components/app/PageTabs.tsx) | app | PageTabs | `src/clinic/PatientDetail.tsx`, `src/clinic/ProfilePage.tsx`, `src/clinic/CommunicationsPages.tsx`, `src/clinic/AgendaControls.tsx`, `src/clinic/PatientForm.tsx`, `src/clinic/PatientCare.tsx`, `src/pages/profile/ProfilePage.tsx`, `src/pages/admin/SettingsPage.tsx`, `src/pages/admin/AuditPage.tsx`, `src/pages/notifications/NotificationsPage.tsx`, `src/pages/blog/BlogAdminPage.tsx`, `src/pages/dev/components/DocEntry.tsx`, `src/pages/dev/email/EmailPreviewPage.tsx` |
| [app/Pagination.tsx](../src/components/app/Pagination.tsx) | app | PAGE_SIZE, usePagination, serverPage, Pagination | `src/clinic/PatientDirectory.tsx`, `src/components/app/RowList.tsx`, `src/pages/blog/BlogPublicPages.tsx` |
| [app/RequireAuth.tsx](../src/components/app/RequireAuth.tsx) | app | RequireAuth, Feature, RequireFeature | `src/routes/site.tsx`, `src/routes/app.tsx`, `src/pages/requests/RequestFormPage.tsx`, `src/pages/blog/BlogEditorPage.tsx`, `src/pages/admin/settings/BrandTab.tsx`, `src/pages/admin/settings/SeoTab.tsx` |
| [app/RowList.tsx](../src/components/app/RowList.tsx) | app | RowItem, RowList | `src/clinic/MoveSuggestions.tsx`, `src/clinic/CareCommunicationsPage.tsx`, `src/clinic/OverviewPage.tsx`, `src/clinic/PublicPortal.tsx`, `src/clinic/StaffPage.tsx`, `src/clinic/StockPage.tsx`, `src/clinic/GroupParticipants.tsx`, `src/clinic/CommunicationsPages.tsx`, `src/clinic/PatientDocuments.tsx`, `src/clinic/AppointmentList.tsx`, `src/clinic/AgendaPages.tsx`, `src/clinic/AutomationSettings.tsx`, `src/clinic/ExpensesPage.tsx`, `src/clinic/BookingManagement.tsx`, `src/clinic/ImportPage.tsx`, `src/clinic/CompensationsPage.tsx`, `src/clinic/ReviewExportsPage.tsx`, `src/clinic/AgendaNotes.tsx`, `src/pages/admin/AuditPage.tsx`, `src/pages/notifications/NotificationsPage.tsx`, `src/pages/blog/BlogAdminPage.tsx`, `src/pages/dev/components/sections/lists.tsx` |
| [app/Section.tsx](../src/components/app/Section.tsx) | app | Section, DetailList | `src/clinic/PatientDetail.tsx`, `src/clinic/PatientAvailability.tsx`, `src/clinic/CareCommunicationsPage.tsx`, `src/clinic/OverviewPage.tsx`, `src/clinic/ProfilePage.tsx`, `src/clinic/AppointmentForm.tsx`, `src/clinic/PublicPortal.tsx`, `src/clinic/StaffPage.tsx`, `src/clinic/StockPage.tsx`, `src/clinic/GroupParticipants.tsx`, `src/clinic/PublicSignature.tsx`, `src/clinic/CommunicationsPages.tsx`, `src/clinic/EpisodeForm.tsx`, `src/clinic/WaitlistForm.tsx`, `src/clinic/PatientDocuments.tsx`, `src/clinic/BillingPages.tsx`, `src/clinic/StatsPage.tsx`, `src/clinic/CopySelection.tsx`, `src/clinic/SettingsPeople.tsx`, `src/clinic/InvoiceFiscalActions.tsx`, `src/clinic/AgendaPages.tsx`, `src/clinic/PlanningPage.tsx`, `src/clinic/InvoiceForms.tsx`, `src/clinic/PatientForm.tsx`, `src/clinic/ExpensesPage.tsx`, `src/clinic/PurchaseImport.tsx`, `src/clinic/BookingManagement.tsx`, `src/clinic/PublicBooking.tsx`, `src/clinic/ImportPage.tsx`, `src/clinic/CompensationsPage.tsx`, `src/clinic/ProposalSelection.tsx`, `src/clinic/MaterialsPages.tsx`, `src/clinic/PatientCare.tsx`, `src/clinic/ReviewExportsPage.tsx`, `src/clinic/AgendaNotes.tsx`, `src/pages/admin/AuditDetailPage.tsx`, `src/pages/dashboard/AdminDashboardPage.tsx`, `src/pages/dashboard/UserDashboardPage.tsx`, `src/pages/requests/RequestDetailPage.tsx`, `src/pages/blog/BlogEditorPage.tsx`, `src/pages/users/UserDetailPage.tsx`, `src/pages/dev/components/sections/pages.tsx` |
| [app/SettingsSection.tsx](../src/components/app/SettingsSection.tsx) | app | SettingsSection, SaveBar | `src/clinic/SettingsPage.tsx`, `src/clinic/DocumentTemplates.tsx`, `src/clinic/ProfilePage.tsx`, `src/clinic/CatalogSettings.tsx`, `src/clinic/AdvancedSettings.tsx`, `src/clinic/SettingsPeople.tsx`, `src/clinic/AutomationSettings.tsx`, `src/clinic/CalendarSettings.tsx`, `src/clinic/IntegrationStatus.tsx`, `src/pages/dev/components/sections/settings.tsx`, `src/pages/admin/settings/ExtraTabs.tsx`, `src/pages/admin/settings/BackupTab.tsx`, `src/pages/admin/settings/BrandTab.tsx`, `src/pages/admin/settings/SeoTab.tsx`, `src/pages/admin/settings/AutomationsTab.tsx`, `src/pages/admin/settings/SecurityTab.tsx`, `src/pages/admin/settings/RolesTab.tsx`, `src/pages/admin/settings/AppearanceTab.tsx`, `src/pages/admin/settings/ModulesTab.tsx` |
| [app/TableToolbar.tsx](../src/components/app/TableToolbar.tsx) | app | TableToolbar, matches | `src/clinic/CommunicationsPages.tsx`, `src/clinic/BillingPages.tsx`, `src/clinic/TrainingPage.tsx`, `src/clinic/PatientsPage.tsx`, `src/pages/dev/components/sections/tables.tsx`, `src/pages/dev/components/sections/tableDemos.tsx` |
| [app/Timeline.tsx](../src/components/app/Timeline.tsx) | app | TimelineEvent, Timeline | `src/pages/dev/components/sections/pages.tsx`, `src/pages/dev/components/sections/lists.tsx`, `src/pages/admin/settings/AutomationsTab.tsx` |
| [atoms/Button.tsx](../src/components/atoms/Button.tsx) | atoms · vendor | buttonVariants, ButtonVariant, Button | `src/layouts/SiteLayout.tsx`, `src/clinic/MoveSuggestions.tsx`, `src/clinic/PatientDetail.tsx`, `src/clinic/DocumentTemplates.tsx`, `src/clinic/PatientAvailability.tsx`, `src/clinic/CareCommunicationsPage.tsx`, `src/clinic/OperatorPlanCard.tsx`, `src/clinic/ProfilePage.tsx`, `src/clinic/AppointmentForm.tsx`, `src/clinic/PublicPortal.tsx`, `src/clinic/StaffPage.tsx`, `src/clinic/StockPage.tsx`, `src/clinic/GroupParticipants.tsx`, `src/clinic/EpisodeDiary.tsx`, `src/clinic/CalendarWeek.tsx`, `src/clinic/CatalogSettings.tsx`, `src/clinic/PublicSignature.tsx`, `src/clinic/CommunicationsPages.tsx`, `src/clinic/AgendaPage.tsx`, `src/clinic/AdvancedSettings.tsx`, `src/clinic/ParameterFields.tsx`, `src/clinic/EpisodeForm.tsx`, `src/clinic/WaitlistForm.tsx`, `src/clinic/PatientDocuments.tsx`, `src/clinic/BillingPages.tsx`, `src/clinic/CopySelection.tsx`, `src/clinic/InvoiceFiscalActions.tsx`, `src/clinic/AgendaPages.tsx`, `src/clinic/AssistantPage.tsx`, `src/clinic/PublicVisitConfirmation.tsx`, `src/clinic/PlanningPage.tsx`, `src/clinic/AgendaControls.tsx`, `src/clinic/AutomationSettings.tsx`, `src/clinic/PatientForm.tsx`, `src/clinic/ExpensesPage.tsx`, `src/clinic/PurchaseImport.tsx`, `src/clinic/BookingManagement.tsx`, `src/clinic/AuthPages.tsx`, `src/clinic/PublicBooking.tsx`, `src/clinic/ImportPage.tsx`, `src/clinic/CompensationsPage.tsx`, `src/clinic/TherapyConsumption.tsx`, `src/clinic/ProposalSelection.tsx`, `src/clinic/CalendarSettings.tsx`, `src/clinic/MaterialsPages.tsx`, `src/clinic/PatientCare.tsx`, `src/clinic/TrainingPage.tsx`, `src/clinic/ReviewExportsPage.tsx`, `src/clinic/IntegrationStatus.tsx`, `src/clinic/AgendaNotes.tsx`, `src/clinic/ClinicFileField.tsx`, `src/components/form/FormActions.tsx`, `src/components/form/PrimaryButton.tsx`, `src/components/primitives/AgentScreen.tsx`, `src/components/primitives/SelectionActions.tsx`, `src/components/primitives/RecommendationCard.tsx`, `src/components/primitives/DiffTable.tsx`, `src/components/primitives/ApprovalCard.tsx`, `src/components/content/EmbedField.tsx`, `src/components/app/IconButton.tsx`, `src/components/app/ConfirmDialog.tsx`, `src/components/app/SettingsSection.tsx`, `src/components/app/CollapsiblePanel.tsx`, `src/components/app/PageState.tsx`, `src/pages/profile/ProfileForms.tsx`, `src/pages/profile/ProfileSettings.tsx`, `src/pages/auth/LoginPage.tsx`, `src/pages/dev/components/sections/feedback.tsx`, `src/pages/admin/settings/SecurityTab.tsx`, `src/pages/admin/settings/AppearanceTab.tsx` |
| [atoms/Chip.tsx](../src/components/atoms/Chip.tsx) | atoms · vendor | Chip | Non importato direttamente |
| [atoms/EntityChip.tsx](../src/components/atoms/EntityChip.tsx) | atoms · vendor | Monogram, EntityChip | `src/components/primitives/RecommendationCard.tsx`, `src/pages/dashboard/AdminDashboardPage.tsx`, `src/pages/assistant/ReplyExtra.tsx` |
| [atoms/ProgressRing.tsx](../src/components/atoms/ProgressRing.tsx) | atoms · vendor | ProgressRing | `src/clinic/PatientCare.tsx` |
| [atoms/SegmentedControl.tsx](../src/components/atoms/SegmentedControl.tsx) | atoms · vendor | SegmentedControl | `src/components/app/PageTabs.tsx`, `src/pages/admin/StatsPage.tsx`, `src/pages/requests/RequestFormPage.tsx`, `src/pages/users/UserFormPage.tsx`, `src/pages/users/UserDetailPage.tsx`, `src/pages/dev/components/DecisionPath.tsx`, `src/pages/dev/email/EmailPreviewPage.tsx`, `src/pages/admin/settings/BackupTab.tsx`, `src/pages/admin/settings/SecurityTab.tsx`, `src/pages/admin/settings/AppearanceTab.tsx` |
| [atoms/Shimmer.tsx](../src/components/atoms/Shimmer.tsx) | atoms · vendor | Shimmer | `src/components/primitives/SelectionActions.tsx` |
| [atoms/StatusPill.tsx](../src/components/atoms/StatusPill.tsx) | atoms · vendor | StatusPill | `src/clinic/PatientDetail.tsx`, `src/clinic/PatientDirectory.tsx`, `src/clinic/PublicPortal.tsx`, `src/clinic/StockPage.tsx`, `src/clinic/GroupParticipants.tsx`, `src/clinic/PublicSignature.tsx`, `src/clinic/AdvancedSettings.tsx`, `src/clinic/PatientDocuments.tsx`, `src/clinic/InvoiceFiscalActions.tsx`, `src/clinic/PublicVisitConfirmation.tsx`, `src/clinic/AutomationSettings.tsx`, `src/clinic/BookingManagement.tsx`, `src/clinic/PublicBooking.tsx`, `src/clinic/ImportPage.tsx`, `src/clinic/common.tsx`, `src/clinic/CompensationsPage.tsx`, `src/clinic/ReviewExportsPage.tsx`, `src/clinic/IntegrationStatus.tsx`, `src/components/app/RowList.tsx`, `src/components/app/EntityCard.tsx`, `src/components/app/Timeline.tsx`, `src/pages/dev/components/sections/feedback.tsx`, `src/pages/dev/components/sections/pages.tsx`, `src/pages/admin/settings/BackupTab.tsx`, `src/pages/admin/settings/AutomationsTab.tsx`, `src/pages/admin/settings/AppearanceTab.tsx` |
| [atoms/StreamText.tsx](../src/components/atoms/StreamText.tsx) | atoms · vendor | StreamText | `src/components/primitives/SelectionActions.tsx` |
| [atoms/Switch.tsx](../src/components/atoms/Switch.tsx) | atoms · vendor | Switch | `src/components/form/SwitchRow.tsx`, `src/pages/admin/settings/AutomationsTab.tsx` |
| [atoms/TextRow.tsx](../src/components/atoms/TextRow.tsx) | atoms · vendor | TextRow | Non importato direttamente |
| [atoms/ValuePill.tsx](../src/components/atoms/ValuePill.tsx) | atoms · vendor | ValuePill | `src/components/primitives/RecommendationCard.tsx`, `src/pages/dashboard/AdminDashboardPage.tsx`, `src/pages/assistant/ReplyExtra.tsx` |
| [brand/BrandMark.tsx](../src/components/brand/BrandMark.tsx) | brand | BrandLogo, BrandMark | `src/layouts/SiteLayout.tsx`, `src/layouts/AppLayout.tsx`, `src/layouts/AuthLayout.tsx` |
| [charts/BarList.tsx](../src/components/charts/BarList.tsx) | charts | BarRow, BarList | `src/clinic/OverviewPage.tsx`, `src/clinic/StatsPage.tsx`, `src/pages/admin/StatsPage.tsx`, `src/pages/dev/components/sections/charts.tsx` |
| [charts/ChartCard.tsx](../src/components/charts/ChartCard.tsx) | charts | ChartRow, ChartCard | `src/clinic/OverviewPage.tsx`, `src/clinic/StatsPage.tsx`, `src/components/charts/BarList.tsx`, `src/components/charts/ColumnChart.tsx`, `src/pages/admin/StatsPage.tsx`, `src/pages/dev/components/sections/charts.tsx` |
| [charts/ColumnChart.tsx](../src/components/charts/ColumnChart.tsx) | charts | ColumnChart | `src/pages/admin/StatsPage.tsx`, `src/pages/dev/components/sections/charts.tsx` |
| [charts/SegmentedBar.tsx](../src/components/charts/SegmentedBar.tsx) | charts | SegmentedBar | `src/pages/admin/StatsPage.tsx`, `src/pages/dev/components/sections/charts.tsx` |
| [charts/StatTile.tsx](../src/components/charts/StatTile.tsx) | charts | StatTile | `src/clinic/OverviewPage.tsx`, `src/clinic/BillingPages.tsx`, `src/clinic/StatsPage.tsx`, `src/pages/admin/StatsPage.tsx`, `src/pages/dev/components/sections/charts.tsx` |
| [content/ArticleBody.tsx](../src/components/content/ArticleBody.tsx) | content | ArticleBody | `src/pages/blog/BlogPublicPages.tsx` |
| [content/EmbedField.tsx](../src/components/content/EmbedField.tsx) | content | EmbedField | `src/pages/blog/BlogEditorPage.tsx` |
| [content/EmbedView.tsx](../src/components/content/EmbedView.tsx) | content | EmbedView | `src/components/content/EmbedField.tsx`, `src/components/content/ArticleBody.tsx` |
| [feedback/EmailLinkRequest.tsx](../src/components/feedback/EmailLinkRequest.tsx) | feedback | EmailLinkRequest | `src/pages/auth/ForgotPasswordPage.tsx`, `src/pages/auth/ConfirmEmailRequestPage.tsx` |
| [feedback/EmailSentPanel.tsx](../src/components/feedback/EmailSentPanel.tsx) | feedback | EmailSentPanel | `src/components/feedback/EmailLinkRequest.tsx`, `src/pages/auth/RegisterPage.tsx` |
| [feedback/LoadingPanel.tsx](../src/components/feedback/LoadingPanel.tsx) | feedback | LoadingPanel | `src/pages/auth/ResetPasswordPage.tsx`, `src/pages/auth/VerifyEmailPage.tsx` |
| [feedback/PreviewLink.tsx](../src/components/feedback/PreviewLink.tsx) | feedback | PreviewLink | `src/pages/auth/RegisterPage.tsx`, `src/pages/auth/ForgotPasswordPage.tsx`, `src/pages/auth/ConfirmEmailRequestPage.tsx` |
| [feedback/StatusPanel.tsx](../src/components/feedback/StatusPanel.tsx) | feedback | StatusPanel | `src/components/feedback/EmailSentPanel.tsx`, `src/pages/auth/ResetPasswordPage.tsx`, `src/pages/auth/VerifyEmailPage.tsx`, `src/pages/errors/ErrorPages.tsx`, `src/pages/dev/components/sections/feedback.tsx`, `src/pages/dev/components/sections/states.tsx` |
| [feedback/ToastProvider.tsx](../src/components/feedback/ToastProvider.tsx) | feedback | ToastProvider | `src/App.tsx` |
| [form/Checkbox.tsx](../src/components/form/Checkbox.tsx) | form | Checkbox | `src/clinic/DocumentTemplates.tsx`, `src/clinic/PublicSignature.tsx`, `src/clinic/ParameterFields.tsx`, `src/clinic/EpisodeForm.tsx`, `src/clinic/PatientDocuments.tsx`, `src/clinic/CopySelection.tsx`, `src/clinic/SettingsPeople.tsx`, `src/clinic/InvoiceForms.tsx`, `src/clinic/AgendaControls.tsx`, `src/clinic/PatientForm.tsx`, `src/clinic/ExpensesPage.tsx`, `src/clinic/BookingManagement.tsx`, `src/clinic/AuthPages.tsx`, `src/clinic/PublicBooking.tsx`, `src/clinic/ImportPage.tsx`, `src/clinic/ProposalSelection.tsx`, `src/clinic/CalendarSettings.tsx`, `src/clinic/TrainingPage.tsx`, `src/clinic/TherapyResources.tsx`, `src/components/wizard/ConsentStep.tsx`, `src/pages/auth/LoginPage.tsx`, `src/pages/dev/components/sections/forms.tsx` |
| [form/FileUpload.tsx](../src/components/form/FileUpload.tsx) | form | FileUpload | `src/pages/requests/RequestFormPage.tsx`, `src/pages/blog/BlogEditorPage.tsx`, `src/pages/dev/components/sections/forms.tsx`, `src/pages/admin/settings/SeoTab.tsx`, `src/pages/admin/settings/BrandAssetsFields.tsx` |
| [form/FormActions.tsx](../src/components/form/FormActions.tsx) | form | FormActions | `src/clinic/InvoiceForms.tsx`, `src/clinic/PatientForm.tsx`, `src/pages/requests/RequestFormPage.tsx`, `src/pages/blog/BlogEditorPage.tsx`, `src/pages/users/UserFormPage.tsx`, `src/pages/dev/components/sections/forms.tsx` |
| [form/PasswordChecklist.tsx](../src/components/form/PasswordChecklist.tsx) | form | PasswordChecklist | `src/components/wizard/FieldsStep.tsx`, `src/pages/profile/ProfileForms.tsx` |
| [form/PasswordField.tsx](../src/components/form/PasswordField.tsx) | form | PasswordField | `src/clinic/ProfilePage.tsx`, `src/clinic/AuthPages.tsx`, `src/components/wizard/FieldsStep.tsx`, `src/pages/profile/ProfileForms.tsx`, `src/pages/auth/LoginPage.tsx` |
| [form/PhoneField.tsx](../src/components/form/PhoneField.tsx) | form | PhoneField | `src/components/wizard/FieldsStep.tsx`, `src/pages/profile/ProfileForms.tsx`, `src/pages/users/UserFormPage.tsx`, `src/pages/dev/components/sections/forms.tsx` |
| [form/PrimaryButton.tsx](../src/components/form/PrimaryButton.tsx) | form | PrimaryButton, PrimaryLink | `src/components/feedback/EmailLinkRequest.tsx`, `src/components/feedback/EmailSentPanel.tsx`, `src/components/wizard/ChoiceStep.tsx`, `src/components/wizard/FieldsStep.tsx`, `src/components/wizard/ConsentStep.tsx`, `src/pages/auth/ResetPasswordPage.tsx`, `src/pages/auth/VerifyEmailPage.tsx`, `src/pages/errors/ErrorPages.tsx` |
| [form/SelectField.tsx](../src/components/form/SelectField.tsx) | form | SelectField | `src/clinic/SettingsPage.tsx`, `src/clinic/DocumentTemplates.tsx`, `src/clinic/PatientAvailability.tsx`, `src/clinic/CareCommunicationsPage.tsx`, `src/clinic/AppointmentForm.tsx`, `src/clinic/StaffPage.tsx`, `src/clinic/StockPage.tsx`, `src/clinic/GroupParticipants.tsx`, `src/clinic/CatalogSettings.tsx`, `src/clinic/AgendaPage.tsx`, `src/clinic/ParameterFields.tsx`, `src/clinic/EpisodeForm.tsx`, `src/clinic/WaitlistForm.tsx`, `src/clinic/PatientDocuments.tsx`, `src/clinic/BillingPages.tsx`, `src/clinic/SettingsPeople.tsx`, `src/clinic/InvoiceForms.tsx`, `src/clinic/AgendaControls.tsx`, `src/clinic/PatientForm.tsx`, `src/clinic/ExpensesPage.tsx`, `src/clinic/PurchaseImport.tsx`, `src/clinic/BookingManagement.tsx`, `src/clinic/PublicBooking.tsx`, `src/clinic/ImportPage.tsx`, `src/clinic/CompensationsPage.tsx`, `src/clinic/TherapyConsumption.tsx`, `src/clinic/ProposalSelection.tsx`, `src/clinic/ReviewExportsPage.tsx`, `src/components/app/PageTabs.tsx`, `src/pages/requests/RequestFormPage.tsx`, `src/pages/dev/components/ComponentsPage.tsx`, `src/pages/dev/components/sections/forms.tsx`, `src/pages/dev/components/sections/tableDemos.tsx`, `src/pages/admin/settings/BackupTab.tsx`, `src/pages/admin/settings/SecurityTab.tsx` |
| [form/SwitchRow.tsx](../src/components/form/SwitchRow.tsx) | form | SwitchRow | `src/pages/profile/ProfileSettings.tsx`, `src/pages/blog/BlogEditorPage.tsx`, `src/pages/dev/components/sections/settings.tsx`, `src/pages/dev/components/sections/forms.tsx`, `src/pages/admin/settings/BackupTab.tsx`, `src/pages/admin/settings/SeoTab.tsx`, `src/pages/admin/settings/SecurityTab.tsx`, `src/pages/admin/settings/AppearanceTab.tsx`, `src/pages/admin/settings/ModulesTab.tsx` |
| [form/TextAreaField.tsx](../src/components/form/TextAreaField.tsx) | form | TextAreaField | `src/clinic/DocumentTemplates.tsx`, `src/clinic/PatientAvailability.tsx`, `src/clinic/CareCommunicationsPage.tsx`, `src/clinic/EpisodeDiary.tsx`, `src/clinic/ParameterFields.tsx`, `src/clinic/EpisodeForm.tsx`, `src/clinic/PatientDocuments.tsx`, `src/clinic/InvoiceForms.tsx`, `src/clinic/PatientForm.tsx`, `src/clinic/PurchaseImport.tsx`, `src/clinic/CompensationsPage.tsx`, `src/clinic/TrainingPage.tsx`, `src/clinic/AgendaNotes.tsx`, `src/pages/requests/RequestFormPage.tsx`, `src/pages/blog/BlogEditorPage.tsx`, `src/pages/admin/settings/SeoTab.tsx`, `src/pages/admin/settings/SecurityTab.tsx` |
| [form/TextField.tsx](../src/components/form/TextField.tsx) | form | TextFieldProps, TextField | `src/clinic/SettingsPage.tsx`, `src/clinic/MoveSuggestions.tsx`, `src/clinic/DocumentTemplates.tsx`, `src/clinic/PatientAvailability.tsx`, `src/clinic/ProfilePage.tsx`, `src/clinic/AppointmentForm.tsx`, `src/clinic/PublicPortal.tsx`, `src/clinic/StaffPage.tsx`, `src/clinic/GroupParticipants.tsx`, `src/clinic/CatalogSettings.tsx`, `src/clinic/PublicSignature.tsx`, `src/clinic/AdvancedSettings.tsx`, `src/clinic/ParameterFields.tsx`, `src/clinic/EpisodeForm.tsx`, `src/clinic/WaitlistForm.tsx`, `src/clinic/PatientDocuments.tsx`, `src/clinic/BillingPages.tsx`, `src/clinic/StatsPage.tsx`, `src/clinic/PlanningPage.tsx`, `src/clinic/PatientForm.tsx`, `src/clinic/ExpensesPage.tsx`, `src/clinic/PurchaseImport.tsx`, `src/clinic/BookingManagement.tsx`, `src/clinic/AuthPages.tsx`, `src/clinic/PublicBooking.tsx`, `src/clinic/CompensationsPage.tsx`, `src/clinic/TherapyConsumption.tsx`, `src/clinic/ProposalSelection.tsx`, `src/clinic/TrainingPage.tsx`, `src/clinic/ReviewExportsPage.tsx`, `src/clinic/AgendaNotes.tsx`, `src/components/form/PasswordField.tsx`, `src/components/content/EmbedField.tsx`, `src/components/app/ConfirmDialog.tsx`, `src/components/feedback/EmailLinkRequest.tsx`, `src/components/wizard/FieldsStep.tsx`, `src/pages/profile/ProfileForms.tsx`, `src/pages/auth/LoginPage.tsx`, `src/pages/requests/RequestFormPage.tsx`, `src/pages/blog/BlogEditorPage.tsx`, `src/pages/users/UserFormPage.tsx`, `src/pages/dev/components/sections/settings.tsx`, `src/pages/dev/components/sections/forms.tsx`, `src/pages/admin/settings/BrandTab.tsx`, `src/pages/admin/settings/SeoTab.tsx`, `src/pages/admin/settings/AppearanceTab.tsx` |
| [icons/central.tsx](../src/components/icons/central.tsx) | icons | IconArrowBoxLeft, IconCheckmark1Small, IconChevronDownSmall, IconCrossSmall, IconEditBig, IconHome, IconMagnifyingGlass, IconPlusMedium, IconPopsicle2, IconSettingsGear1, IconSidebarLeftArrow, IconUserAdd | `src/components/primitives/SidebarNav.tsx` |
| [navigation/SiteFooter.tsx](../src/components/navigation/SiteFooter.tsx) | navigation | SiteFooter | `src/layouts/SiteLayout.tsx`, `src/layouts/AuthLayout.tsx` |
| [navigation/SmartLink.tsx](../src/components/navigation/SmartLink.tsx) | navigation | SmartLink | `src/components/feedback/ToastProvider.tsx` |
| [primitives/AgentScreen.tsx](../src/components/primitives/AgentScreen.tsx) | primitives · vendor | AgentScreen | `src/pages/assistant/ReplyExtra.tsx` |
| [primitives/ApprovalCard.tsx](../src/components/primitives/ApprovalCard.tsx) | primitives · vendor | ApprovalQuestion, ApprovalLabels, ApprovalCard | `src/pages/assistant/AssistantReply.tsx`, `src/pages/assistant/scenarios.tsx` |
| [primitives/ChatComposer.tsx](../src/components/primitives/ChatComposer.tsx) | primitives · vendor | ChatMessage, ChatComposerLabels, ChatComposer | `src/pages/requests/RequestDetailPage.tsx` |
| [primitives/CodeBlock.tsx](../src/components/primitives/CodeBlock.tsx) | primitives · vendor | CodePiece, DiffRow, CodeBlockLabels, CodeBlockProps, CodeBlock | `src/pages/admin/AuditDetailPage.tsx`, `src/pages/dev/components/DocEntry.tsx`, `src/pages/admin/settings/ExtraTabs.tsx` |
| [primitives/ContextCards.tsx](../src/components/primitives/ContextCards.tsx) | primitives · vendor | ContextChunk, ContextCardsLabels, ContextCards | `src/pages/requests/RequestDetailPage.tsx`, `src/pages/assistant/ReplyExtra.tsx` |
| [primitives/DiffTable.tsx](../src/components/primitives/DiffTable.tsx) | primitives · vendor | DiffRow, DiffAddedRow, DiffTableLabels, DiffTable | `src/pages/assistant/ReplyExtra.tsx` |
| [primitives/FilterTable.tsx](../src/components/primitives/FilterTable.tsx) | primitives · vendor | TableRow, FilterStatus, FilterTableLabels, FilterTable | `src/clinic/CommunicationsPages.tsx`, `src/clinic/BillingPages.tsx`, `src/components/app/ExportableTable.tsx`, `src/pages/dev/components/sections/tableDemos.tsx`, `src/pages/requests/requestTable.ts` |
| [primitives/FineTuneCard.tsx](../src/components/primitives/FineTuneCard.tsx) | primitives · vendor | FineTuneField, FineTuneCardLabels, FineTuneState, FineTuneCardProps, FineTuneCard | `src/pages/dev/components/sections/settings.tsx` |
| [primitives/Flowchart.tsx](../src/components/primitives/Flowchart.tsx) | primitives · vendor | StepNode, FlowCondition, Flowchart | `src/pages/admin/settings/AutomationsTab.tsx` |
| [primitives/GlideMenu.tsx](../src/components/primitives/GlideMenu.tsx) | primitives · vendor | GlideMenu | `src/clinic/AssistantPage.tsx`, `src/components/primitives/SearchList.tsx`, `src/components/primitives/SidebarNav.tsx`, `src/components/primitives/RecordsTable.tsx`, `src/components/primitives/ApprovalCard.tsx`, `src/components/primitives/FineTuneCard.tsx`, `src/components/app/RowList.tsx`, `src/components/app/ActionMenu.tsx`, `src/components/wizard/ChoiceStep.tsx`, `src/pages/dev/PreviewIndexPage.tsx`, `src/pages/assistant/AssistantPage.tsx` |
| [primitives/InsightCards.tsx](../src/components/primitives/InsightCards.tsx) | primitives · vendor | Entity, Mono, CompareSeries, CompareCard, AnomalyData, AnomalyLabels, AnomalyCard, AllocationSegment, AllocationCard, InsightPage, InsightCardsLabels, InsightCards | `src/pages/admin/StatsPage.tsx`, `src/pages/dashboard/insights.tsx`, `src/pages/dashboard/AdminDashboardPage.tsx` |
| [primitives/LoadingState.tsx](../src/components/primitives/LoadingState.tsx) | primitives · vendor | LoadingState | `src/clinic/AssistantPage.tsx`, `src/components/app/PageState.tsx`, `src/pages/assistant/AssistantReply.tsx` |
| [primitives/PromptBar.tsx](../src/components/primitives/PromptBar.tsx) | primitives · vendor | Source, PromptCommand, PromptBarLabels, PromptBar | `src/clinic/AssistantPage.tsx`, `src/pages/assistant/AssistantPage.tsx`, `src/pages/dev/components/sections/assistant.tsx`, `src/pages/assistant/composer.ts` |
| [primitives/RecommendationCard.tsx](../src/components/primitives/RecommendationCard.tsx) | primitives · vendor | RecommendationOption, RecommendationLabels, RecommendationCard | `src/pages/dashboard/AdminDashboardPage.tsx`, `src/pages/assistant/ReplyExtra.tsx` |
| [primitives/RecordsTable.tsx](../src/components/primitives/RecordsTable.tsx) | primitives · vendor | RecordRow, RecordsLabels, RecordsTable | `src/clinic/SettingsPeople.tsx`, `src/pages/users/UsersPage.tsx`, `src/pages/dev/components/sections/tables.tsx`, `src/pages/dev/components/sections/tableDemos.tsx` |
| [primitives/SearchList.tsx](../src/components/primitives/SearchList.tsx) | primitives · vendor | SearchItem, SearchListLabels, SearchList | `src/components/app/GlobalSearch.tsx` |
| [primitives/SelectionActions.tsx](../src/components/primitives/SelectionActions.tsx) | primitives · vendor | SelectionText, SelectionAction, SelectionActionSet, SelectionActionsLabels, SelectionActionsProps, SelectionActions | `src/pages/requests/requestAi.tsx`, `src/pages/requests/RequestDetailPage.tsx` |
| [primitives/SidebarNav.tsx](../src/components/primitives/SidebarNav.tsx) | primitives · vendor | SidebarNavItem, SidebarWorkspace, SidebarMenuAction, SidebarLabels, SidebarRecent, SidebarNav | `src/layouts/AppLayout.tsx`, `src/clinic/navigation.tsx`, `src/config/navigation.ts` |
| [primitives/StreamingText.tsx](../src/components/primitives/StreamingText.tsx) | primitives · vendor | StreamingToken, StreamingSource, StreamingLabels, StreamingText | `src/clinic/AssistantPage.tsx`, `src/pages/assistant/AssistantReply.tsx`, `src/pages/assistant/scenarios.tsx`, `src/pages/dev/components/sections/assistant.tsx` |
| [primitives/TaskRows.tsx](../src/components/primitives/TaskRows.tsx) | primitives · vendor | TaskDetail, TaskRow, TaskRowsLabels, TaskRows | `src/pages/dashboard/AdminDashboardPage.tsx`, `src/pages/dashboard/UserDashboardPage.tsx`, `src/pages/dev/components/sections/lists.tsx`, `src/pages/dashboard/tasks.ts` |
| [primitives/ThinkingState.tsx](../src/components/primitives/ThinkingState.tsx) | primitives · vendor | ThinkingState | `src/pages/assistant/AssistantReply.tsx`, `src/pages/dev/components/sections/assistant.tsx` |
| [primitives/ToolChips.tsx](../src/components/primitives/ToolChips.tsx) | primitives · vendor | ToolDetailLine, ToolStep, ToolDiff, ToolDiffLine, ToolChipsLabels, hero, hero, ToolChips | `src/pages/assistant/AssistantReply.tsx`, `src/pages/assistant/scenarios.tsx` |
| [site/ThemeToggle.tsx](../src/components/site/ThemeToggle.tsx) | site · vendor | ThemeToggle | `src/layouts/AppLayout.tsx`, `src/components/navigation/SiteFooter.tsx`, `src/pages/profile/ProfileSettings.tsx`, `src/pages/dev/DevLayout.tsx` |
| [wizard/ChoiceStep.tsx](../src/components/wizard/ChoiceStep.tsx) | wizard | ChoiceStep | `src/components/wizard/RegisterWizard.tsx` |
| [wizard/ConsentStep.tsx](../src/components/wizard/ConsentStep.tsx) | wizard | ConsentStep | `src/components/wizard/RegisterWizard.tsx` |
| [wizard/FieldsStep.tsx](../src/components/wizard/FieldsStep.tsx) | wizard | FieldsStep | `src/components/wizard/RegisterWizard.tsx`, `src/pages/auth/ResetPasswordPage.tsx` |
| [wizard/RegisterWizard.tsx](../src/components/wizard/RegisterWizard.tsx) | wizard | RegisterWizard | `src/pages/auth/RegisterPage.tsx`, `src/pages/auth/VerifyEmailPage.tsx` |

## Rotte dichiarate

- `/privacy`
- `/`
- `/accedi`
- `/password-dimenticata`
- `/nuova-password/:token`
- `/conferma-visita/:token`
- `/prenota`
- `/portale`
- `/firma/:token`
- `/settimana/:token`
- `/formazione`
- `/pacchetti`
- `/relazioni`
- `/importazione`
- `/compensi`
- `/magazzino`
- `/personale`
- `/spese`
- `/prenotazioni`
- `/panoramica`
- `/agenda`
- `/agenda/copia`
- `/agenda/nuovo`
- `/agenda/:id/modifica`
- `/agenda/:id/proposte-spostamento`
- `/agenda/:id`
- `/pazienti`
- `/pazienti/nuovo`
- `/pazienti/:id/modifica`
- `/percorsi/:id`
- `/pazienti/:id`
- `/pianificazione/:id`
- `/comunicazioni`
- `/comunicazioni/variazione/:id`
- `/comunicazioni/:id`
- `/statistiche`
- `/fatture`
- `/fatture/nuova`
- `/fatture/:id/storno`
- `/fatture/:id`
- `/impostazioni`
- `/profilo`
- `/assistente`
- `/mappa`
- `/mappa/:id`
- `/decisioni`
- `*`

## Chiamate API

Percorsi relativi alla base configurata; payload e risultati sono tipizzati nei file indicati.

| Endpoint | Sorgente |
|---|---|
| POST `/impostazioni/salva` | [src/clinic/AdvancedSettings.tsx](../src/clinic/AdvancedSettings.tsx) |
| POST `/impostazioni/segreti-salva` | [src/clinic/AdvancedSettings.tsx](../src/clinic/AdvancedSettings.tsx) |
| POST `/impostazioni/segreti-stato` | [src/clinic/AdvancedSettings.tsx](../src/clinic/AdvancedSettings.tsx) |
| POST `/agenda/avvisi-ciclo` | [src/clinic/AgendaNotes.tsx](../src/clinic/AgendaNotes.tsx) |
| POST `/agenda/nota-salva` | [src/clinic/AgendaNotes.tsx](../src/clinic/AgendaNotes.tsx) |
| POST `/agenda/note` | [src/clinic/AgendaNotes.tsx](../src/clinic/AgendaNotes.tsx) |
| POST `/agenda/vista` | [src/clinic/AgendaPage.tsx](../src/clinic/AgendaPage.tsx) |
| POST `/impostazioni/leggi` | [src/clinic/AgendaPage.tsx](../src/clinic/AgendaPage.tsx) |
| POST `/agenda/annulla` | [src/clinic/AgendaPages.tsx](../src/clinic/AgendaPages.tsx) |
| POST `/agenda/copia-anteprima` | [src/clinic/AgendaPages.tsx](../src/clinic/AgendaPages.tsx) |
| POST `/agenda/stato` | [src/clinic/AgendaPages.tsx](../src/clinic/AgendaPages.tsx) |
| POST `/agenda/vista` | [src/clinic/AgendaPages.tsx](../src/clinic/AgendaPages.tsx) |
| POST `/agenda/vista` | [src/clinic/AppointmentForm.tsx](../src/clinic/AppointmentForm.tsx) |
| POST `/pazienti/cerca` | [src/clinic/AppointmentForm.tsx](../src/clinic/AppointmentForm.tsx) |
| POST `/pazienti/dettaglio` | [src/clinic/AppointmentForm.tsx](../src/clinic/AppointmentForm.tsx) |
| POST `/agenda/stato` | [src/clinic/AppointmentList.tsx](../src/clinic/AppointmentList.tsx) |
| POST `/assistente/chiedi` | [src/clinic/AssistantPage.tsx](../src/clinic/AssistantPage.tsx) |
| POST `/assistente/stato` | [src/clinic/AssistantPage.tsx](../src/clinic/AssistantPage.tsx) |
| POST `/auth/nuova-password` | [src/clinic/AuthPages.tsx](../src/clinic/AuthPages.tsx) |
| POST `/auth/nuova-password/verifica` | [src/clinic/AuthPages.tsx](../src/clinic/AuthPages.tsx) |
| POST `/auth/password-dimenticata` | [src/clinic/AuthPages.tsx](../src/clinic/AuthPages.tsx) |
| POST `/attivita/attiva` | [src/clinic/AutomationSettings.tsx](../src/clinic/AutomationSettings.tsx) |
| POST `/attivita/elenco` | [src/clinic/AutomationSettings.tsx](../src/clinic/AutomationSettings.tsx) |
| POST `/attivita/esegui` | [src/clinic/AutomationSettings.tsx](../src/clinic/AutomationSettings.tsx) |
| POST `/fatture/archivio` | [src/clinic/BillingPages.tsx](../src/clinic/BillingPages.tsx) |
| POST `/fatture/dettaglio` | [src/clinic/BillingPages.tsx](../src/clinic/BillingPages.tsx) |
| POST `/fatture/elenco` | [src/clinic/BillingPages.tsx](../src/clinic/BillingPages.tsx) |
| POST `/fatture/emetti` | [src/clinic/BillingPages.tsx](../src/clinic/BillingPages.tsx) |
| POST `/fatture/paga` | [src/clinic/BillingPages.tsx](../src/clinic/BillingPages.tsx) |
| POST `/fatture/scarica-pdf` | [src/clinic/BillingPages.tsx](../src/clinic/BillingPages.tsx) |
| POST `/fatture/scarica-xml` | [src/clinic/BillingPages.tsx](../src/clinic/BillingPages.tsx) |
| POST `/fatture/sts-csv` | [src/clinic/BillingPages.tsx](../src/clinic/BillingPages.tsx) |
| POST `/pazienti/cerca` | [src/clinic/BillingPages.tsx](../src/clinic/BillingPages.tsx) |
| POST `/statistiche/economiche` | [src/clinic/BillingPages.tsx](../src/clinic/BillingPages.tsx) |
| POST `/prenotazioni/finestra-salva` | [src/clinic/BookingManagement.tsx](../src/clinic/BookingManagement.tsx) |
| POST `/prenotazioni/finestre` | [src/clinic/BookingManagement.tsx](../src/clinic/BookingManagement.tsx) |
| POST `/prenotazioni/gestione` | [src/clinic/BookingManagement.tsx](../src/clinic/BookingManagement.tsx) |
| POST `/prenotazioni/gestisci` | [src/clinic/BookingManagement.tsx](../src/clinic/BookingManagement.tsx) |
| POST `/impostazioni/profilo-calendar` | [src/clinic/CalendarSettings.tsx](../src/clinic/CalendarSettings.tsx) |
| POST `/impostazioni/salva` | [src/clinic/CalendarSettings.tsx](../src/clinic/CalendarSettings.tsx) |
| POST `/relazioni/campagna` | [src/clinic/CareCommunicationsPage.tsx](../src/clinic/CareCommunicationsPage.tsx) |
| POST `/relazioni/completato` | [src/clinic/CareCommunicationsPage.tsx](../src/clinic/CareCommunicationsPage.tsx) |
| POST `/relazioni/ricontatti` | [src/clinic/CareCommunicationsPage.tsx](../src/clinic/CareCommunicationsPage.tsx) |
| POST `/catalogo/` | [src/clinic/CatalogSettings.tsx](../src/clinic/CatalogSettings.tsx) |
| POST `/auth/login` | [src/clinic/ClinicContext.tsx](../src/clinic/ClinicContext.tsx) |
| POST `/auth/logout` | [src/clinic/ClinicContext.tsx](../src/clinic/ClinicContext.tsx) |
| POST `/auth/sessione` | [src/clinic/ClinicContext.tsx](../src/clinic/ClinicContext.tsx) |
| POST `/catalogo/elenco` | [src/clinic/ClinicContext.tsx](../src/clinic/ClinicContext.tsx) |
| POST `/comunicazioni/elabora` | [src/clinic/CommunicationsPages.tsx](../src/clinic/CommunicationsPages.tsx) |
| POST `/comunicazioni/messaggi` | [src/clinic/CommunicationsPages.tsx](../src/clinic/CommunicationsPages.tsx) |
| POST `/comunicazioni/promemoria-esegui` | [src/clinic/CommunicationsPages.tsx](../src/clinic/CommunicationsPages.tsx) |
| POST `/comunicazioni/riprova` | [src/clinic/CommunicationsPages.tsx](../src/clinic/CommunicationsPages.tsx) |
| POST `/comunicazioni/variazione-spunta` | [src/clinic/CommunicationsPages.tsx](../src/clinic/CommunicationsPages.tsx) |
| POST `/comunicazioni/variazioni` | [src/clinic/CommunicationsPages.tsx](../src/clinic/CommunicationsPages.tsx) |
| POST `/compensi/calcola` | [src/clinic/CompensationsPage.tsx](../src/clinic/CompensationsPage.tsx) |
| POST `/compensi/comunicazione` | [src/clinic/CompensationsPage.tsx](../src/clinic/CompensationsPage.tsx) |
| POST `/compensi/dettaglio` | [src/clinic/CompensationsPage.tsx](../src/clinic/CompensationsPage.tsx) |
| POST `/compensi/eccezione` | [src/clinic/CompensationsPage.tsx](../src/clinic/CompensationsPage.tsx) |
| POST `/compensi/elenco` | [src/clinic/CompensationsPage.tsx](../src/clinic/CompensationsPage.tsx) |
| POST `/compensi/prospetto` | [src/clinic/CompensationsPage.tsx](../src/clinic/CompensationsPage.tsx) |
| POST `/compensi/ricevuta` | [src/clinic/CompensationsPage.tsx](../src/clinic/CompensationsPage.tsx) |
| POST `/compensi/scarica` | [src/clinic/CompensationsPage.tsx](../src/clinic/CompensationsPage.tsx) |
| POST `/compensi/stato` | [src/clinic/CompensationsPage.tsx](../src/clinic/CompensationsPage.tsx) |
| POST `/agenda/copia-applica` | [src/clinic/CopySelection.tsx](../src/clinic/CopySelection.tsx) |
| POST `/documenti/modelli` | [src/clinic/DocumentTemplates.tsx](../src/clinic/DocumentTemplates.tsx) |
| POST `/documenti/modello-salva` | [src/clinic/DocumentTemplates.tsx](../src/clinic/DocumentTemplates.tsx) |
| POST `/percorsi/nota-salva` | [src/clinic/EpisodeDiary.tsx](../src/clinic/EpisodeDiary.tsx) |
| POST `/percorsi/dettaglio` | [src/clinic/EpisodeForm.tsx](../src/clinic/EpisodeForm.tsx) |
| POST `/percorsi/salva` | [src/clinic/EpisodeForm.tsx](../src/clinic/EpisodeForm.tsx) |
| POST `/gestione/allegato` | [src/clinic/ExpensesPage.tsx](../src/clinic/ExpensesPage.tsx) |
| POST `/gestione/spesa` | [src/clinic/ExpensesPage.tsx](../src/clinic/ExpensesPage.tsx) |
| POST `/gestione/spese` | [src/clinic/ExpensesPage.tsx](../src/clinic/ExpensesPage.tsx) |
| POST `/agenda/annulla` | [src/clinic/GroupParticipants.tsx](../src/clinic/GroupParticipants.tsx) |
| POST `/agenda/gruppo-aggiungi` | [src/clinic/GroupParticipants.tsx](../src/clinic/GroupParticipants.tsx) |
| POST `/agenda/stato` | [src/clinic/GroupParticipants.tsx](../src/clinic/GroupParticipants.tsx) |
| POST `/pazienti/cerca` | [src/clinic/GroupParticipants.tsx](../src/clinic/GroupParticipants.tsx) |
| POST `/pazienti/dettaglio` | [src/clinic/GroupParticipants.tsx](../src/clinic/GroupParticipants.tsx) |
| POST `/importazione/anteprima` | [src/clinic/ImportPage.tsx](../src/clinic/ImportPage.tsx) |
| POST `/importazione/applica` | [src/clinic/ImportPage.tsx](../src/clinic/ImportPage.tsx) |
| POST `/importazione/valida` | [src/clinic/ImportPage.tsx](../src/clinic/ImportPage.tsx) |
| POST `/fiscale/stato` | [src/clinic/IntegrationStatus.tsx](../src/clinic/IntegrationStatus.tsx) |
| POST `/fiscale/verifica-aruba` | [src/clinic/IntegrationStatus.tsx](../src/clinic/IntegrationStatus.tsx) |
| POST `/fiscale/aruba` | [src/clinic/InvoiceFiscalActions.tsx](../src/clinic/InvoiceFiscalActions.tsx) |
| POST `/fatture/bozza-salva` | [src/clinic/InvoiceForms.tsx](../src/clinic/InvoiceForms.tsx) |
| POST `/fatture/nota-credito` | [src/clinic/InvoiceForms.tsx](../src/clinic/InvoiceForms.tsx) |
| POST `/fatture/proponi` | [src/clinic/InvoiceForms.tsx](../src/clinic/InvoiceForms.tsx) |
| POST `/pazienti/cerca` | [src/clinic/InvoiceForms.tsx](../src/clinic/InvoiceForms.tsx) |
| POST `/pubblico/settimana` | [src/clinic/MaterialsPages.tsx](../src/clinic/MaterialsPages.tsx) |
| POST `/agenda/proposte-spostamento` | [src/clinic/MoveSuggestions.tsx](../src/clinic/MoveSuggestions.tsx) |
| POST `/agenda/sposta` | [src/clinic/MoveSuggestions.tsx](../src/clinic/MoveSuggestions.tsx) |
| POST `/assistente/conferma` | [src/clinic/OperatorPlanCard.tsx](../src/clinic/OperatorPlanCard.tsx) |
| POST `/assistente/scarta` | [src/clinic/OperatorPlanCard.tsx](../src/clinic/OperatorPlanCard.tsx) |
| POST `/agenda/vista` | [src/clinic/OverviewPage.tsx](../src/clinic/OverviewPage.tsx) |
| POST `/comunicazioni/messaggi` | [src/clinic/OverviewPage.tsx](../src/clinic/OverviewPage.tsx) |
| POST `/fatture/elenco` | [src/clinic/OverviewPage.tsx](../src/clinic/OverviewPage.tsx) |
| POST `/pazienti/salva` | [src/clinic/PatientAvailability.tsx](../src/clinic/PatientAvailability.tsx) |
| POST `/pazienti/appuntamenti` | [src/clinic/PatientCare.tsx](../src/clinic/PatientCare.tsx) |
| POST `/pazienti/dettaglio` | [src/clinic/PatientDetail.tsx](../src/clinic/PatientDetail.tsx) |
| POST `/documenti/bozza` | [src/clinic/PatientDocuments.tsx](../src/clinic/PatientDocuments.tsx) |
| POST `/documenti/elenco` | [src/clinic/PatientDocuments.tsx](../src/clinic/PatientDocuments.tsx) |
| POST `/documenti/link` | [src/clinic/PatientDocuments.tsx](../src/clinic/PatientDocuments.tsx) |
| POST `/documenti/modelli` | [src/clinic/PatientDocuments.tsx](../src/clinic/PatientDocuments.tsx) |
| POST `/documenti/salva` | [src/clinic/PatientDocuments.tsx](../src/clinic/PatientDocuments.tsx) |
| POST `/documenti/scarica` | [src/clinic/PatientDocuments.tsx](../src/clinic/PatientDocuments.tsx) |
| POST `/pazienti/dettaglio` | [src/clinic/PatientForm.tsx](../src/clinic/PatientForm.tsx) |
| POST `/pazienti/salva` | [src/clinic/PatientForm.tsx](../src/clinic/PatientForm.tsx) |
| POST `/pazienti/cerca` | [src/clinic/PatientsPage.tsx](../src/clinic/PatientsPage.tsx) |
| POST `/pianificazione/proponi` | [src/clinic/PlanningPage.tsx](../src/clinic/PlanningPage.tsx) |
| POST `/pianificazione/proposta` | [src/clinic/PlanningPage.tsx](../src/clinic/PlanningPage.tsx) |
| POST `/pianificazione/scarta` | [src/clinic/PlanningPage.tsx](../src/clinic/PlanningPage.tsx) |
| POST `/account/due-passi/avvia` | [src/clinic/ProfilePage.tsx](../src/clinic/ProfilePage.tsx) |
| POST `/account/due-passi/conferma` | [src/clinic/ProfilePage.tsx](../src/clinic/ProfilePage.tsx) |
| POST `/account/due-passi/disattiva` | [src/clinic/ProfilePage.tsx](../src/clinic/ProfilePage.tsx) |
| POST `/account/password` | [src/clinic/ProfilePage.tsx](../src/clinic/ProfilePage.tsx) |
| POST `/account/salva` | [src/clinic/ProfilePage.tsx](../src/clinic/ProfilePage.tsx) |
| POST `/pianificazione/approva` | [src/clinic/ProposalSelection.tsx](../src/clinic/ProposalSelection.tsx) |
| POST `/prenota/catalogo` | [src/clinic/PublicBooking.tsx](../src/clinic/PublicBooking.tsx) |
| POST `/prenota/conferma` | [src/clinic/PublicBooking.tsx](../src/clinic/PublicBooking.tsx) |
| POST `/prenota/richiedi` | [src/clinic/PublicBooking.tsx](../src/clinic/PublicBooking.tsx) |
| POST `/prenota/slot` | [src/clinic/PublicBooking.tsx](../src/clinic/PublicBooking.tsx) |
| POST `/prenota/disdetta` | [src/clinic/PublicPortal.tsx](../src/clinic/PublicPortal.tsx) |
| POST `/prenota/portale` | [src/clinic/PublicPortal.tsx](../src/clinic/PublicPortal.tsx) |
| POST `/prenota/portale-documento` | [src/clinic/PublicPortal.tsx](../src/clinic/PublicPortal.tsx) |
| POST `/prenota/portale-login` | [src/clinic/PublicPortal.tsx](../src/clinic/PublicPortal.tsx) |
| POST `/prenota/portale-otp` | [src/clinic/PublicPortal.tsx](../src/clinic/PublicPortal.tsx) |
| POST `/firma/accetta` | [src/clinic/PublicSignature.tsx](../src/clinic/PublicSignature.tsx) |
| POST `/firma/otp` | [src/clinic/PublicSignature.tsx](../src/clinic/PublicSignature.tsx) |
| POST `/firma/pubblico` | [src/clinic/PublicSignature.tsx](../src/clinic/PublicSignature.tsx) |
| POST `/pubblico/conferma-visita` | [src/clinic/PublicVisitConfirmation.tsx](../src/clinic/PublicVisitConfirmation.tsx) |
| POST `/importazione/acquisto-anteprima` | [src/clinic/PurchaseImport.tsx](../src/clinic/PurchaseImport.tsx) |
| POST `/importazione/acquisto-applica` | [src/clinic/PurchaseImport.tsx](../src/clinic/PurchaseImport.tsx) |
| POST `/pacchetti/approva` | [src/clinic/ReviewExportsPage.tsx](../src/clinic/ReviewExportsPage.tsx) |
| POST `/pacchetti/elenco` | [src/clinic/ReviewExportsPage.tsx](../src/clinic/ReviewExportsPage.tsx) |
| POST `/pacchetti/esitoSts` | [src/clinic/ReviewExportsPage.tsx](../src/clinic/ReviewExportsPage.tsx) |
| POST `/pacchetti/prepara` | [src/clinic/ReviewExportsPage.tsx](../src/clinic/ReviewExportsPage.tsx) |
| POST `/pacchetti/scarica` | [src/clinic/ReviewExportsPage.tsx](../src/clinic/ReviewExportsPage.tsx) |
| POST `/impostazioni/leggi` | [src/clinic/SettingsPage.tsx](../src/clinic/SettingsPage.tsx) |
| POST `/impostazioni/salva` | [src/clinic/SettingsPage.tsx](../src/clinic/SettingsPage.tsx) |
| POST `/impostazioni/salva` | [src/clinic/SettingsPeople.tsx](../src/clinic/SettingsPeople.tsx) |
| POST `/utenti/elenco` | [src/clinic/SettingsPeople.tsx](../src/clinic/SettingsPeople.tsx) |
| POST `/gestione/allegato` | [src/clinic/StaffPage.tsx](../src/clinic/StaffPage.tsx) |
| POST `/gestione/contratto` | [src/clinic/StaffPage.tsx](../src/clinic/StaffPage.tsx) |
| POST `/gestione/personale` | [src/clinic/StaffPage.tsx](../src/clinic/StaffPage.tsx) |
| POST `/gestione/personale-csv` | [src/clinic/StaffPage.tsx](../src/clinic/StaffPage.tsx) |
| POST `/gestione/presenza` | [src/clinic/StaffPage.tsx](../src/clinic/StaffPage.tsx) |
| POST `/agenda/statistiche` | [src/clinic/StatsPage.tsx](../src/clinic/StatsPage.tsx) |
| POST `/gestione/articolo` | [src/clinic/StockPage.tsx](../src/clinic/StockPage.tsx) |
| POST `/gestione/fornitore` | [src/clinic/StockPage.tsx](../src/clinic/StockPage.tsx) |
| POST `/gestione/movimento` | [src/clinic/StockPage.tsx](../src/clinic/StockPage.tsx) |
| POST `/gestione/stock` | [src/clinic/StockPage.tsx](../src/clinic/StockPage.tsx) |
| POST `/gestione/stock` | [src/clinic/TherapyConsumption.tsx](../src/clinic/TherapyConsumption.tsx) |
| POST `/formazione/elenco` | [src/clinic/TrainingPage.tsx](../src/clinic/TrainingPage.tsx) |
| POST `/formazione/elimina` | [src/clinic/TrainingPage.tsx](../src/clinic/TrainingPage.tsx) |
| POST `/formazione/salva` | [src/clinic/TrainingPage.tsx](../src/clinic/TrainingPage.tsx) |
| POST `/pazienti/cerca` | [src/clinic/WaitlistForm.tsx](../src/clinic/WaitlistForm.tsx) |
| POST `/prenotazioni/attesa-salva` | [src/clinic/WaitlistForm.tsx](../src/clinic/WaitlistForm.tsx) |
