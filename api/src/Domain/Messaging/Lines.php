<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

use App\Core\Clock;
use App\Store\Store;

/** Frasi leggibili per i pazienti: «lunedì 16/11 alle 10:00 — Terapia manuale». Niente dati clinici. */
final class Lines
{
    private const DAYS = ['', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
    private array $types = [];

    public function __construct(private readonly Store $store)
    {
    }

    public static function dayName(string $date): string
    {
        return self::DAYS[Clock::dow($date)];
    }

    public static function when(string $stamp): string
    {
        return self::dayName(substr($stamp, 0, 10)) . ' ' . substr($stamp, 8, 2) . '/' . substr($stamp, 5, 2) . ' alle ' . substr($stamp, 11, 5);
    }

    public function typeName(array $a): string
    {
        $id = $a['therapy_type_id'] ?? null;
        if ($id === null) {
            return 'Appuntamento';
        }
        return $this->types[$id] ??= ($this->store->get('therapy_types', $id, false)['nome'] ?? 'Appuntamento');
    }

    public function line(array $a): string
    {
        return self::when($a['start']) . ' — ' . $this->typeName($a);
    }

    /** «Lunedì 10:00 Tecarterapia, 10:15 Terapia manuale» raggruppato per giorno. @param list<array> $appointments */
    public function byDay(array $appointments): string
    {
        usort($appointments, static fn ($x, $y) => strcmp($x['start'], $y['start']));
        $days = [];
        foreach ($appointments as $a) {
            $days[substr($a['start'], 0, 10)][] = substr($a['start'], 11, 5) . ' ' . $this->typeName($a);
        }
        $out = [];
        foreach ($days as $d => $items) {
            $out[] = ucfirst(self::dayName($d)) . ' ' . substr($d, 8, 2) . '/' . substr($d, 5, 2) . ': ' . implode(', ', $items);
        }
        return implode("\n", $out);
    }

    /** «3 appuntamenti: lun 10:00, mer 11:15, ven 09:00» */
    public function summary(array $appointments): string
    {
        usort($appointments, static fn ($x, $y) => strcmp($x['start'], $y['start']));
        $short = ['', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
        $parts = array_map(static fn ($a) => $short[Clock::dow(substr($a['start'], 0, 10))] . ' ' . substr($a['start'], 11, 5), $appointments);
        $n = count($appointments);
        return $n . ($n === 1 ? ' appuntamento: ' : ' appuntamenti: ') . implode(', ', array_slice($parts, 0, 8)) . (count($parts) > 8 ? '…' : '');
    }
}
