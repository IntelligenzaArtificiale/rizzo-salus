# Tema

Tutti i colori, i raggi e le ombre sono token di Beautiful UI (variabili CSS in `src/app/beautifui/foundation.css`). Per un nuovo cliente si cambia solo `src/styles/tema.css`, che viene caricato dopo e li sovrascrive.

## Cosa si cambia di solito

| Token | Ruolo | Note |
|---|---|---|
| `--accent` | Bottoni pieni, checkbox attive, anello di focus | Il testo bianco sopra deve restare almeno 4.5:1 |
| `--accent-ink` | Link e testi in accento | In scuro va più chiaro dell'accento |
| `--accent-tint` | Alone del focus, sfondi tenui | |
| `--red` | Errori su testi e bordi | |
| `--font-inter` | Font del testo | Caricato in `src/styles/fonts.ts`, self-hosted |
| `--page`, `--surface`, `--ink`, `--line` | Fondo, superfici, testo, bordi | Di solito si lasciano quelli di Beautiful UI |

I valori sono in OKLCH, come nell'originale. Per cambiare colore si cambia la tinta (terzo numero) e si tiene una luminosità simile.

## Chiaro e scuro

- La classe `.dark` su `<html>` attiva i valori scuri: è il meccanismo di Beautiful UI.
- `src/lib/theme.ts` sceglie il tema in questo ordine: scelta salvata dal ThemeToggle, attributo `data-theme` della radice, tema del sistema.
- Ogni token cambiato in `:root` va ridefinito anche dentro `.dark`.

## Differenze rispetto ai token originali

| Token | Beautiful UI | Boilerplate | Perché |
|---|---|---|---|
| `--accent` chiaro | `oklch(0.626 0.205 255)` | `oklch(0.55 0.2 256)` | Testo bianco sul bottone da 3.7:1 a 5.2:1 |
| `--accent` scuro | `oklch(0.68 0.173 253)` | `oklch(0.58 0.19 256)` | Testo bianco sul bottone leggibile anche in scuro |
| `--red` chiaro | `oklch(0.621 0.192 23)` | `oklch(0.55 0.2 25)` | Testi d'errore a 5:1 sul bianco |
| `--red` scuro | `oklch(0.666 0.18 21)` | `oklch(0.7 0.17 22)` | Testi d'errore leggibili sul grigio scuro |
| `--green` chiaro | `oklch(0.603 0.155 151)` | `oklch(0.52 0.14 150)` | Testi di conferma a 4.8:1 sul bianco |
| sfondo `body` | tratteggio della galleria | `--page` pieno | Il tratteggio serve solo alla vetrina del sito |

## Aspetto scelto dall'amministratore

Impostazioni › Aspetto salva `settings.aspetto` e `applyAppearance` (`lib/platform/appearance.ts`) mette sulla radice
`data-angoli`, `data-densita`, `data-movimento`, `data-carattere` e, se non è «Automatico», `data-theme`.
Gli stili sono in `src/styles/aspetto.css`. I raggi di Beautiful UI sono compilati come valori fissi
(`@theme inline`), quindi si sostituiscono le classi `rounded-*`; la densità agisce su `.page-shell` e `.density-row`.
La scelta personale del comando tema prevale sul tema iniziale.
