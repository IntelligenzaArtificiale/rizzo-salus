<?php
declare(strict_types=1);

namespace App\Domain\Patients;

use App\Core\ApiError;
use App\Core\Clock;
use App\Http\Context;
use App\Store\Store;
use App\Support\FiscalCode;
use App\Support\Validator as V;

/** Anagrafica pazienti: salvataggio, duplicati, ricerca tollerante, visibilità per ruolo. */
final class Patients
{
    public const CONSENTS = ['privacy', 'trattamento', 'marketing', 'whatsapp', 'sts_opposizione'];
    private const ESSENTIAL = ['id', 'nome', 'cognome', 'data_nascita', 'sesso', 'professionisti', 'revision', 'allergie', 'avvertenze'];
    private const CLINICAL = ['anamnesi'];

    public function __construct(private readonly Store $store)
    {
    }

    /** @return array<string,mixed> */
    public function normalize(array $d, ?array $current = null): array
    {
        $cf = V::str($d, 'codice_fiscale', false, 20);
        if ($cf !== null) {
            $cf = FiscalCode::normalize($cf);
            if (!FiscalCode::isValid($cf)) {
                throw new ApiError('codice_fiscale_non_valido', 422, ['campo' => 'codice_fiscale']);
            }
        }
        $parsed = $cf ? FiscalCode::parse($cf) : null;
        $birth = V::date($d, 'data_nascita') ?? ($parsed['data'] ?? null);
        $sex = V::enum($d, 'sesso', ['M', 'F'], false, $parsed['sesso'] ?? null);
        $consents = $current['consensi'] ?? [];
        foreach (self::CONSENTS as $k) {
            if (isset($d['consensi'][$k])) {
                $in = (array) $d['consensi'][$k];
                $value = V::bool($in, 'valore');
                $prev = $consents[$k] ?? null;
                if ($prev === null || (bool) $prev['valore'] !== $value) {
                    $consents[$k] = [
                        'valore' => $value, 'data' => V::date($in, 'data') ?? Clock::today(), 'versione' => V::str($in, 'versione', false, 20) ?? '1',
                        'modalita' => V::enum($in, 'modalita', ['firma', 'otp', 'verbale', 'modulo_cartaceo', 'online'], false, 'verbale'),
                    ];
                }
            }
        }
        return [
            'nome' => V::str($d, 'nome', true, 80), 'cognome' => V::str($d, 'cognome', true, 80),
            'codice_fiscale' => $cf, 'data_nascita' => $birth, 'luogo_nascita' => V::str($d, 'luogo_nascita', false, 80), 'sesso' => $sex,
            'indirizzo' => V::str($d, 'indirizzo', false, 160), 'cap' => V::str($d, 'cap', false, 5), 'citta' => V::str($d, 'citta', false, 80), 'provincia' => V::str($d, 'provincia', false, 2),
            'telefono' => V::phone($d, 'telefono'), 'email' => V::email($d, 'email'),
            'canale_preferito' => V::enum($d, 'canale_preferito', ['whatsapp', 'sms', 'email', 'nessuno'], false, 'whatsapp'),
            'consensi' => $consents, 'note_amministrative' => V::str($d, 'note_amministrative', false, 2000),
            'tag' => array_values(array_unique(array_filter(array_map(static fn ($t) => mb_substr(trim((string) $t), 0, 40), V::arr($d, 'tag'))))),
            'disponibilita' => Availability::clean((array) ($d['disponibilita'] ?? $current['disponibilita'] ?? [])),
            'medico_specialista' => V::str($d, 'medico_specialista', false, 120) ?? ($current['medico_specialista'] ?? null),
            'assicurazione' => V::enum($d, 'assicurazione', ['nessuna','privata','convenzionata'], false, $current['assicurazione'] ?? 'nessuna'),
            'compagnia' => V::str($d,'compagnia',false,120) ?? ($current['compagnia'] ?? null),
            'polizza' => V::str($d,'polizza',false,100) ?? ($current['polizza'] ?? null),
            'avvertenze' => V::str($d,'avvertenze',false,2000) ?? ($current['avvertenze'] ?? null),
            'medico_curante' => V::str($d, 'medico_curante', false, 120),
            'scadenza_certificato_sportivo' => V::date($d, 'scadenza_certificato_sportivo'),
            'non_inviare_recensione' => V::bool($d, 'non_inviare_recensione'),
            'anamnesi' => V::str($d, 'anamnesi', false, 8000), 'allergie' => V::str($d, 'allergie', false, 2000),
        ];
    }

    /**
     * Possibili duplicati: stesso codice fiscale, oppure stesso nome e cognome (anche scambiati) con stessa data di nascita.
     * @return list<array<string,mixed>>
     */
    public function duplicates(array $candidate, ?string $exceptId = null): array
    {
        $cf = $candidate['codice_fiscale'] ?? null;
        $name = PatientText::norm(($candidate['nome'] ?? '') . ' ' . ($candidate['cognome'] ?? ''));
        $nameSwapped = PatientText::norm(($candidate['cognome'] ?? '') . ' ' . ($candidate['nome'] ?? ''));
        $birth = $candidate['data_nascita'] ?? null;
        $out = [];
        foreach ($this->store->all('patients', null, null, false) as $p) {
            if ($p['id'] === $exceptId) {
                continue;
            }
            $why = null;
            if ($cf && ($p['codice_fiscale'] ?? null) === $cf) {
                $why = 'codice_fiscale';
            } elseif ($birth && ($p['data_nascita'] ?? null) === $birth) {
                $pn = PatientText::norm($p['nome'] . ' ' . $p['cognome']);
                if ($pn === $name || $pn === $nameSwapped) {
                    $why = 'nome_e_data_nascita';
                }
            }
            if ($why !== null) {
                $out[] = ['id' => $p['id'], 'nome' => $p['nome'], 'cognome' => $p['cognome'], 'data_nascita' => $p['data_nascita'] ?? null, 'motivo' => $why];
            }
        }
        return $out;
    }

