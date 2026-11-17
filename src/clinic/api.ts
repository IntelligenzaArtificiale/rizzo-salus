// Contratti dell'API PHP originale. Nessun fallback a dati simulati.
import { appConfig } from "@/config/app";
export type Data = Record<string, any>;
let csrf = sessionStorage.getItem("rizzo-csrf") || "";
export const setCsrf = (value: string) => {
  csrf = value;
  if (value) sessionStorage.setItem("rizzo-csrf", value);
  else sessionStorage.removeItem("rizzo-csrf");
};
const messages: Record<string, string> = {
  piano_operatore_obsoleto: "I dati sono cambiati. Chiedi all’operatore di preparare una nuova proposta aggiornata.",
  piano_operatore_scaduto: "Il piano è scaduto. Riformula la richiesta per una nuova anteprima.",
  piano_operatore_chiuso: "Questo piano è già stato applicato o scartato.",
  conferma_operatore_richiesta: "Controlla il riepilogo e usa Conferma e applica.",
  azione_ai_non_consentita: "L’operazione richiesta non è disponibile per il tuo ruolo.",

  gruppo_pieno: "Il gruppo supera la capienza consentita per i profili dei partecipanti.",
  limite_neurologici_gruppo: "È ammesso un solo paziente neurologico nello stesso gruppo.",
  vincolo_professionista: "Questa terapia è vincolata al professionista scelto nel percorso.",
  professionista_obbligatorio: "Scegli il professionista prima di attivare il vincolo obbligatorio.",
  risorsa_occupata: "La sala o l’apparecchiatura è già occupata.",
  risorsa_piena: "La capienza contemporanea della risorsa è esaurita.",
  risorsa_non_disponibile: "Una risorsa richiesta è mancante o non attiva.",
  risorsa_ferma: "Una risorsa richiesta è ferma per manutenzione o indisponibilità.",
  professionista_occupato: "Il professionista è già impegnato nello stesso orario.",
  paziente_occupato: "Il paziente ha già un appuntamento nello stesso orario.",
  revisione_vecchia: "I dati sono cambiati. Ricarica prima di salvare.",
  limiti_gruppo_non_validi: "La capienza dei gruppi complessi non può superare quella dei gruppi standard.",
  colore_non_valido: "Inserisci un colore valido nel formato #RRGGBB.",
  consensi_mancanti:
    "Completa privacy e consenso al trattamento con i relativi documenti prima di rilasciare l’agenda.",
  otp_invio_non_riuscito:
    "Il servizio SMS non ha confermato l’invio del codice. Contatta la segreteria o riprova più tardi.",
  otp_non_valido:
    "Codice errato, scaduto o già utilizzato. Richiedi un nuovo codice dopo cinque tentativi.",
  lettura_richiesta:
    "Leggi il documento e conferma la presa visione prima di continuare.",
  slot_non_disponibile:
    "L’orario è stato occupato. Scegli un altro spazio e richiedi un nuovo codice.",
  richiesta_scaduta: "La richiesta è scaduta. Ripeti la verifica del telefono.",
  prenotazioni_non_attive:
    "Le prenotazioni online non sono ancora attive. Contatta la segreteria.",
  dati_non_corrispondenti:
    "I dati non consentono l’accesso. Verifica con la segreteria il recapito e l’anagrafica registrati.",
  sedute_esaurite:
    "Le sedute previste sono già eseguite o programmate. Modifica la prescrizione per estendere il ciclo.",
  scorta_insufficiente:
    "Il movimento supera la giacenza disponibile. Controlla quantità e articolo.",
  presenza_sovrapposta:
    "Esiste già una presenza o un’assenza nello stesso intervallo.",
  presenza_futura:
    "Le presenze effettive non possono essere registrate in anticipo.",
  ricevuta_richiesta:
    "Allega la contabile del pagamento prima di registrare il compenso come liquidato.",
  telefono_non_valido:
    "Inserisci un cellulare valido, preferibilmente con prefisso internazionale.",
  profilo_sts_incompleto:
    "Completa codici Regione, ASL, struttura e codice fiscale del proprietario nel profilo Sistema TS.",
  codice_sts_prestazione_mancante:
    "Configura il codice Sistema TS di ogni prestazione nel listino prima di preparare il tracciato.",
  nessuna_spesa_inviabile:
    "Non ci sono spese pagate e inviabili nel periodo selezionato.",
  sts_non_configurato:
    "Completa credenziali e profilo Sistema TS e attiva il collegamento nelle impostazioni.",
  certificato_sts_scaduto:
    "Aggiorna il certificato pubblico di cifratura del Sistema TS nelle impostazioni.",
  collaudo_sts_richiesto:
    "Prima della produzione completa le prove nell’ambiente del Sistema TS e registrane l’esito nelle impostazioni.",
  aruba_non_configurata:
    "Completa le credenziali Aruba e attiva il collegamento nelle impostazioni.",
  aruba_autenticazione_fallita:
    "Aruba non ha verificato l’accesso. Controlla credenziali, ambiente e abilitazione del servizio.",
  fattura_sanitaria_non_destinata_sdi:
    "Le fatture sanitarie a persone fisiche non vanno inviate allo SdI.",
  invio_gia_preso_in_carico:
    "L’invio è già stato preso in carico o ha esito incerto. Verifica il protocollo prima di ripetere.",
  pacchetto_obsoleto:
    "I documenti sono cambiati dopo la preparazione. Genera un nuovo pacchetto.",
  tetto_ai_raggiunto:
    "Il limite di utilizzo dell’assistente è raggiunto. Il resto del gestionale rimane disponibile.",
  importazione_con_errori:
    "Correggi le righe non valide o duplicate prima di applicare l’importazione.",
  formule_non_ammesse:
    "Il foglio contiene formule. Esporta i valori o un file CSV prima di importare.",
  parametri_fuori_limite: "Un parametro non rientra nei limiti consentiti.",
  credenziali: "Email o password non corrette.",
  non_autorizzato: "Non hai accesso a questa operazione.",
  non_autenticato: "La sessione è scaduta. Accedi di nuovo.",
  csrf: "La sessione è scaduta. Accedi di nuovo.",
  conflitto: "L’orario è già occupato. Scegli un altro spazio.",
  proposta_obsoleta: "L’agenda è cambiata. Genera una nuova proposta.",
  proposta_gia_chiusa: "La proposta è già stata elaborata.",
  password_debole: "Usa almeno 10 caratteri, con lettere e numeri.",
  password_errata: "La password attuale non è corretta.",
  revisione_obsoleta: "I dati sono cambiati. Ricarica prima di salvare.",
  duplicato: "Esiste già un paziente con dati simili.",
  ai_non_configurata: "L’assistente non è ancora disponibile.",
  codice_richiesto: "Inserisci il codice della tua app di autenticazione.",
  codice_errato: "Il codice non è valido. Inserisci quello attuale.",
  bloccato: "L’account è temporaneamente bloccato. Attendi qualche minuto.",
  disabilitato: "L’account è disattivato. Contatta il titolare.",
  struttura_incompleta:
    "Completa i dati della struttura nelle impostazioni prima di emettere la fattura.",
  dati_intestatario_incompleti:
    "Completa l’anagrafica del paziente prima di emettere la fattura.",
  link_scaduto: "Il link non è più valido. Richiedine uno nuovo.",
  troppi_tentativi: "Troppi tentativi. Attendi qualche minuto.",
};
const fieldNames: Record<string, string> = {
  nome: "nome",
  cognome: "cognome",
  codice_fiscale: "codice fiscale",
  partita_iva: "partita IVA",
  partita_iva_non_valida: "partita IVA non valida",
  indirizzo: "indirizzo",
  cap: "CAP",
  citta: "città",
  provincia: "provincia",
  regime_fiscale: "regime fiscale",
  ragione_sociale: "ragione sociale",
  telefono: "telefono",
  email: "email",
  sezionale: "sezionale",
  revision: "versione dei dati",
  cap_non_valido: "CAP non valido",
};
export class ApiError extends Error {
  code: string;
  payload: Data;
  constructor(code: string, payload: Data = {}) {
    const field = fieldNames[payload.campo];
    const missing = Array.isArray(payload.campi)
      ? payload.campi
          .map((k: string) => fieldNames[k] || "dato obbligatorio")
          .join(", ")
      : "";
    const conflicts = code === "conflitto" ? [...new Set((payload.conflitti || []).map((c: Data) => messages[c.codice]).filter(Boolean))].join(" ") : "";
    super(
      (conflicts || messages[code] ||
        (code.includes("duplicat")
          ? "Esiste già un paziente con dati simili."
          : field
            ? `Controlla il campo ${field} e riprova.`
            : "Non è stato possibile completare la richiesta. Controlla i dati e riprova.")) +
        (missing ? " Dati da completare: " + missing + "." : ""),
    );
    this.code = code;
    this.payload = payload;
  }
}
async function request(path: string, body: Data = {}) {
  let r: Response;
  try {
    r = await fetch(appConfig.apiBaseUrl + path, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Connessione non riuscita. Controlla la rete e riprova.");
  }
  if (r.status === 401 && !path.startsWith("/auth/"))
    window.dispatchEvent(new Event("clinic-expired"));
  return r;
}
export async function api<T = Data>(path: string, body: Data = {}): Promise<T> {
  const r = await request(path, body);
  const j = await r.json().catch(() => {
    throw new Error("Risposta non disponibile. Riprova fra poco.");
  });
  if (!j.ok) {
    if (j.error === "csrf") window.dispatchEvent(new Event("clinic-expired"));
    throw new ApiError(j.error, j);
  }
  return j.data;
}
export async function download(path: string, body: Data = {}) {
  const r = await request(path, body);
  if (!r.ok || r.headers.get("Content-Type")?.includes("application/json")) {
    const j = await r.json();
    throw new ApiError(j.error || "download_non_disponibile", j);
  }
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download =
    r.headers.get("Content-Disposition")?.match(/filename="?([^";]+)/)?.[1] ||
    "documento";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadUrl = (path: string, params: Record<string, string>) => appConfig.apiBaseUrl + path + "?" + new URLSearchParams(params);
