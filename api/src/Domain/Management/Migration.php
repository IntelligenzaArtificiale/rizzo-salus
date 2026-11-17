<?php
declare(strict_types=1);
namespace App\Domain\Management;
use App\Core\{ApiError,Clock};
use App\Services\Services;
use App\Support\Validator as V;
/** Anteprima, mappatura colonne e applicazione idempotente. Nessuna scrittura nel sistema sorgente. */
final class Migration
{
    public function __construct(private readonly Services $svc){}
    public function preview(array $b): array
    {
        $bytes=base64_decode(V::str($b,'base64',true,70000000),true);if(!$bytes)throw new ApiError('file_non_valido',422);
        $data=TabularFile::read($bytes,V::str($b,'nome_file',true,120));
        return $data+['sha256'=>hash('sha256',$bytes)];
    }
    private function rows(array $b): array
    {
        $data=$this->preview($b);$map=(array)($b['mappa']??[]);$type=V::enum($b,'tipo',['pazienti','fatture_storiche'],true);$rows=[];
        foreach($data['righe'] as $i=>$raw){
            $input=[];foreach($map as $field=>$col)if($col!==''&&isset($raw[$col]))$input[$field]=trim((string)$raw[$col]);
            foreach($input as $k=>$v)if($v==='')$input[$k]=null;
            try{
                if($type==='pazienti'){$clean=$this->svc->patients()->normalize($input);$dups=$this->svc->patients()->duplicates($clean);}
                else{$clean=$this->invoice($input);$dups=$this->duplicatesInvoice($clean);}
                $rows[]=['riga'=>$i+2,'dati'=>$clean,'duplicati'=>$dups,'errore'=>null];
            }catch(ApiError $e){$rows[]=['riga'=>$i+2,'dati'=>null,'duplicati'=>[],'errore'=>$e->errorCode];}
        }
        return ['tipo'=>$type,'sha256'=>$data['sha256'],'righe'=>$rows];
    }
    public function validate(array $b): array
    {
        $d=$this->rows($b);$r=$this->svc->store->put('import_log',$d+['stato'=>'anteprima','creato_da'=>$this->svc->store->actor()]);return $r;
    }
    public function apply(array $b): array
    {
        return $this->svc->store->transaction(function()use($b){
            $r=$this->svc->store->get('import_log',V::id($b,'id','imp',true)) ?? throw ApiError::notFound();
            if($r['tipo']==='acquisto')throw ApiError::forbidden();
            if($r['stato']==='applicato')return ['importati'=>$r['importati'],'gia_applicato'=>true];
            $selected=V::arr($b,'righe',true);$n=0;
            foreach($r['righe'] as $line){
                if(!in_array($line['riga'],$selected,true))continue;
                if($line['errore']||$line['duplicati'])throw new ApiError('importazione_con_errori',422);
                $d=$line['dati'];
                if($r['tipo']==='pazienti')$saved=$this->svc->patients()->create($d);
                else{if($this->duplicatesInvoice($d))throw new ApiError('fattura_duplicata',409);$saved=$this->svc->store->put('invoices',$d);}
                $n++;
            }
            if(!$n)throw new ApiError('selezione_vuota',422);
            $r['stato']='applicato';$r['importati']=$n;$r['applicato_at']=Clock::stamp();$this->svc->store->put('import_log',$r);
            $this->svc->audit()->log('migrazione.applicata','import_log',$r['id'],null,['righe'=>$n]);return ['importati'=>$n];
        });
    }
    private function invoice(array $d): array
    {
        $date=V::date($d,'date',true);$num=V::str($d,'numero',true,80);$cf=strtoupper(V::str($d,'codice_fiscale',true,20));$patient=null;
        foreach($this->svc->store->all('patients') as $p)if(($p['codice_fiscale']??null)===$cf)$patient=$p;
        if(!$patient)throw new ApiError('paziente_non_trovato',422);
        $raw=str_replace(',','.',str_replace(' ','',(string)($d['totale']??'')));
        if(!is_numeric($raw)||(float)$raw<=0)throw new ApiError('importo_non_valido',422);
        $cents=(int)round((float)$raw*100);$paid=V::date($d,'data_pagamento');$description=V::str($d,'descrizione',false,200)??'Documento storico importato';
        return ['tipo'=>'fattura','stato'=>$paid?'pagata':'emessa','date'=>$date,'numero'=>null,'numero_testo'=>$num,'sezionale'=>'STORICO','patient_id'=>$patient['id'],'episode_id'=>null,
            'intestatario'=>array_intersect_key($patient,array_flip(['nome','cognome','codice_fiscale','indirizzo','cap','citta','provincia'])),'righe'=>[['descrizione'=>$description,'quantita'=>1,'prezzo_cents'=>$cents,'sconto_cents'=>0,'importo_cents'=>$cents,'appointment_id'=>null,'therapy_type_id'=>null]],
            'imponibile_cents'=>$cents,'bollo_cents'=>0,'bollo_a_carico'=>'paziente','totale_cents'=>$cents,'sts_opposizione'=>true,
            'pagamento'=>$paid?['data'=>$paid,'metodo'=>'altro','tracciabile'=>false,'importo_cents'=>$cents]:null,
            'storica'=>true,'note'=>'Archivio migrato: importi originali, documento fiscale originale conservato nel gestionale sorgente. Escluso da nuovo invio fiscale.'];
    }
    private function duplicatesInvoice(array $d): array
    {
        return array_map(fn($i)=>['id'=>$i['id'],'motivo'=>'numero_data_paziente'],$this->svc->store->all('invoices',fn($i)=>$i['numero_testo']===$d['numero_testo']&&$i['date']===$d['date']&&$i['patient_id']===$d['patient_id']));
    }
}
