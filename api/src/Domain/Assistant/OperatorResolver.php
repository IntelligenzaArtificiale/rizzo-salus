<?php
declare(strict_types=1);
namespace App\Domain\Assistant;
use App\Core\ApiError;
use App\Http\Context;

/** Risolve solo riferimenti univoci e conserva le revisioni originali per la conferma. */
final class OperatorResolver
{
    private array $created = [];
    public array $versions = [];
    public function __construct(private readonly Context $c)
    {}
    public function created(string $collection,string $id): void { $this->created[$collection][$id]=true; }
    public function find(string $collection, string $hint): array
    {
        if (trim($hint) === '') throw new ApiError('riferimento_operatore_mancante',422,['campo'=>$collection]);
        $normalize = static fn ($s) => mb_strtolower(trim(preg_replace('/\s+/u', ' ', (string)$s)));
        $query = $normalize($hint); $exact = []; $partial = [];
        foreach ($this->c->svc->store->all($collection) as $r) {
            if ($collection === 'patients' && !$this->c->svc->patients()->canSee($this->c,$r)) continue;
            if ($collection === 'appointments' && !$this->c->can('agenda.vedi_tutto') && ($r['professional_id']??null)!==($this->c->user['professional_id']??null)) continue;
            $labels = [$r['id'], $r['nome']??'', $r['codice']??'', $r['numero_testo']??'', $r['descrizione']??''];
            if (isset($r['cognome'])) $labels = array_merge($labels, [($r['nome']??'').' '.$r['cognome'], $r['cognome'].' '.($r['nome']??'')]);
            foreach ($labels as $label) {
                $label = $normalize($label);
                if ($label === $query) $exact[$r['id']] = $r;
                elseif (mb_strlen($query)>=3 && str_contains($label,$query)) $partial[$r['id']]=$r;
            }
        }
        $matches = $exact ?: $partial;
        if (count($matches)!==1) throw new ApiError(count($matches)>1?'riferimento_operatore_ambiguo':'riferimento_operatore_non_trovato',422,['campo'=>$collection]);
        $row = array_values($matches)[0];
        if (!isset($this->created[$collection][$row['id']])) $this->versions[$collection][$row['id']] ??= $row['revision'];
        return $row;
    }
}
