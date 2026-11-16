/* Testi per i link ricevuti via email (verifica account, nuova password) non più validi. */
export const LINK_ERRORS: Record<string, { title: string; body: string }> = {
  link_scaduto: {
    title: "Il link è scaduto",
    body: "Richiedine uno nuovo."
  },
  link_usato: {
    title: "Link già usato",
    body: "Se hai già completato il passaggio, puoi accedere."
  },
};

export const fallbackLinkError = { title: "Link non valido", body: "Controlla di aver aperto il link completo ricevuto via email." };
