<?php
declare(strict_types=1);
/** Verifica i contatori dell'assistente senza API esterne o dati della demo. */
require dirname(__DIR__) . '/api/vendor/autoload.php';
use App\Domain\Assistant\AgendaSummary;

$day = '2026-11-16';
$one = static fn ($status, $offset = '') => ['tipo' => 'terapia', 'start' => ($offset ?: $day) . 'T09:00:00', 'stato' => $status, 'patient_id' => 'paz_a', 'episode_id' => null, 'line_id' => null];
$rows = [$one('programmato'), $one('confermato'), $one('eseguito'), $one('assente'), $one('annullato'),
    ['tipo' => 'nota', 'start' => $day . 'T09:00:00', 'stato' => 'programmato'],
    ['tipo' => 'gruppo', 'start' => $day . 'T10:00:00', 'stato' => 'programmato', 'participants' => [
        ['patient_id' => 'paz_b', 'episode_id' => null, 'line_id' => null, 'stato' => 'programmato'],
        ['patient_id' => 'paz_c', 'episode_id' => null, 'line_id' => null, 'stato' => 'assente']]],
    ['tipo' => 'gruppo', 'start' => $day . 'T11:00:00', 'stato' => 'programmato', 'participants' => [
        ['patient_id' => 'paz_d', 'episode_id' => null, 'line_id' => null, 'stato' => 'assente']]],
    $one('programmato', '2026-11-17'), $one('programmato', '2026-11-23')];
$checks = 0;
function ok(bool $v, string $label): void { global $checks; if (!$v) throw new RuntimeException($label); $checks++; echo "PASS $label\n"; }
$r = AgendaSummary::count($rows, $day, $day);
ok($r['appuntamenti_attivi'] === 4, 'appunti esclusi dagli appuntamenti');
ok($r['da_eseguire'] === 3 && $r['eseguiti'] === 1, 'eseguiti distinti da quelli da eseguire');
ok($r['assenti'] === 2 && $r['annullati'] === 1, 'assenti e annullati separati');
ok($r['appunti'] === 1, 'note contate nel campo dedicato');
ok(AgendaSummary::count([], $day, $day)['appuntamenti_attivi'] === 0, 'periodo vuoto');
ok(AgendaSummary::count($rows, '2026-11-16', '2026-11-22')['appuntamenti_attivi'] === 5, 'settimana senza includere la successiva');
ok(AgendaSummary::count($rows, '2026-11-17', '2026-11-17')['appuntamenti_attivi'] === 1, 'domani distinto da oggi');
$text = AgendaSummary::describe($rows, $day);
ok(str_contains($text, 'CONTATORI UFFICIALI AGENDA') && str_contains($text, '"appuntamenti_attivi":4'), 'contatori ufficiali nel contesto');
ok(!str_contains($text, 'paz_a'), 'riepilogo privo di identificativi');
ok(AgendaSummary::count([$one('programmato')], $day, $day)['appuntamenti_attivi'] === 1, 'riepilogo calcolato soltanto dalle righe fornite per il ruolo');
echo "COMPLETATI $checks controlli assistente\n";