    public function create(array $d, bool $forceDuplicate = false): array
    {
        return $this->store->transaction(function () use ($d, $forceDuplicate) {
            $rec = $this->normalize($d);
            $dups = $this->duplicates($rec);
            if ($dups !== [] && !$forceDuplicate) {
                throw new ApiError('possibile_duplicato', 409, ['duplicati' => $dups]);
            }
            $rec += ['professionisti' => [], 'assenze' => 0];
            return $this->store->put('patients', $rec);
        });
    }

    public function update(string $id, array $d, ?int $revision, bool $forceDuplicate = false): array
    {
        return $this->store->transaction(function () use ($id, $d, $revision, $forceDuplicate) {
            $cur = $this->store->get('patients', $id) ?? throw ApiError::notFound();
            $rec = $this->normalize($d, $cur);
            $dups = $this->duplicates($rec, $id);
            if ($dups !== [] && !$forceDuplicate) {
                throw new ApiError('possibile_duplicato', 409, ['duplicati' => $dups]);
            }
            return $this->store->put('patients', array_replace($cur, $rec), $revision);
        });
    }

    /** Aggiunge un professionista all'elenco di chi segue il paziente (base del «paziente proprio»). */
    public function attachProfessional(string $patientId, ?string $professionalId): void
    {
        if ($professionalId === null) {
            return;
        }
        $p = $this->store->get('patients', $patientId);
        if ($p !== null && !in_array($professionalId, $p['professionisti'] ?? [], true)) {
            $p['professionisti'][] = $professionalId;
            $this->store->put('patients', $p);
        }
    }

    // ------------------------------------------------------------ ricerca

    /** @return list<array<string,mixed>> sintesi, ordinate per pertinenza */
    public function search(string $q, Context $c, int $limit = 20): array
    {
        $q = trim($q);
        if ($q === '') {   // elenco alfabetico dei pazienti visibili
            $all = array_values(array_filter($this->store->all('patients', null, null, false), fn ($p) => $this->canSee($c, $p)));
            usort($all, static fn ($a, $b) => strcmp($a['cognome'] . $a['nome'], $b['cognome'] . $b['nome']));
            return array_map(fn ($p) => $this->summary($p), array_slice($all, 0, $limit));
        }
        $qTokens = PatientText::tokens($q);
        $qDigits = PatientText::digits($q);
        $qCf = FiscalCode::normalize($q);
        $scored = [];
        foreach ($this->store->all('patients', null, null, false) as $p) {
            if (!$this->canSee($c, $p)) {
                continue;
            }
            $score = 0.0;
            if (strlen($qCf) >= 6 && str_starts_with((string) ($p['codice_fiscale'] ?? ''), $qCf)) {
                $score = 1.0;
            }
            if (strlen($qDigits) >= 4 && $p['telefono'] && str_contains(PatientText::digits($p['telefono']), $qDigits)) {
                $score = max($score, 0.95);
            }
            if ($qTokens !== []) {
                $pt = PatientText::tokens($p['nome'] . ' ' . $p['cognome']);
                $total = 0.0;
                foreach ($qTokens as $qt) {
                    $best = 0.0;
                    foreach ($pt as $t) {
                        $best = max($best, PatientText::tokenScore($qt, $t));
                    }
                    if ($best === 0.0) {
                        $total = 0.0;
                        break;
                    }
                    $total += $best;
                }
                $score = max($score, $total / count($qTokens));
            }
            if ($score >= 0.6) {
                $scored[] = [$score, $p];
            }
        }
        usort($scored, static fn ($a, $b) => $b[0] <=> $a[0] ?: strcmp($a[1]['cognome'], $b[1]['cognome']));
        return array_map(fn ($s) => $this->summary($s[1]), array_slice($scored, 0, $limit));
    }

    public function summary(array $p): array
    {
        return ['id' => $p['id'], 'nome' => $p['nome'], 'cognome' => $p['cognome'], 'data_nascita' => $p['data_nascita'] ?? null,
            'telefono' => $p['telefono'] ?? null, 'codice_fiscale' => $p['codice_fiscale'] ?? null];
    }

    // ------------------------------------------------------------ visibilità

    public function canSee(Context $c, array $patient): bool
    {
        if ($c->can('pazienti.tutti')) {
            return true;
        }
        if (!$c->can('pazienti.anagrafica') && !$c->can('pazienti.essenziali')) {
            return false;
        }
        $pro = $c->user()['professional_id'] ?? null;
        return $pro !== null && in_array($pro, $patient['professionisti'] ?? [], true);
    }

    public function assertCanSee(Context $c, array $patient): void
    {
        if (!$this->canSee($c, $patient)) {
            throw ApiError::forbidden();
        }
    }

    public function canEdit(Context $c, array $patient): bool
    {
        return $c->can('pazienti.anagrafica') && $this->canSee($c, $patient);
    }

    /** Filtra i campi secondo i permessi: essenziali, anagrafica, clinica. */
    public function present(Context $c, array $p): array
    {
        $own = $this->canSee($c, $p);
        if (!$own) {
            throw ApiError::forbidden();
        }
        if (!$c->can('pazienti.anagrafica')) {
            return array_intersect_key($p, array_flip(self::ESSENTIAL));
        }
        if (!$c->can('pazienti.clinica')) {
            foreach (self::CLINICAL as $f) {
                unset($p[$f]);
            }
        }
        return $p;
    }
}
