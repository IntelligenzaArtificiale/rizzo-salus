<?php
declare(strict_types=1);
namespace App\Domain\Management;
use App\Core\{ApiError,Clock};
use App\Services\Services;
use App\Support\Validator as V;
final class Expenses
{
    public function __construct(private readonly Services $svc) {}
    public function save(array $b): array
    {
        $cur=empty($b['id'])?[]:($this->svc->store->get('expenses',V::id($b,'id','spe',true)) ?? throw ApiError::notFound());
        $rec=array_replace($cur,['descrizione'=>V::str($b,'descrizione',true,200),'date'=>V::date($b,'date',true),'scadenza'=>V::date($b,'scadenza'),
            'categoria'=>V::enum($b,'categoria',['fornitori','materiali','abbonamenti','f24','stipendi','compensi','utenze','altro'],true),
            'importo_cents'=>(int)round(V::num($b,'importo',true,0.01,10000000)*100),'pagata'=>V::bool($b,'pagata'),'data_pagamento'=>V::date($b,'data_pagamento'),
            'ricorrenza'=>V::enum($b,'ricorrenza',['nessuna','mensile','trimestrale','annuale'],false,'nessuna'),'fine_ricorrenza'=>V::date($b,'fine_ricorrenza'),
            'fornitore_id'=>V::id($b,'fornitore_id','for'),'nota'=>V::str($b,'nota',false,1000)]);
        if($rec['pagata']&&!$rec['data_pagamento'])throw new ApiError('data_pagamento_mancante',422);
        if(!empty($b['base64']))$rec['file']=$this->svc->files()->put(base64_decode($b['base64'],true)?:'',V::str($b,'nome_file',true,120),V::str($b,'mime',true,80),'amministrazione');
        $r=$this->svc->store->put('expenses',$rec,V::int($b,'revision'));$this->svc->audit()->log('spesa.salva','expenses',$r['id']);return $r;
    }
    public function period(string $from,string $to): array
    {
        if($to<$from||Clock::diffMinutes($from.'T00:00:00',$to.'T00:00:00')>732*1440)throw new ApiError('periodo_non_valido',422);
        $rows=[];$due=0;$paid=0;
        foreach($this->svc->store->all('expenses') as $e){
            if($e['date']>=$from&&$e['date']<=$to){$rows[]=$e;$due+=$e['importo_cents'];}
            if($e['pagata']&&$e['data_pagamento']>=$from&&$e['data_pagamento']<=$to)$paid+=$e['importo_cents'];
        }
        $forecast=0;
        foreach($this->svc->store->all('expenses') as $e){
            if($e['ricorrenza']==='nessuna')continue;
            $step=['mensile'=>1,'trimestrale'=>3,'annuale'=>12][$e['ricorrenza']];
            $base=new \DateTimeImmutable($e['date']);$anchor=(int)$base->format('d');
            for($i=$step;$i<=120;$i+=$step){
                $m=$base->modify('first day of this month')->modify('+'.$i.' months');$d=$m->setDate((int)$m->format('Y'),(int)$m->format('m'),min($anchor,(int)$m->format('t')))->format('Y-m-d');
                if($d>$to||(!empty($e['fine_ricorrenza'])&&$d>$e['fine_ricorrenza']))break;
                if($d>=$from)$forecast+=$e['importo_cents'];
            }
        }
        $stats=$this->svc->billingStats()->period($from,$to);
        return ['spese'=>$rows,'costi_competenza_cents'=>$due,'uscite_pagate_cents'=>$paid,'ricorrenze_previste_cents'=>$forecast,
            'fatturato_cents'=>$stats['fatturato_cents'],'incassato_cents'=>$stats['incassato_cents'],'margine_competenza_cents'=>$stats['fatturato_cents']-$due,'saldo_cassa_cents'=>$stats['incassato_cents']-$paid];
    }
}
