<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

use App\Core\ApiError;
use App\Store\Store;
use App\Support\Validator as V;

/**
 * Testi dei messaggi. I predefiniti stanno qui; la segreteria li modifica da Impostazioni e la copia salvata vince.
 * Per WhatsApp ogni testo ha anche i dati del template approvato da Meta (nome, lingua, variabili).
 */
final class Templates
{
    public const DEFAULTS = [
        'promemoria_link' => ['nome' => 'Promemoria settimanale (con link)', 'categoria' => 'utility', 'canali' => ['whatsapp', 'sms', 'email'], 'oggetto' => 'I suoi appuntamenti della prossima settimana',
            'testo' => "Buongiorno {nome}, ecco i suoi appuntamenti della prossima settimana presso {struttura}:\n{riassunto}\nTutti i dettagli: {link}\nPer modifiche chiami il {telefono}."],
        'promemoria_testo' => ['nome' => 'Promemoria settimanale (testo completo)', 'categoria' => 'utility', 'canali' => ['whatsapp', 'sms', 'email'], 'oggetto' => 'I suoi appuntamenti della prossima settimana',
            'testo' => "Buongiorno {nome}, i suoi appuntamenti presso {struttura}:\n{elenco_appuntamenti}\nPer modifiche chiami il {telefono}."],
        'variazione' => ['nome' => 'Variazione appuntamenti', 'categoria' => 'utility', 'canali' => ['whatsapp', 'sms', 'email'], 'oggetto' => 'Aggiornamento dei suoi appuntamenti',
            'testo' => "{nome}, abbiamo aggiornato i suoi appuntamenti presso {struttura}:\n{elenco_variazioni}\nPer dubbi chiami il {telefono}."],
        'followup' => ['nome' => 'Follow-up dopo il ciclo', 'categoria' => 'utility', 'canali' => ['whatsapp', 'sms', 'email'], 'oggetto' => 'Come sta?',
            'testo' => "Buongiorno {nome}, come sta dopo il ciclo di terapie? Se serve altro ci scriva o chiami il {telefono}. {struttura}"],
        'recensione' => ['nome' => 'Richiesta di recensione', 'categoria' => 'utility', 'canali' => ['whatsapp', 'sms', 'email'], 'oggetto' => 'Una recensione per noi?',
            'testo' => "{nome}, grazie per aver scelto {struttura}. Se si è trovato bene, ci aiuterebbe lasciare una recensione: {link_recensione}"],
        'scadenza' => ['nome' => 'Scadenza annuale', 'categoria' => 'utility', 'canali' => ['whatsapp', 'sms', 'email'], 'oggetto' => 'Una scadenza in arrivo',
            'testo' => "{nome}, il suo {tipo_scadenza} scade il {data_scadenza}. Per prenotare chiami {struttura} al {telefono}."],
        'attesa' => ['nome' => 'Posto libero dalla lista d’attesa', 'categoria' => 'utility', 'canali' => ['whatsapp', 'sms', 'email'], 'oggetto' => 'Si è liberato un posto',
            'testo' => "{nome}, si è liberato un posto presso {struttura}: {slot}. Risponda SI entro {ore} ore per confermarlo, oppure chiami il {telefono}."],
        'otp' => ['nome' => 'Codice di verifica', 'categoria' => 'authentication', 'canali' => ['whatsapp', 'sms', 'email'], 'oggetto' => 'Il suo codice di verifica',
            'testo' => 'Il suo codice per {struttura} è {codice}. Vale {minuti} minuti. Non lo condivida con nessuno.'],
        'prenotazione' => ['nome' => 'Conferma prenotazione online', 'categoria' => 'utility', 'canali' => ['whatsapp', 'sms', 'email'], 'oggetto' => 'La sua prenotazione',
            'testo' => '{nome}, la sua visita presso {struttura} è {stato}: {slot}. Per modifiche chiami il {telefono}.'],
        'campagna' => ['nome' => 'Campagna (testo libero)', 'categoria' => 'marketing', 'canali' => ['whatsapp', 'sms', 'email'], 'oggetto' => 'Novità da {struttura}',
            'testo' => "Buongiorno {nome}, {struttura} ha una novità per lei.\nPer non ricevere più comunicazioni risponda STOP."],
        'firma_documento' => ['nome' => 'Documento da firmare', 'categoria' => 'utility', 'canali' => ['whatsapp', 'sms', 'email'], 'oggetto' => 'Un documento da firmare',
            'testo' => '{nome}, ha un documento da firmare presso {struttura}: {link}'],
    ];
    /** Messaggi che non si bloccano per il silenzio notturno né per il tetto mensile ordinario. */
    public const ESSENTIAL = ['otp', 'promemoria_link', 'promemoria_testo', 'variazione', 'attesa', 'prenotazione', 'firma_documento'];

