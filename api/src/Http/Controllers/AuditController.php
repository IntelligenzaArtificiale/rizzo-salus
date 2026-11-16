<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\ApiError;
use App\Http\Context;
use App\Support\Validator as V;

final class AuditController
{
    public function elenco(Context $c): array
    {
        $b = $c->body();
        $from = V::date($b, 'da') ?? \App\Core\Clock::addDays(\App\Core\Clock::today(), -30);
        $to = V::date($b, 'a') ?? \App\Core\Clock::today();
        $user = V::str($b, 'utente', false, 40);
        $action = V::str($b, 'azione', false, 60);
        $entity = V::str($b, 'entita', false, 40);
        $store = $c->svc->store;
        $parts = $store->partsBetween('audit_log', $from, $to);
        $rows = $store->all('audit_log', static function ($r) use ($from, $to, $user, $action, $entity) {
            $d = substr($r['at'], 0, 10);
            return $d >= $from && $d <= $to && ($user === null || $r['user_id'] === $user) && ($action === null || $r['action'] === $action) && ($entity === null || $r['entity'] === $entity);
        }, $parts);
        usort($rows, static fn ($x, $y) => $y['seq'] <=> $x['seq']);
        $names = [];
        foreach ($store->all('users', null, null, false, true) as $u) {
            $names[$u['id']] = trim($u['nome'] . ' ' . $u['cognome']);
        }
        $page = max(1, (int) ($b['pagina'] ?? 1));
        $size = min(100, max(10, (int) ($b['per_pagina'] ?? 50)));
        $slice = array_slice($rows, ($page - 1) * $size, $size);
        return [
            'totale' => count($rows),
            'righe' => array_map(static fn ($r) => [
                'id' => $r['id'], 'quando' => $r['at'], 'utente' => $names[$r['user_id']] ?? 'Sistema', 'utente_id' => $r['user_id'],
                'azione' => $r['action'], 'entita' => $r['entity'], 'entita_id' => $r['entity_id'], 'prima' => $r['before'], 'dopo' => $r['after'],
            ], $slice),
        ];
    }

    public function verifica(Context $c): array
    {
        return $c->svc->audit()->verify();
    }
}
