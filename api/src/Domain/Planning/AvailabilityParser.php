<?php
declare(strict_types=1);

namespace App\Domain\Planning;

/**
 * Legge la disponibilità scritta a parole («lunedì e mercoledì mattina, venerdì dopo le 16») e la trasforma in fasce.
 * Funziona con regole fisse, senza AI: l'AI entra solo se le regole non capiscono nulla. Il risultato va sempre mostrato e confermato da una persona.
 */
final class AvailabilityParser
{
    private const DAYS = ['lun' => 1, 'mar' => 2, 'mer' => 3, 'gio' => 4, 'ven' => 5, 'sab' => 6, 'dom' => 7];
    private const PARTS = ['mattina' => ['08:00', '13:00'], 'mattino' => ['08:00', '13:00'], 'pomeriggio' => ['14:00', '19:00'], 'sera' => ['17:00', '20:00'], 'pranzo' => ['12:00', '14:00']];

    /** @return array{fasce:list<array<string,mixed>>,non_capito:list<string>,origine:string} */
    public function parse(string $text): array
    {
        $t = mb_strtolower(trim($text));
        $t = strtr($t, ['à' => 'a', 'è' => 'e', 'é' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u']);
        $t = preg_replace('/\s+/', ' ', $t) ?? '';
        if ($t === '') {
            return ['fasce' => [], 'non_capito' => [], 'origine' => 'regole'];
        }
        $slots = [];
        $unknown = [];
        $clauses = preg_split('/\s*[;,]\s*|\s+oppure\s+|\s+ma\s+/', $t) ?: [];
        $carryTime = null;
        $pending = [];   // clausole con soli giorni: prendono l'orario della clausola successiva
        foreach ($clauses as $clause) {
            if ($clause === '') {
                continue;
            }
            $excluded = $this->days($this->afterNegation($clause));
            $days = $this->days($this->beforeNegation($clause));
            if (preg_match('/\b(tutti i giorni|ogni giorno)\b/', $clause)) {
                $days = [1, 2, 3, 4, 5, 6];
            } elseif (preg_match('/\b(feriali|in settimana|durante la settimana)\b/', $clause)) {
                $days = [1, 2, 3, 4, 5];
            }
            $time = $this->time($clause);
            if ($days === [] && $time !== null && $pending !== []) {
                foreach ($pending as $d) {
                    $slots[] = [$d, $time];
                }
                $pending = [];
                continue;
            }
            if ($days === [] && $time === null) {
                if (!preg_match('/^(posso|sono|disponibile|vengo|preferisco|di|il|la|nel|solo|anche|se|possibile|vorrei)\b/', $clause) || $this->hasDigits($clause)) {
                    $unknown[] = $clause;
                }
                continue;
            }
            if ($days === []) {
                $unknown[] = $clause;
                continue;
            }
            if ($time === null) {
                $pending = array_merge($pending, $days);
                continue;
            }
            foreach ($days as $d) {
                $slots[] = [$d, $time];
            }
            $carryTime = $time;
            unset($excluded);
        }
        foreach ($pending as $d) {
            $slots[] = [$d, ['08:00', '19:00']];
        }
        // «tranne il giovedì» / «non il martedì» valgono per tutta la frase
        $all = $this->excludedAnywhere($t);
        $fasce = [];
        foreach ($slots as [$d, [$a, $b]]) {
            if (in_array($d, $all, true)) {
                continue;
            }
            $fasce[] = ['giorno' => $d, 'da' => $a, 'a' => $b, 'preferenza' => 'media'];
        }
        usort($fasce, static fn ($x, $y) => [$x['giorno'], $x['da']] <=> [$y['giorno'], $y['da']]);
        $fasce = array_values(array_unique($fasce, SORT_REGULAR));
        return ['fasce' => $fasce, 'non_capito' => array_values(array_unique($unknown)), 'origine' => 'regole'];
    }

    /** @return list<int> */
    private function days(string $s): array
    {
        $out = [];
        if (preg_match_all('/\b(lun|mar|mer|gio|ven|sab|dom)(?:edi|tedi|coledi|vedi|erdi|ato|enica)?\b/', $s, $m)) {
            foreach ($m[1] as $k) {
                $out[] = self::DAYS[$k];
            }
        }
        return array_values(array_unique($out));
    }

    private function negationPos(string $s): ?int
    {
        return preg_match('/\b(tranne|escluso|eccetto|non|meno)\b/', $s, $m, PREG_OFFSET_CAPTURE) ? $m[0][1] : null;
    }

    private function beforeNegation(string $s): string
    {
        $p = $this->negationPos($s);
        return $p === null ? $s : substr($s, 0, $p);
    }

    private function afterNegation(string $s): string
    {
        $p = $this->negationPos($s);
        return $p === null ? '' : substr($s, $p);
    }

    /** @return list<int> */
    private function excludedAnywhere(string $t): array
    {
        $out = [];
        if (preg_match_all('/\b(?:tranne|escluso|eccetto|non|meno)\b[^;,]*/', $t, $m)) {
            foreach ($m[0] as $frag) {
                $out = array_merge($out, $this->days($frag));
            }
        }
        return $out;
    }

    private function hasDigits(string $s): bool
    {
        return preg_match('/\d/', $s) === 1;
    }

    /** @return array{0:string,1:string}|null */
    private function time(string $s): ?array
    {
        $h = '(\d{1,2})(?:[:.](\d{2}))?';
        if (preg_match("/\\bdalle? $h (?:alle?|a|fino alle?) $h\\b/", $s, $m)) {
            return [$this->hhmm($m[1], $m[2] ?? ''), $this->hhmm($m[3], $m[4] ?? '')];
        }
        if (preg_match("/\\b(?:dopo(?: le)?|dalle?|a partire dalle?) $h\\b/", $s, $m)) {
            $a = $this->hhmm($m[1], $m[2] ?? '');
            return [$a, '20:00'];
        }
        if (preg_match("/\\b(?:prima delle?|entro le?|fino alle?) $h\\b/", $s, $m)) {
            return ['08:00', $this->hhmm($m[1], $m[2] ?? '')];
        }
        foreach (self::PARTS as $word => $range) {
            if (str_contains($s, $word)) {
                return $range;
            }
        }
        return null;
    }

    private function hhmm(string $h, string $m): string
    {
        $hh = min(23, (int) $h);
        $mm = $m === '' ? 0 : min(59, (int) $m);
        return sprintf('%02d:%02d', $hh, $mm);
    }
}
