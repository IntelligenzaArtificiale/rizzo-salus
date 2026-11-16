<?php
declare(strict_types=1);
namespace App\Domain\Management;
use App\Core\{ApiError,Clock};
use App\Services\Services;
use App\Support\Validator as V;
final class Stock
{
    public function __construct(private readonly Services $svc) {}
    public function list(): array
    {
        $items=$this->svc->store->all('stock_items');$qty=[];
        foreach($this->svc->store->all('stock_movements') as $m) $qty[$m['articolo_id']]=($qty[$m['articolo_id']]??0)+$m['quantita'];
        foreach($items as &$i) {$i['giacenza']=round($qty[$i['id']]??0,3);$i['sotto_soglia']=$i['giacenza']<$i['soglia_minima'];}
        return ['articoli'=>$items,'movimenti'=>array_slice(array_reverse($this->svc->store->all('stock_movements')),0,200),'fornitori'=>$this->svc->store->all('suppliers')];
    }
    public function item(array $b): array
    {
        $cur=empty($b['id'])?[]:($this->svc->store->get('stock_items',V::id($b,'id','art',true)) ?? throw ApiError::notFound());
        $supplier=V::id($b,'fornitore_id','for');
        if($supplier&&!$this->svc->store->get('suppliers',$supplier))throw ApiError::notFound();
        return $this->svc->store->put('stock_items',array_replace($cur,['nome'=>V::str($b,'nome',true,150),'codice'=>V::str($b,'codice',false,60),
            'unita'=>V::str($b,'unita',true,20),'soglia_minima'=>V::num($b,'soglia_minima',false,0,100000)??0,
            'costo_cents'=>(int)round((V::num($b,'costo',false,0,100000)??0)*100),'fornitore_id'=>$supplier,'attivo'=>V::bool($b,'attivo',true)]),V::int($b,'revision'));
    }
    public function supplier(array $b): array
    {
        $cur=empty($b['id'])?[]:($this->svc->store->get('suppliers',V::id($b,'id','for',true)) ?? throw ApiError::notFound());
        return $this->svc->store->put('suppliers',array_replace($cur,['nome'=>V::str($b,'nome',true,150),'partita_iva'=>V::str($b,'partita_iva',false,20),'email'=>V::email($b,'email'),'telefono'=>V::phone($b,'telefono')]),V::int($b,'revision'));
    }
    public function move(array $b,string $key, bool $allowNegative=false): array
    {
        return $this->svc->store->transaction(function()use($b,$key,$allowNegative){
            foreach($this->svc->store->all('stock_movements',fn($r)=>($r['chiave']??null)===$key) as $r)return $r;
            $id=V::id($b,'articolo_id','art',true);$this->svc->store->get('stock_items',$id) ?? throw ApiError::notFound();
            $q=V::num($b,'quantita',true,-100000,100000);
            if($q==0)throw new ApiError('quantita_non_valida',422);
            $stock=0;foreach($this->svc->store->all('stock_movements',fn($r)=>$r['articolo_id']===$id) as $m)$stock+=$m['quantita'];
            if(!$allowNegative&&$stock+$q<0)throw new ApiError('scorta_insufficiente',409);
            $r=$this->svc->store->put('stock_movements',['articolo_id'=>$id,'date'=>V::date($b,'date')??Clock::today(),'quantita'=>$q,
                'motivo'=>V::str($b,'motivo',true,500),'chiave'=>$key,'appointment_id'=>$b['appointment_id']??null]);
            $this->svc->audit()->log('magazzino.movimento','stock_movements',$r['id'],null,['articolo_id'=>$id,'quantita'=>$q]);return $r;
        });
    }
    /** Consumo per singolo paziente eseguito; transizioni ripetute non duplicano i movimenti. */
    public function appointment(?array $before,?array $after): void
    {
        if(!$after||empty($after['therapy_type_id']))return;
        $t=$this->svc->store->get('therapy_types',$after['therapy_type_id']);
        $refs=\App\Domain\Agenda\Appointments::refs($after);$prev=$before?array_column(\App\Domain\Agenda\Appointments::refs($before),null,'patient_id'):[];
        foreach($refs as $ref){
            $was=($prev[$ref['patient_id']]['stato']??null)==='eseguito';$now=$ref['stato']==='eseguito';
            if($was===$now)continue;
            foreach($t['consumi_standard']??[] as $c) $this->move(['articolo_id'=>$c['articolo_id'],'quantita'=>($now?-1:1)*$c['quantita'],
                'date'=>substr($after['start'],0,10),'motivo'=>$now?'Consumo prestazione eseguita':'Ripristino esito prestazione','appointment_id'=>$after['id']],
                'seduta:'.$after['id'].':'.$ref['patient_id'].':'.$c['articolo_id'].':'.$after['revision'],true);
        }
    }
}
