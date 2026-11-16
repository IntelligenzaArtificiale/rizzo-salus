<?php
declare(strict_types=1);
namespace App\Domain\Management;
use App\Core\{ApiError,Clock};
use App\Http\Context;
use App\Services\Services;
use App\Support\Validator as V;
final class Staff
{
    public function __construct(private readonly Services $svc) {}
    public function own(Context $c,string $pro): void {if(!$c->can('personale.presenze')&&($c->user()['professional_id']??null)!==$pro)throw ApiError::forbidden();}
    public function save(Context $c,array $b): array
    {
        $c->need('personale.presenze');$pro=V::id($b,'professional_id','pro',true);$this->svc->store->get('professionals',$pro) ?? throw ApiError::notFound();
        $date=V::date($b,'date',true);$kind=V::enum($b,'tipo',['presenza','ferie','malattia','permesso','assenza'],true);if($kind==='presenza'&&$date>Clock::today())throw new ApiError('presenza_futura',422);
        $from=V::time($b,'da');$to=V::time($b,'a');$pause=V::int($b,'pausa_minuti',false,0,480)??0;
        $minutes=$kind==='presenza'?Clock::minutes($to??'00:00')-Clock::minutes($from??'00:00')-$pause:0;
        if($kind==='presenza'&&(!$from||!$to||$minutes<=0||$minutes>960))throw new ApiError('fascia_non_valida',422);
        return $this->svc->store->transaction(function()use($b,$pro,$date,$kind,$from,$to,$pause,$minutes){
            $cur=empty($b['id'])?[]:($this->svc->store->get('staff_attendance',V::id($b,'id','prs',true)) ?? throw ApiError::notFound());
            foreach($this->svc->store->all('staff_attendance',fn($r)=>$r['professional_id']===$pro&&$r['date']===$date&&$r['id']!==($cur['id']??'')) as $r){
                if($kind!=='presenza'||$r['tipo']!=='presenza'||($from<$r['a']&&$to>$r['da']))throw new ApiError('presenza_sovrapposta',409);
            }
            $rec=array_replace($cur,['professional_id'=>$pro,'date'=>$date,'tipo'=>$kind,'da'=>$from,'a'=>$to,'pausa_minuti'=>$pause,'minuti'=>$minutes,'nota'=>V::str($b,'nota',false,1000)]);
            if(!empty($b['base64']))$rec['giustificativo']=$this->svc->files()->put(base64_decode($b['base64'],true)?:'',V::str($b,'nome_file',true,120),V::str($b,'mime',true,80),'personale','professionals',$pro);
            $r=$this->svc->store->put('staff_attendance',$rec,V::int($b,'revision'));$this->svc->audit()->log('personale.presenza','staff_attendance',$r['id']);return $r;
        });
    }
    public function summary(Context $c,string $month): array
    {
        if(!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/',$month))throw new ApiError('mese_non_valido',422);
        $from=$month.'-01';$to=date('Y-m-t',strtotime($from));$rows=[];
        foreach($this->svc->store->all('professionals') as $p){
            if(!$c->can('personale.presenze')&&($c->user()['professional_id']??null)!==$p['id'])continue;
            $records=$this->svc->store->all('staff_attendance',fn($r)=>$r['professional_id']===$p['id']&&str_starts_with($r['date'],$month));
            $worked=array_sum(array_column($records,'minuti'));$planned=0;$contract=0;
            $work=\App\Domain\Agenda\Workload::summarize($this->svc->appointments()->between($from,Clock::addDays($to,1)),$p['id']);$planned=$work['minuti_programmati'];
            if(!in_array($p['tipo'],['medico','fisioterapista'],true))for($dt=$from;$dt<=$to;$dt=Clock::addDays($dt,1))foreach($this->svc->hours()->professionalWindows($p,$dt) as [$start,$end])$planned+=$end-$start;
            // Monte contrattuale mensile esplicito se configurato, altrimenti pro-rata giorni lun-ven.
            $days=0;for($d=$from;$d<=$to;$d=Clock::addDays($d,1))if(Clock::dow($d)<=5)$days++;
            $contract=(int)round(($p['ore_contrattuali_settimana']??0)/5*$days*60);
            foreach($this->svc->store->all('staff_adjustments',fn($r)=>$r['professional_id']===$p['id']&&$r['mese']===$month) as $r)$contract=$r['minuti_contratto'];
            $rows[]=['professional_id'=>$p['id'],'nome'=>$p['cognome'].' '.$p['nome'],'effettive_min'=>$worked,'programmate_min'=>$planned,'contrattuali_min'=>$contract,'differenza_min'=>$worked-$contract,'presenze'=>$records];
        }
        return ['mese'=>$month,'righe'=>$rows,'preparazione_inclusa'=>false];
    }
    public function contract(array $b): array
    {
        $pro=V::id($b,'professional_id','pro',true);$this->svc->store->get('professionals',$pro) ?? throw ApiError::notFound();
        $month=V::str($b,'mese',true,7);if(!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/',$month))throw new ApiError('mese_non_valido',422);
        return $this->svc->store->transaction(function()use($b,$pro,$month){
            $cur=[];foreach($this->svc->store->all('staff_adjustments',fn($r)=>$r['professional_id']===$pro&&$r['mese']===$month) as $r)$cur=$r;
            return $this->svc->store->put('staff_adjustments',array_replace($cur,['professional_id'=>$pro,'mese'=>$month,'minuti_contratto'=>(int)round(V::num($b,'ore',true,0,744)*60),'nota'=>V::str($b,'nota',false,500)]),V::int($b,'revision'));
        });
    }
}