    public function __construct(private readonly Store $store)
    {
    }

    /** @return array<string,mixed> */
    public function get(string $key): array
    {
        $def = self::DEFAULTS[$key] ?? throw new ApiError('modello_sconosciuto', 422, ['campo' => 'chiave']);
        foreach ($this->store->all('message_templates', static fn ($t) => $t['chiave'] === $key) as $saved) {
            return array_replace($def, array_intersect_key($saved, $def + ['meta' => 1]), ['chiave' => $key, 'id' => $saved['id'], 'revision' => $saved['revision']]);
        }
        $vars = self::placeholders($def['testo']);
        return $def + ['chiave' => $key, 'meta' => ['nome' => 'poli_' . $key, 'lingua' => 'it', 'variabili' => $vars, 'approvato' => false]];
    }

    /** @return list<array<string,mixed>> */
    public function all(): array
    {
        return array_map(fn ($k) => $this->get($k) + ['variabili' => self::placeholders($this->get($k)['testo'])], array_keys(self::DEFAULTS));
    }

    public function save(array $d): array
    {
        $key = V::str($d, 'chiave', true, 40);
        $def = self::DEFAULTS[$key] ?? throw new ApiError('modello_sconosciuto', 422);
        $text = V::str($d, 'testo', true, 1500);
        $allowed = self::allowedPlaceholders();
        foreach (self::placeholders($text) as $p) {
            if (!in_array($p, $allowed, true)) {
                throw new ApiError('segnaposto_sconosciuto', 422, ['campo' => 'testo', 'segnaposto' => $p]);
            }
        }
        $meta = (array) ($d['meta'] ?? []);
        $rec = ['chiave' => $key, 'testo' => $text, 'oggetto' => V::str($d, 'oggetto', false, 150) ?? $def['oggetto'],
            'meta' => ['nome' => V::str($meta, 'nome', false, 60) ?? 'poli_' . $key, 'lingua' => V::str($meta, 'lingua', false, 5) ?? 'it', 'variabili' => self::placeholders($text), 'approvato' => V::bool($meta, 'approvato')]];
        return $this->store->transaction(function () use ($rec, $key, $d) {
            foreach ($this->store->all('message_templates', static fn ($t) => $t['chiave'] === $key) as $cur) {
                return $this->store->put('message_templates', array_replace($cur, $rec), V::int($d, 'revision'));
            }
            return $this->store->put('message_templates', $rec);
        });
    }

    /** Sostituisce i segnaposto. Se ne resta uno senza valore il messaggio non parte. @param array<string,scalar|null> $vars */
    public static function render(string $text, array $vars): string
    {
        return preg_replace_callback('/\{([a-z_]+)\}/', static function ($m) use ($vars) {
            if (!array_key_exists($m[1], $vars) || $vars[$m[1]] === null || $vars[$m[1]] === '') {
                throw new ApiError('segnaposto_mancante', 422, ['segnaposto' => $m[1]]);
            }
            return (string) $vars[$m[1]];
        }, $text) ?? $text;
    }

    /** @return list<string> */
    public static function placeholders(string $text): array
    {
        preg_match_all('/\{([a-z_]+)\}/', $text, $m);
        return array_values(array_unique($m[1]));
    }

    /** @return list<string> */
    public static function allowedPlaceholders(): array
    {
        return ['nome', 'cognome', 'struttura', 'telefono', 'link', 'riassunto', 'elenco_appuntamenti', 'elenco_variazioni', 'link_recensione', 'tipo_scadenza', 'data_scadenza',
            'slot', 'ore', 'codice', 'minuti', 'stato', 'indirizzo'];
    }
}
