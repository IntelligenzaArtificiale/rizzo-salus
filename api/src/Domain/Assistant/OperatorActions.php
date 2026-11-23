<?php
declare(strict_types=1);
namespace App\Domain\Assistant;
use App\Core\{ApiError, Clock};
use App\Http\{Context, Request};
use App\Http\Controllers\{AgendaController, PatientsController, ManagementController, BillingController, CatalogController, BookingController};

/** Adatta i campi della proposta ai controller reali, senza aggirarne le validazioni. */
final class OperatorActions
{
    public function __construct(private readonly Context $c, private readonly OperatorResolver $resolver) {}

    public function run(array $action, string $key): array
    {
        $type = $action['tipo'];
        $d = OperatorDefinitions::data($this->c, $action);
        if (in_array($type, ['appuntamento_crea', 'prenotazione_crea'], true) && ($d['tipo'] ?? '') !== 'nota') {
            $missing = array_filter(['paziente', 'prestazione', 'professionista', 'start'], static fn($field) => trim((string)($d[$field] ?? '')) === '');
            if ($missing) throw new ApiError('dati_operatore_mancanti', 422, ['campi' => array_values($missing)]);
        }
        $original = $d; $before = []; $collection = '';
        $find = fn ($col,$hint) => $this->resolver->find($col,(string)$hint);
        $reference = function (string $field,string $col,string $target) use (&$d,$find): void {
            if (!empty($d[$field])) { $d[$target]=$find($col,$d[$field])['id']; unset($d[$field]); }
        };
        $merge = function (string $field,string $col) use (&$d,&$before,&$collection,$find): void {
            $collection=$col;
            if (!empty($d[$field])) {
                $before=$find($col,$d[$field]); unset($d[$field]);
                $d=array_replace($before,$d);
                if (isset($before['costo_cents']) && !array_key_exists('costo',$d)) $d['costo']=$before['costo_cents']/100;
                if (isset($before['importo_cents']) && !array_key_exists('importo',$d)) $d['importo']=$before['importo_cents']/100;
            }
        };
        switch ($type) {
            case 'paziente_crea': case 'paziente_modifica':
                if ($type==='paziente_modifica' && empty($d['paziente'])) throw new ApiError('riferimento_operatore_mancante',422,['campo'=>'paziente']);
                $merge('paziente','patients'); $controller=PatientsController::class; $method='salva'; break;
            case 'attesa_aggiungi':
                $reference('paziente','patients','patient_id'); $reference('professionista','professionals','professional_id'); $reference('prestazione','therapy_types','therapy_type_id');
                $collection='waitlist'; $controller=BookingController::class; $method='attesaSalva'; break;
            case 'prenotazione_crea': case 'appuntamento_crea':
                $reference('paziente','patients','patient_id');
                $reference('professionista','professionals','professional_id');
                $reference('prestazione','therapy_types','therapy_type_id');
                if (($d['tipo']??'')!=='nota' && !empty($d['therapy_type_id'])) {
                    $therapy=$this->c->svc->store->get('therapy_types',$d['therapy_type_id']);
                    if ($type==='prenotazione_crea' && $therapy['categoria']!=='visita') throw new ApiError('solo_visite_mediche',422);
                    $kind=!empty($therapy['di_gruppo'])?'gruppo':($therapy['categoria']==='visita'?'visita':'terapia');
                    $accepted=[$kind,$therapy['categoria'],''];
                    if ($kind==='gruppo') $accepted[]='terapia';
                    if (isset($d['tipo']) && !in_array($d['tipo'],$accepted,true)) throw new ApiError('tipo_e_terapia_incoerenti',422);
                    $d['tipo']=$kind;
                }
                if (!empty($d['therapy_type_id']) && !empty($d['patient_id'])) $this->episode($d);
                if (($d['tipo']??'')==='gruppo') {
                    $d['participants']=[array_intersect_key($d,array_flip(['patient_id','episode_id','line_id']))];
                    unset($d['patient_id'],$d['episode_id'],$d['line_id']);
                }
                $d['origine']='ai'; $collection='appointments'; $controller=AgendaController::class; $method='crea'; break;
            case 'appuntamento_sposta': case 'appuntamento_stato': case 'appuntamento_annulla':
            case 'gruppo_aggiungi':
                $before=$find('appointments',$d['appuntamento']??''); unset($d['appuntamento']);
                $d += ['id'=>$before['id'],'revision'=>$before['revision']]; $collection='appointments';
                $reference('professionista','professionals','professional_id'); $reference('paziente','patients','patient_id');
                if ($type==='gruppo_aggiungi') {
                    $participant=['patient_id'=>$d['patient_id']??null,'therapy_type_id'=>$before['therapy_type_id']??null];
                    $this->episode($participant);
                    $d['partecipante']=array_intersect_key($participant,array_flip(['patient_id','episode_id','line_id']));
                }
                $controller=AgendaController::class;
                $method=['appuntamento_sposta'=>'sposta','appuntamento_stato'=>'stato','appuntamento_annulla'=>'annulla','gruppo_aggiungi'=>'aggiungiAlGruppo'][$type]; break;
            case 'spesa_salva':
                $merge('spesa','expenses'); $reference('fornitore','suppliers','fornitore_id');
                $d += ['date'=>Clock::today(),'categoria'=>'altro'];
                $controller=ManagementController::class; $method='spesa'; break;
            case 'fattura_incasso':
                $before=$find('invoices',$d['fattura']??''); unset($d['fattura']);
                if (isset($d['importo']) && (int)round($this->number($d['importo'])*100)!==$before['totale_cents']) throw new ApiError('incasso_parziale_non_supportato',422);
                $d += ['id'=>$before['id'],'data'=>Clock::today()];
                $collection='invoices'; $controller=BillingController::class; $method='paga'; break;
            case 'presenza_salva':
                $merge('presenza','staff_attendance'); $reference('professionista','professionals','professional_id');
                $d += ['date'=>Clock::today(),'tipo'=>'presenza'];
                $controller=ManagementController::class; $method='presenza'; break;
            case 'contratto_salva':
                $reference('professionista','professionals','professional_id');
                foreach ($this->c->svc->store->all('staff_adjustments') as $adjustment) {
                    if ($adjustment['professional_id']===($d['professional_id']??null) && $adjustment['mese']===($d['mese']??null)) {
                        $before=$find('staff_adjustments',$adjustment['id']);$d['revision']=$before['revision'];
                    }
                }
                $collection='staff_adjustments'; $controller=ManagementController::class; $method='contratto'; break;
            case 'professionista_salva':
                $merge('professionista','professionals');
                if (isset($d['specialita']) && is_string($d['specialita'])) $d['specialita']=array_map('trim',explode(',',$d['specialita']));
                $controller=CatalogController::class; $method='professionistaSalva'; break;
            case 'articolo_salva':
                $merge('articolo','stock_items'); $reference('fornitore','suppliers','fornitore_id');
                $controller=ManagementController::class; $method='articolo'; break;
            case 'magazzino_movimento':
                $reference('articolo','stock_items','articolo_id'); $d['chiave']=$key;
                $collection='stock_movements'; $controller=ManagementController::class; $method='movimento'; break;
            case 'fornitore_salva':
                $merge('fornitore','suppliers'); $controller=ManagementController::class; $method='fornitore'; break;
            default: throw new ApiError('azione_ai_non_consentita',422);
        }
        foreach (['importo','costo','soglia_minima','quantita','ore','ore_contrattuali_settimana','percentuale_compenso'] as $field) {
            if (isset($d[$field])) $d[$field]=$this->number($d[$field]);
        }
        foreach (['pagata','attivo'] as $field) if (isset($d[$field]) && !is_bool($d[$field])) {
            if (!in_array($d[$field],['true','false','1','0'],true)) throw new ApiError('campo_operatore_non_valido',422,['campo'=>$field]);
            $d[$field]=in_array($d[$field],['true','1'],true);
        }
        $request = new Request('POST','/operatore',$d,$this->c->req->headers,$this->c->req->cookies,$this->c->req->ip);
        $context = new Context($request,$this->c->svc,$this->c->session,$this->c->user,$this->c->perms);
        $result=(new $controller())->$method($context);
        if (!$before && !empty($result['id'])) $this->resolver->created($collection,$result['id']);
        $details=[];
        $refs=['paziente'=>['patients','patient_id'],'professionista'=>['professionals','professional_id'],
            'prestazione'=>['therapy_types','therapy_type_id'],'articolo'=>['stock_items','articolo_id'],'fornitore'=>['suppliers','fornitore_id']];
        foreach ($original as $field=>$value) {
            if (isset($refs[$field]) && isset($d[$refs[$field][1]])) {
                $ref=$this->c->svc->store->get($refs[$field][0],$d[$refs[$field][1]]);
                $value=trim(($ref['nome']??'').' '.($ref['cognome']??''));
            } elseif (in_array($field,['appuntamento','paziente','professionista','articolo','spesa','fattura','fornitore','presenza'],true) && $before) {
                $value=$this->subject($collection,$before);
            } elseif (isset($result[$field]) && is_scalar($result[$field])) $value=is_bool($result[$field])?($result[$field]?'Sì':'No'):(string)$result[$field];
            if ($field==='importo' && isset($result['importo_cents'])) $value=number_format($result['importo_cents']/100,2,',','.').' €';
            $label=['start'=>'Inizio','date'=>'Data','durata_min'=>'Durata (minuti)','data_pagamento'=>'Data pagamento',
                'da'=>'Entrata','a'=>'Uscita','pausa_minuti'=>'Pausa (minuti)','ore_contrattuali_settimana'=>'Ore settimanali'][$field]??ucfirst(str_replace('_',' ',$field));
            $details[]=['campo'=>$label, 'prima'=>isset($before[$field])&&is_scalar($before[$field])?(string)$before[$field]:null,'dopo'=>$value];
        }
        foreach (['start'=>'Inizio','end'=>'Fine','date'=>'Data','minuti'=>'Minuti registrati'] as $field=>$label) {
            if (!isset($original[$field]) && isset($result[$field])) $details[]=['campo'=>$label,'prima'=>null,'dopo'=>(string)$result[$field]];
        }
        if ($type==='fattura_incasso') $details[]=['campo'=>'Saldo registrato','prima'=>null,'dopo'=>number_format($result['totale_cents']/100,2,',','.').' €'];
        if ($type==='appuntamento_crea' && isset($d['episode_id'])) $details[]=['campo'=>'Percorso','prima'=>null,'dopo'=>'Seduta collegata al ciclo aperto'];
        return ['titolo'=>OperatorDefinitions::ACTIONS[$type][0], 'soggetto'=>$this->subject($collection,$before?:$result), 'dettagli'=>$details,'id'=>$result['id']??null,
            'link'=>$this->link($collection,$result),'tipo'=>$type];
    }

