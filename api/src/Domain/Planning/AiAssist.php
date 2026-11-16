<?php
declare(strict_types=1);

namespace App\Domain\Planning;

use App\Core\ApiError;
use App\Core\Clock;
use App\Domain\Agenda\AgendaStats;
use App\Domain\Calendar\Hours;
use App\Store\Store;

/**
 * Le tre cose per cui si usa l'AI, tutte con un'alternativa che funziona senza:
 *  1. capire la disponibilità scritta a parole (prima le regole fisse);
 *  2. spiegare una proposta del pianificatore (il testo base è già costruito dai dati);
 *  3. il riepilogo del mattino (numeri veri, l'AI rifinisce soltanto la forma).
 * All'AI non vanno mai nomi, telefoni o dati clinici: solo testo libero della disponibilità e numeri aggregati.
 */
final class AiAssist
{
    private const MOTIVI = [
        'fascia_preferita' => 'dentro la fascia che il paziente preferisce',
        'fascia_indicata' => 'dentro una fascia indicata dal paziente',
        'fascia_meno_gradita' => 'in una fascia meno gradita, ma l’unica libera',
        'terapista_del_percorso' => 'con il terapista del percorso',
        'altro_terapista' => 'con un altro terapista perché quello del percorso non era libero',
        'seduta_contigua' => 'attaccata a un’altra seduta dello stesso giorno',
        'ha_richiesto_spostamenti' => 'spostando altri appuntamenti dentro le loro fasce',
    ];
    private const NO_PLAN = [
        'nessuna_fascia_compatibile' => 'nessuna fascia del paziente cade in un giorno e in un orario in cui la struttura e un terapista sono aperti',
        'agenda_piena' => 'le fasce ci sono ma l’agenda è già piena e non si può liberare posto senza toccare sedute già fatte o vincoli del paziente',
        'tempo_scaduto' => 'il tempo massimo per cercare una soluzione è finito',
    ];

    public function __construct(
        private readonly Store $store,
        private readonly AiClient $ai,
        private readonly AvailabilityParser $parser,
        private readonly AgendaStats $stats,
        private readonly Hours $hours,
    ) {
    }

