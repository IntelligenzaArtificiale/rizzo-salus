<?php
declare(strict_types=1);
namespace App\Domain\Assistant;
use App\Core\{ApiError,Clock};
use App\Http\Context;

/** Piani cifrati, conferma atomica e idempotente, scadenza e revisioni obbligatorie. */
final class OperatorPlans
{
    public function prepare(Context $c,array $actions): array
    {
        $c->need('ai.assistente');
        if (!$actions || count($actions)>8) throw new ApiError('piano_operatore_non_valido',422);
        foreach ($actions as $action) {
            if (!is_array($action)) throw new ApiError('piano_operatore_non_valido',422);
            OperatorDefinitions::data($c,$action);
        }
        try {
            $c->svc->store->transaction(function()use($c,$actions){
                $resolver=new OperatorResolver($c); $executor=new OperatorActions($c,$resolver); $items=[];
                foreach ($actions as $i=>$action) $items[]=$executor->run($action,'anteprima-'.$i);
                throw new OperatorPreview($items,$resolver->versions);
            });
        } catch (OperatorPreview $preview) {
            $plan=$c->svc->store->put('operator_plans',['user_id'=>$c->userId(),'stato'=>'da_confermare',
                'scade'=>Clock::stamp(Clock::now()->modify('+15 minutes')),'azioni'=>$actions,'anteprima'=>$preview->items,'revisioni'=>$preview->versions,'risultati'=>[]]);
            $c->svc->audit()->log('operatore.prepara','operator_plans',$plan['id'],null,null,['azioni'=>array_column($actions,'tipo')]);
            return $this->present($plan);
        }
        throw new \LogicException('Anteprima non interrotta');
    }
    public function confirm(Context $c,string $id): array
    {
        $c->need('ai.assistente');
        return $c->svc->store->transaction(function()use($c,$id){
            $plan=$this->owned($c,$id);
            foreach ($plan['azioni'] as $action) OperatorDefinitions::data($c,$action);
            if ($plan['stato']==='applicato') return $this->present($plan);
            if ($plan['stato']!=='da_confermare') throw new ApiError('piano_operatore_chiuso',409);
            if ($plan['scade']<Clock::stamp()) throw new ApiError('piano_operatore_scaduto',410);
            foreach ($plan['revisioni'] as $collection=>$records) foreach ($records as $record=>$revision) {
                $current=$c->svc->store->get($collection,$record);
                if (!$current || $current['revision']!==$revision) throw new ApiError('piano_operatore_obsoleto',409);
            }
            $executor=new OperatorActions($c,new OperatorResolver($c)); $results=[];
            foreach ($plan['azioni'] as $i=>$action) $results[]=$executor->run($action,$id.'-'.$i);
            $plan['stato']='applicato';$plan['risultati']=$results;$plan['applicato_il']=Clock::stamp();
            $plan=$c->svc->store->put('operator_plans',$plan,$plan['revision']);
            $c->svc->audit()->log('operatore.applica','operator_plans',$id,null,null,['azioni'=>array_column($plan['azioni'],'tipo')]);
            return $this->present($plan);
        });
    }
    public function discard(Context $c,string $id): array
    {
        return $c->svc->store->transaction(function()use($c,$id){
            $plan=$this->owned($c,$id);
            if ($plan['stato']==='applicato') throw new ApiError('piano_operatore_chiuso',409);
            if ($plan['stato']==='scartato') return $this->present($plan);
            $plan['stato']='scartato';
            $plan=$c->svc->store->put('operator_plans',$plan,$plan['revision']);
            $c->svc->audit()->log('operatore.scarta','operator_plans',$id);
            return $this->present($plan);
        });
    }
    private function owned(Context $c,string $id): array
    {
        $c->need('ai.assistente');
        $plan=$c->svc->store->get('operator_plans',$id)??throw ApiError::notFound();
        if ($plan['user_id']!==$c->userId()) throw ApiError::forbidden();
        $patients=array_keys($plan['revisioni']['patients']??[]);
        foreach ($plan['risultati']??[] as $result) if (str_starts_with($result['id']??'','paz_')) $patients[]=$result['id'];
        foreach (array_unique($patients) as $pid) {
            $patient=$c->svc->store->get('patients',$pid);
            if ($patient && !$c->svc->patients()->canSee($c,$patient)) throw ApiError::forbidden();
        }
        return $plan;
    }
    private function present(array $plan): array
    {
        if ($plan['stato']==='scartato') { $plan['anteprima']=[]; $plan['risultati']=[]; }
        return array_intersect_key($plan,array_flip(['id','stato','scade','anteprima','risultati','applicato_il']));
    }
}