    private function number(mixed $value): float
    {
        $s=trim((string)$value);
        if (str_contains($s,',')) $s=str_replace(',','.',str_replace('.','',$s));
        if (!is_numeric($s)||!is_finite((float)$s)) throw new ApiError('numero_operatore_non_valido',422);
        return (float)$s;
    }
    private function subject(string $collection,array $r): string
    {
        if ($collection==='appointments') {
            $names=[];
            foreach (\App\Domain\Agenda\Appointments::refs($r) as $ref) {
                $p=$this->c->svc->store->get('patients',$ref['patient_id']);
                if ($p) $names[]=trim($p['nome'].' '.$p['cognome']);
            }
            return implode(', ',$names).' · '.substr($r['start'],0,10).' '.substr($r['start'],11,5);
        }
        if (isset($r['professional_id'])) {
            $p=$this->c->svc->store->get('professionals',$r['professional_id']);
            return trim(($p['nome']??'').' '.($p['cognome']??'')).' · '.($r['date']??$r['mese']??'');
        }
        if (isset($r['articolo_id'])) return $this->c->svc->store->get('stock_items',$r['articolo_id'])['nome']??'';
        return trim(($r['nome']??$r['descrizione']??$r['numero_testo']??'').' '.($r['cognome']??''));
    }
    private function episode(array &$data): void
    {
        $matches=[];
        foreach ($this->c->svc->store->all('episodes',fn($e)=>$e['patient_id']===$data['patient_id'] && $e['stato']==='aperto') as $e) {
            foreach ($e['therapies']??[] as $line) if ($line['therapy_type_id']===$data['therapy_type_id']) $matches[]=[$e,$line];
        }
        if (count($matches)>1) throw new ApiError('percorso_operatore_ambiguo',422);
        if ($matches) {
            $this->resolver->find('episodes',$matches[0][0]['id']);
            $data['episode_id']=$matches[0][0]['id'];$data['line_id']=$matches[0][1]['line_id'];
        }
    }
    private function link(string $collection,array $result): ?string
    {
        $id=$result['id']??'';
        return match($collection) {
            'patients'=>'/pazienti/'.$id,
            'appointments'=>'/agenda/'.$id.'?giorno='.substr($result['start'],0,10),
            'invoices'=>'/fatture/'.$id,
            'stock_items','stock_movements'=>'/magazzino',
            'staff_attendance','staff_adjustments','professionals'=>'/personale',
            'expenses'=>'/spese',
            'waitlist'=>'/prenotazioni',
            default=>null,
        };
    }
}
