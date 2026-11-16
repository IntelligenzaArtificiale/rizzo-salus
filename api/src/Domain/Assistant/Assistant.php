<?php
declare(strict_types=1);

namespace App\Domain\Assistant;

use App\Core\ApiError;
use App\Core\Clock;
use App\Domain\Agenda\Appointments;
use App\Http\Context;

/**
 * Assistente a domande libere sui dati della struttura.
 * - Il contesto lo costruisce il server con i soli dati che il ruolo può vedere (agenda propria o di tutti, economia propria o di tutti).
 * - Verso OpenAI non partono mai nomi, telefoni, email, codici fiscali né dati clinici: i pazienti diventano P1, P2… e la
 *   risposta viene ricomposta qui con i nomi veri. Anche i nomi scritti nella domanda vengono sostituiti prima dell'invio.
 */
final class Assistant
{
    private const MAX_Q = 600;

    /** @param list<array{role:string,text:string}> $history */
    public function ask(Context $c, string $question, array $history = []): array
    {
        $question = trim($question);
        if ($question === '' || mb_strlen($question) > self::MAX_Q) {
            throw new ApiError('domanda_non_valida', 422);
        }
        $svc = $c->svc;
        [$ctx, $alias] = $this->context($c);
        $mask = static function (string $t) use ($alias): string {
            foreach ($alias as $code => $names) {
                foreach ($names as $n) {
                    $t = preg_replace('/\b' . preg_quote($n, '/') . '\b/iu', $code, $t) ?? $t;
                }
            }
            $t = preg_replace('/\+?\d[\d\s]{7,}\d/', '[numero]', $t) ?? $t;
            $t = preg_replace('/[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]/i', '[cf]', $t) ?? $t;
            return preg_replace('/\S+@\S+\.\S+/', '[email]', $t) ?? $t;
        };
        $hist = '';
        foreach (array_slice($history, -6) as $h) {
            $hist .= (($h['role'] ?? '') === 'user' ? 'Utente: ' : 'Assistente: ') . $mask(mb_substr((string) ($h['text'] ?? ''), 0, 800)) . "\n";
        }
        $system = "Sei l'assistente del gestionale di un poliambulatorio di fisioterapia e medicina. Rispondi in italiano, breve e concreto, "
            . "usando SOLO i dati forniti nel contesto. Se un dato non c'è, dillo chiaramente e non inventare. I pazienti sono indicati con codici "
            . "(P1, P2…): usa sempre i codici, mai inventare nomi. Importi in euro con la virgola. Non dare consigli clinici o diagnosi. "
            . "Se ti chiedono qualcosa fuori dai dati della struttura, rispondi che puoi aiutare solo su agenda, pazienti, percorsi, messaggi e numeri della struttura. "
            . "Puoi usare elenchi puntati brevi.";
        $user = "Oggi è " . Clock::today() . " (" . ['', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'][Clock::dow(Clock::today())] . ").\n"
            . "Ruolo di chi chiede: " . $c->role() . ".\n\nCONTESTO (dati visibili a questo ruolo):\n" . $ctx
            . ($hist !== '' ? "\nCONVERSAZIONE PRECEDENTE:\n" . $hist : '') . "\nDOMANDA: " . $mask($question);
        $res = $svc->ai()->complete('assistente', $system, $user);
        $text = $res['testo'];
        // ricompone i nomi veri, solo localmente
        $text = preg_replace_callback('/\bP(\d+)\b/', static fn ($m) => isset($alias['P' . $m[1]]) ? $alias['P' . $m[1]][0] : $m[0], $text) ?? $text;
        $svc->audit()->log('assistente.domanda', 'ai_usage', null, null, ['caratteri' => mb_strlen($question)]);
        return ['risposta' => $text, 'inviato_al_fornitore' => $user];
    }

    /** @return array{0:string,1:array<string,list<string>>} */
    private function context(Context $c): array
    {
        $svc = $c->svc;
        $s = $svc->store;
        $all = $c->can('agenda.vedi_tutto');
        $mine = $c->user['professional_id'] ?? null;
        if (!$all && !$c->can('agenda.vedi_propria')) {
            return ["Nessun dato di agenda visibile per questo ruolo.\n", []];
        }
        $pros = [];
        foreach ($s->all('professionals') as $p) {
            $pros[$p['id']] = trim($p['nome'] . ' ' . $p['cognome']) . ' (' . $p['tipo'] . ')';
        }
        $types = [];
        foreach ($s->all('therapy_types') as $t) {
            $types[$t['id']] = $t['nome'];
        }
        $alias = [];
        $code = [];
        $pc = static function (string $pid) use (&$alias, &$code, $s): string {
            if (!isset($code[$pid])) {
                $p = $s->get('patients', $pid) ?? ['nome' => '?', 'cognome' => '?'];
                $k = 'P' . (count($code) + 1);
                $code[$pid] = $k;
                $alias[$k] = [trim($p['cognome'] . ' ' . $p['nome']), trim($p['nome'] . ' ' . $p['cognome']), (string) $p['cognome']];
            }
            return $code[$pid];
        };
        $from = Clock::addDays(Clock::today(), -14);
        $to = Clock::addDays(Clock::today(), 21);
        $out = "Professionisti: " . implode('; ', $pros) . "\n";
        $out .= "Orari di apertura (1=lun…7=dom): " . json_encode($svc->settings()->get('orari'), JSON_UNESCAPED_UNICODE) . "\n\n";
        $out .= "AGENDA dal $from al $to" . ($all ? ' (tutti i professionisti)' : ' (solo il proprio professionista)') . ":\n";
        $n = 0;
        foreach ($svc->appointments()->between($from, Clock::addDays($to, 1), true) as $a) {
            if (!$all && ($a['professional_id'] ?? null) !== $mine) {
                continue;
            }
            $who = array_map(static fn ($r) => $pc($r['patient_id']) . ($r['stato'] !== $a['stato'] ? '[' . $r['stato'] . ']' : ''), Appointments::refs($a));
            $out .= substr($a['start'], 0, 16) . '-' . substr((string) ($a['end'] ?? ''), 11, 5) . ' | ' . ($pros[$a['professional_id'] ?? ''] ?? '-') . ' | '
                . ($a['tipo'] === 'nota' ? 'nota' : ($types[$a['therapy_type_id'] ?? ''] ?? $a['tipo'])) . ' | ' . (implode(',', $who) ?: '-') . ' | ' . $a['stato'] . "\n";
            if (++$n >= 400) {
                $out .= "(elenco troncato)\n";
                break;
            }
        }
        $out .= "\nPERCORSI APERTI (avanzamento sedute):\n";
        foreach ($s->all('episodes', static fn ($e) => ($e['stato'] ?? '') === 'aperto') as $e) {
            $lines = [];
            foreach ($e['therapies'] ?? [] as $l) {
                if (!$all && ($l['professional_preferito_id'] ?? null) !== $mine) {
                    continue;
                }
                $lines[] = ($types[$l['therapy_type_id']] ?? '?') . ' previste ' . $l['sedute_previste'];
            }
            if ($lines) {
                $prog = $svc->episodes()->progress($e);
                $p = array_map(static fn ($x) => ($types[$x['therapy_type_id']] ?? '?') . ": {$x['eseguite']} fatte, {$x['programmate']} in agenda, {$x['residue']} da pianificare", $prog);
                $out .= $pc($e['patient_id']) . ' | ' . implode('; ', $p) . "\n";
            }
        }
        if ($c->can('statistiche.economiche') || $c->can('statistiche.economiche_proprie')) {
            $only = $c->can('statistiche.economiche') ? null : $mine;
            $m0 = substr(Clock::today(), 0, 8) . '01';
            $st = $svc->billingStats()->compare($m0, Clock::today(), $only);
            $e = static fn ($x) => number_format($x / 100, 2, ',', '.') . ' €';
            $cur = $st['periodo'];
            $out .= "\nECONOMIA mese corrente" . ($only ? ' (solo le proprie prestazioni)' : '') . ": fatturato " . $e($cur['fatturato_cents']) . ", incassato " . $e($cur['incassato_cents'])
                . ", prestazioni eseguite {$cur['prestazioni']}, nuovi pazienti {$cur['nuovi_pazienti']}. Stesso periodo precedente: fatturato " . $e($st['precedente']['fatturato_cents']) . ".\n";
            if ($cur['per_terapia']) {
                $out .= "Fatturato per terapia: " . implode('; ', array_map(static fn ($r) => $r['nome'] . ' ' . $e($r['cents']), $cur['per_terapia'])) . "\n";
            }
        }
        if ($c->can('fatture.gestisci')) {
            $open = $s->all('invoices', static fn ($i) => $i['tipo'] === 'fattura' && $i['stato'] === 'emessa');
            $out .= "Fatture emesse non ancora incassate: " . count($open) . "\n";
        }
        if ($c->can('messaggi.invia')) {
            $cnt = [];
            foreach ($s->all('messages', null, $s->partsBetween('messages', Clock::addDays(Clock::today(), -31), Clock::today())) as $m) {
                $cnt[$m['status']] = ($cnt[$m['status']] ?? 0) + 1;
            }
            $out .= "Messaggi ultimi 30 giorni per stato: " . json_encode($cnt) . " (modalità " . $svc->settings()->get('messaggi.modalita') . ")\n";
        }
        return [$out, $alias];
    }
}
