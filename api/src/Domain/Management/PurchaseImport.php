<?php
declare(strict_types=1);
namespace App\Domain\Management;
use App\Core\{ApiError,Clock};
use App\Services\Services;
use App\Support\Validator as V;
use DOMXPath;
final class PurchaseImport
{
    public function __construct(private readonly Services $svc){}
    public function preview(array $b): array
    {
        $bytes=base64_decode(V::str($b,'base64',true,22000000),true);if(!$bytes)throw new ApiError('file_non_valido',422);
        $hash=hash('sha256',$bytes);foreach($this->svc->store->all('import_log',fn($r)=>($r['sha256']??null)===$hash&&$r['tipo']==='acquisto') as $r)return $r;
        $name=V::str($b,'nome_file',true,120);$pdf=str_ends_with(strtolower($name),'.pdf');$lines=[];$text='';
        if(!$pdf){
            $doc=TabularFile::xml($bytes);$xp=new DOMXPath($doc);
            foreach($xp->query('//*[local-name()="DettaglioLinee"]') as $line){
                $get=fn($tag)=>trim($xp->query('.//*[local-name()="'.$tag.'"]',$line)->item(0)?->textContent??'');
                $q=$get('Quantita');$q=$q===''?'1':$q;if(!is_numeric($q)||(float)$q<=0)throw new ApiError('quantita_non_valida',422);
                $sku=$get('CodiceValore');$descr=$get('Descrizione');$matches=[];
                foreach($this->svc->store->all('stock_items') as $item)if(($sku&&($item['codice']??'')===$sku)||mb_strtolower($item['nome'])===mb_strtolower($descr))$matches[]=$item['id'];
                $lines[]=['descrizione'=>$descr,'codice'=>$sku,'quantita'=>(float)$q,'articolo_id'=>count($matches)===1?$matches[0]:null,'unita_documento'=>$get('UnitaMisura')];
            }
            if(!$lines)throw new ApiError('fattura_senza_articoli',422);
        }else{
            // Il PDF resta allegato e il testo viene mostrato per associazione umana. Nessuna quantità viene indovinata.
            if(is_executable('/usr/bin/pdftotext')){
                $tmp=tempnam(sys_get_temp_dir(),'rizpdf');file_put_contents($tmp,$bytes);
                try{$p=proc_open(['/usr/bin/pdftotext','-layout',$tmp,'-'],[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes);if(is_resource($p)){fclose($pipes[0]);$text=substr(stream_get_contents($pipes[1]),0,50000);fclose($pipes[1]);fclose($pipes[2]);proc_close($p);}}finally{@unlink($tmp);}
            }
        }
        $file=$this->svc->files()->put($bytes,$name,$pdf?'application/pdf':'application/xml','fattura_acquisto');
        return $this->svc->store->put('import_log',['tipo'=>'acquisto','stato'=>'anteprima','sha256'=>$hash,'righe'=>$lines,'estratto'=>$text,'file'=>$file]);
    }
    public function apply(array $b): array
    {
        return $this->svc->store->transaction(function()use($b){
            $r=$this->svc->store->get('import_log',V::id($b,'id','imp',true)) ?? throw ApiError::notFound();
            if($r['tipo']!=='acquisto')throw ApiError::forbidden();if($r['stato']==='applicato')return ['importati'=>$r['importati'],'gia_applicato'=>true];
            $lines=V::arr($b,'righe',true);if(!$lines)throw new ApiError('righe_obbligatorie',422);
            if(count($lines)>300)throw new ApiError('troppe_righe',422);$stock=new Stock($this->svc);
            foreach($lines as $i=>$l)$stock->move(['articolo_id'=>V::id($l,'articolo_id','art',true),'quantita'=>V::num($l,'quantita',true,0.001,100000),'date'=>Clock::today(),'motivo'=>'Fattura acquisto verificata '.$r['file']['name']], 'acquisto:'.$r['sha256'].':'.$i);
            $r['stato']='applicato';$r['righe']=$lines;$r['importati']=count($lines);$r['approvato_da']=$this->svc->store->actor();$this->svc->store->put('import_log',$r);
            $this->svc->audit()->log('magazzino.fattura_importata','import_log',$r['id'],null,['righe'=>count($lines)]);return ['importati'=>count($lines)];
        });
    }
}
