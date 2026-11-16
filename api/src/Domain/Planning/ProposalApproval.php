<?php
declare(strict_types=1);
namespace App\Domain\Planning;
use App\Core\{ApiError,Clock};
use App\Domain\Agenda\{Agenda,Appointments};
use App\Store\Store;
use App\Support\Validator as V;
/** Approvazione selettiva in una transazione; i suggerimenti scartati non modificano l'agenda. */
final class ProposalApproval
{
    public function __construct(private readonly Store $store,private readonly Agenda $agenda){}
    public function apply(string $id,string $uid,?array $selected,array $edits,bool $approveMoves): array
    {
        return $this->store->transaction(function()use($id,$uid,$selected,$edits,$approveMoves){
            $p=$this->store->get('proposals',$id) ?? throw ApiError::notFound();
            if($p['stato']!=='proposta')throw new ApiError('proposta_gia_chiusa',409);
            $selected??=array_keys($p['nuove']);$selected=array_values(array_unique($selected));
            if(!$selected)throw new ApiError('selezione_vuota',422);
            foreach($selected as $i)if(!is_int($i)||!isset($p['nuove'][$i]))throw new ApiError('selezione_non_valida',422);
            if($p['spostamenti']&&!$approveMoves)throw new ApiError('approvazione_spostamenti_richiesta',422);
            foreach($p['spostamenti'] as $m){
                $cur=$this->store->get('appointments',$m['appointment_id']) ?? throw new ApiError('proposta_obsoleta',409);
                if($cur['revision']!==$m['revision']||$cur['start']!==$m['da'])throw new ApiError('proposta_obsoleta',409);
                $this->agenda->move($cur['id'],['start'=>$m['a'],'professional_id'=>$m['professional_id']],$cur['revision']);
            }
            $created=[];$groups=[];
            foreach($selected as $i){
                $n=$p['nuove'][$i];$edit=$edits[$i]??[];
                if(isset($edit['start']))$n['start']=V::stamp($edit,'start',true);
                if(isset($edit['professional_id']))$n['professional_id']=V::id($edit,'professional_id','pro',true);
                $ep=$this->store->get('episodes',$n['episode_id']) ?? throw ApiError::notFound();
                if($ep['stato']!=='aperto')throw new ApiError('proposta_obsoleta',409);
                $line=null;foreach($ep['therapies'] as $l)if($l['line_id']===$n['line_id'])$line=$l;
                if(!$line)throw new ApiError('proposta_obsoleta',409);
                $apps=(new Appointments($this->store))->forEpisodes([$ep['id']]);$count=0;
                foreach($apps as $a)if($a['stato']!=='annullato')foreach(Appointments::refs($a) as $ref)if($ref['episode_id']===$ep['id']&&$ref['line_id']===$line['line_id']&&in_array($ref['stato'],Appointments::LIVE,true))$count++;
                if($count>=$line['sedute_previste'])throw new ApiError('sedute_esaurite',409);
                $t=$this->store->get('therapy_types',$n['therapy_type_id']) ?? throw ApiError::notFound();
                $input=['tipo'=>!empty($t['di_gruppo'])?'gruppo':'terapia','start'=>$n['start'],'professional_id'=>$n['professional_id'],'therapy_type_id'=>$t['id'],'resource_id'=>$n['resource_id']];
                $ref=['patient_id'=>$n['patient_id'],'episode_id'=>$n['episode_id'],'line_id'=>$n['line_id']];
                if(!empty($t['di_gruppo'])){
                    $key=$n['start'].'|'.$n['professional_id'].'|'.$t['id'];$existing=$groups[$key]??null;
                    if(!$existing)foreach($this->store->all('appointments',fn($a)=>$a['tipo']==='gruppo'&&$a['stato']!=='annullato'&&$a['start']===$n['start']&&$a['professional_id']===$n['professional_id']&&$a['therapy_type_id']===$t['id']) as $g)$existing=$g['id'];
                    if($existing){$r=$this->agenda->addToGroup($existing,$ref,'occorrenza',false);$created[]=$existing;}
                    else{$r=$this->agenda->create($input+['participants'=>[$ref]],false,'ai');$created[]=$r['id'];}
                    $groups[$key]=$r['id'];
                }else{$r=$this->agenda->create($input+$ref,false,'ai');$created[]=$r['id'];}
            }
            return $this->store->put('proposals',array_replace($p,['stato'=>'approvata','approvata_da'=>$uid,'approvata_il'=>Clock::stamp(),'creati'=>array_values(array_unique($created)),'indici_approvati'=>$selected]));
        });
    }
}
