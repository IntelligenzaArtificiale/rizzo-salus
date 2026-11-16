// La panoramica adatta i dati al ruolo; l'autorizzazione resta sempre nel PHP.
export const landingFor = (_can: (permission: string) => boolean) =>
  "/panoramica";
