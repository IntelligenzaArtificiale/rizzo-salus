<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

use App\Core\Clock;
use App\Domain\Agenda\Appointments;
use App\Store\Store;

/**
 * Ricorda che cosa è già stato comunicato a ciascun paziente per ciascun appuntamento (orario, terapista, stato).
 * Serve a non avvisare di un cambio che riporta allo stato già comunicato.
 */
final class Notified
{
    public function __construct(private readonly Store $store)
    {
    }

    public function get(string $appointmentId, string $patientId): ?array
    {
        foreach ($this->store->all('notified', static fn ($n) => $n['appointment_id'] === $appointmentId && $n['patient_id'] === $patientId) as $n) {
            return $n;
        }
        return null;
    }

    /** Registra lo stato attuale dell'appuntamento come «comunicato». */
    public function mark(array $appointment, string $patientId, string $via): array
    {
        $state = ['start' => $appointment['start'], 'professional_id' => $appointment['professional_id'] ?? null, 'annullato' => $appointment['stato'] === 'annullato'];
        return $this->store->transaction(function () use ($appointment, $patientId, $via, $state) {
            $cur = $this->get($appointment['id'], $patientId);
            $rec = ['appointment_id' => $appointment['id'], 'patient_id' => $patientId, 'stato' => $state, 'at' => Clock::stamp(), 'via' => $via, 'data' => substr($appointment['start'], 0, 10)];
            return $cur ? $this->store->put('notified', array_replace($cur, $rec)) : $this->store->put('notified', $rec);
        });
    }

    /** Nello stesso stato già comunicato? */
    public static function same(array $note, array $appointment): bool
    {
        $s = $note['stato'];
        return $s['start'] === $appointment['start'] && $s['professional_id'] === ($appointment['professional_id'] ?? null) && $s['annullato'] === ($appointment['stato'] === 'annullato');
    }

    /** Elimina le tracce di appuntamenti passati da più di 60 giorni. */
    public function sweep(): int
    {
        $limit = Clock::addDays(Clock::today(), -60);
        $n = 0;
        $this->store->transaction(function () use ($limit, &$n) {
            foreach ($this->store->all('notified', static fn ($x) => $x['data'] < $limit) as $x) {
                $this->store->purge('notified', $x['id']);
                $n++;
            }
        });
        return $n;
    }

    /** @return list<array{patient_id:string,episode_id:?string}> persone che occupano l'appuntamento */
    public static function people(array $a): array
    {
        return array_map(static fn ($r) => ['patient_id' => $r['patient_id'], 'episode_id' => $r['episode_id']], array_filter(Appointments::refs($a), static fn ($r) => $r['stato'] !== 'assente'));
    }
}