    /** @return array{fasce:list<array>,non_capito:list<string>,origine:string} */
    public function availability(string $text): array
    {
        $text = mb_substr(trim($text), 0, 600);
        if ($text === '') {
            throw new ApiError('testo_mancante', 422, ['campo' => 'testo']);
        }
        $r = $this->parser->parse($text);
        if ($r['fasce'] !== [] || !$this->ai->enabled()) {
            return $r;
        }
        try {
            $out = $this->ai->complete('disponibilita', 'Trasformi la disponibilità di un paziente scritta in italiano in fasce settimanali. Rispondi solo con JSON: {"fasce":[{"giorno":1-7 (1=lunedì),"da":"HH:MM","a":"HH:MM"}]}. Non inventare giorni non detti. Se non capisci, fasce vuote.', $text, true);
        } catch (ApiError $e) {
            return $r;   // l'AI è un aiuto: se non risponde si resta con ciò che hanno capito le regole
        }
        $fasce = [];
        foreach ((array) ($out['json']['fasce'] ?? []) as $f) {
            $f = (array) $f;
            $g = (int) ($f['giorno'] ?? 0);
            $da = (string) ($f['da'] ?? '');
            $a = (string) ($f['a'] ?? '');
            if ($g >= 1 && $g <= 7 && preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $da) && preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $a) && $da < $a) {
                $fasce[] = ['giorno' => $g, 'da' => $da, 'a' => $a, 'preferenza' => 'media'];
            }
        }
        return ['fasce' => $fasce, 'non_capito' => $r['non_capito'], 'origine' => 'ai'];
    }

    /** Testo per la segreteria: cosa propone il pianificatore e perché. @return array{testo:string,righe:list<string>} */
    public function explain(array $proposal): array
    {
        $rows = [];
        foreach ($proposal['nuove'] as $n) {
            $p = $this->store->get('patients', $n['patient_id'], false);
            $who = $p ? $p['cognome'] . ' ' . $p['nome'] : 'Paziente';
            $why = implode(', ', array_map(static fn ($m) => self::MOTIVI[$m] ?? $m, $n['motivi']));
            $rows[] = sprintf('%s: %s alle %s — %s.', $who, self::dateIt(substr($n['start'], 0, 10)), substr($n['start'], 11, 5), $why);
        }
        foreach ($proposal['spostamenti'] as $m) {
            $p = $this->store->get('patients', $m['paziente_id'], false);
            $rows[] = sprintf('Da spostare: %s, da %s alle %s a %s alle %s (resta nelle sue fasce).', $p ? $p['cognome'] . ' ' . $p['nome'] : 'Paziente',
                self::dateIt(substr($m['da'], 0, 10)), substr($m['da'], 11, 5), self::dateIt(substr($m['a'], 0, 10)), substr($m['a'], 11, 5));
        }
        foreach ($proposal['non_pianificate'] as $u) {
            $p = $this->store->get('patients', $u['patient_id'], false);
            $rows[] = sprintf('Non pianificabili %d sedute di %s: %s.', $u['mancanti'], $p ? $p['cognome'] . ' ' . $p['nome'] : 'Paziente', self::NO_PLAN[$u['motivo']] ?? $u['motivo']);
        }
        $r = $proposal['riepilogo'];
        $head = sprintf('Proposta: %d sedute nuove, %d spostamenti, %d sedute non pianificabili.', $r['sedute_nuove'], $r['spostamenti'], $r['non_pianificate']);
        return ['testo' => $head, 'righe' => $rows];
    }

    /** Riepilogo del giorno, salvato una sola volta per giorno. @return array<string,mixed> */
    public function dailySummary(string $date, bool $force = false): array
    {
        $existing = $this->store->all('notifications', static fn ($n) => ($n['tipo'] ?? '') === 'riepilogo_giornaliero' && ($n['giorno'] ?? '') === $date);
        if ($existing !== [] && !$force) {
            return $existing[0];
        }
        $st = $this->stats->period($date, $date);
        $t = $st['totali'];
        $free = [];
        foreach ($st['professionisti'] as $p) {
            $left = $p['minuti_disponibili'] - $p['minuti_occupati'];
            if ($left >= 30) {
                $free[] = ['nome' => $p['nome'], 'minuti_liberi' => $left];
            }
        }
        $absent = [];
        foreach ($this->store->all('professionals') as $p) {
            if (($p['attivo'] ?? true) !== false && ($r = $this->hours->absenceReason($p, $date)) !== null) {
                $absent[] = trim($p['nome'] . ' ' . $p['cognome']) . ' (' . $r . ')';
            }
        }
        $closed = $this->hours->closedReason($date) ?? ($this->hours->structureWindows($date) === [] ? 'giorno di chiusura settimanale' : null);
        $lines = [];
        if ($closed !== null) {
            $lines[] = 'Oggi la struttura è chiusa (' . $closed . ').';
        } else {
            $lines[] = sprintf('Oggi %d appuntamenti in agenda, saturazione %s%%.', $t['programmati'], $t['saturazione'] === null ? '0' : number_format((float) $t['saturazione'], 0));
            if ($absent !== []) {
                $lines[] = 'Assenti: ' . implode(', ', $absent) . '.';
            }
            foreach ($free as $f) {
                $lines[] = sprintf('%s ha circa %d minuti liberi.', $f['nome'], $f['minuti_liberi']);
            }
        }
        $base = implode(' ', $lines);
        $text = $base;
        if ($closed === null && $this->ai->enabled()) {
            try {
                $out = $this->ai->complete('riepilogo', 'Riscrivi in due o tre frasi cordiali, in italiano, per la segreteria di un poliambulatorio. Usa solo i fatti dati, non aggiungere nulla.', $base);
                $text = trim($out['testo']) !== '' ? trim($out['testo']) : $base;
            } catch (ApiError) {
                $text = $base;
            }
        }
        $rec = ['tipo' => 'riepilogo_giornaliero', 'giorno' => $date, 'testo' => $text, 'dati' => ['programmati' => $t['programmati'], 'saturazione' => $t['saturazione'], 'liberi' => $free, 'assenti' => $absent], 'letta' => false];
        return $this->store->transaction(fn () => $existing !== [] ? $this->store->put('notifications', array_replace($existing[0], $rec)) : $this->store->put('notifications', $rec));
    }

    private static function dateIt(string $d): string
    {
        $days = ['', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
        return $days[Clock::dow($d)] . ' ' . substr($d, 8, 2) . '/' . substr($d, 5, 2);
    }
}
