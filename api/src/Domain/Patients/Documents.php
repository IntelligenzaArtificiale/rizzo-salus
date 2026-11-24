<?php
declare(strict_types=1);
namespace App\Domain\Patients;
use App\Core\{ApiError,Clock};
use App\Http\Context;
use App\Services\{Services,Otp};
use App\Support\Validator as V;
use Dompdf\Dompdf;
/** File cifrati e consensi con evidenze immutabili del testo accettato. */
final class Documents
{
    public function __construct(private readonly Services $svc) {}
    public function patient(Context $c,string $id): array
    {
        $p=$this->svc->store->get('patients',$id) ?? throw ApiError::notFound();
        $this->svc->patients()->assertCanSee($c,$p); return $p;
    }
    public function visible(Context $c,array $d): bool
    {
        if (!$this->svc->patients()->canSee($c,$this->svc->store->get('patients',$d['patient_id']) ?? [])) return false;
        return empty($d['clinico']) ? $c->can('documenti.moduli') : $c->can('pazienti.clinica');
    }
    public function list(Context $c,string $pid): array
    {
        $this->patient($c,$pid);
        return array_values(array_filter($this->svc->store->all('documents',fn($d)=>($d['patient_id']??null)===$pid),fn($d)=>$this->visible($c,$d)));
    }
    public function templates(): array { return $this->svc->store->all('document_templates'); }
    public function saveTemplate(array $b): array
    {
        $cur=empty($b['id'])?[]:($this->svc->store->get('document_templates',$b['id']) ?? throw ApiError::notFound());
        return $this->svc->store->put('document_templates',array_replace($cur,[
            'nome'=>V::str($b,'nome',true,150),'tipo'=>V::enum($b,'tipo',['privacy','trattamento','marketing','whatsapp','referto','altro'],true),
            'testo'=>V::str($b,'testo',true,50000),'versione'=>V::str($b,'versione',true,40),'attivo'=>V::bool($b,'attivo',true),
        ]), V::int($b,'revision'));
    }
    public function compilaModello(Context $c, array $patient, string $id): array
    {
        $template = $this->svc->store->get('document_templates', $id) ?? throw ApiError::notFound();
        if (empty($template['attivo'])) throw new ApiError('modello_inattivo', 422);
        if ($template['tipo'] === 'referto') {
            $c->need('documenti.referti_crea');
            $c->need('pazienti.clinica');
        }
        $struttura = $this->svc->settings()->get('struttura', []);
        $template['compilato'] = strtr($template['testo'], [
            '{{nome}}' => $patient['nome'], '{{cognome}}' => $patient['cognome'],
            '{{codice_fiscale}}' => $patient['codice_fiscale'] ?? '', '{{indirizzo}}' => $patient['indirizzo'] ?? '',
            '{{data_nascita}}' => empty($patient['data_nascita']) ? '' : implode('/', array_reverse(explode('-', $patient['data_nascita']))),
            '{{data}}' => Clock::today(), '{{struttura}}' => $struttura['ragione_sociale'] ?? '',
        ]);
        return $template;
    }

    public function save(Context $c,array $b): array
    {
        $p=$this->patient($c,V::id($b,'patient_id','paz',true));
        $c->need('documenti.moduli','documenti.referti_crea');
        $clinical=V::bool($b,'clinico');
        if ($clinical) $c->need('pazienti.clinica');
        $ep=V::id($b,'episode_id','epi');
        if ($ep && ($this->svc->store->get('episodes',$ep)['patient_id']??null)!==$p['id']) throw ApiError::forbidden();
        $type=V::enum($b,'tipo',['privacy','trattamento','marketing','whatsapp','referto','altro'],false,'altro');
        if (in_array($type,['privacy','trattamento','marketing','whatsapp'],true)) $clinical=false;
        if($type==='referto'){$c->need('documenti.referti_crea');$c->need('pazienti.clinica');$clinical=true;}
        $rec=['patient_id'=>$p['id'],'episode_id'=>$ep,'titolo'=>V::str($b,'titolo',true,150),'tipo'=>$type,'clinico'=>$clinical,
            'stato'=>'archiviato','contenuto'=>null,'condiviso'=>V::bool($b,'condiviso'),'file'=>null];
        if (!empty($b['modello_id'])) {
            $t=$this->compilaModello($c, $p, (string)$b['modello_id']);
            if ($t['tipo'] === 'referto') $rec['clinico'] = true;
            $text=$t['compilato'];
            $rec=array_replace($rec,['tipo'=>$t['tipo'],'contenuto'=>$text,'versione'=>$t['versione'],'modello_id'=>$t['id'],
                'sha256'=>hash('sha256',$text),'stato'=>'da_firmare','file'=>$this->pdf($b['titolo'],$text,$p['id'])]);
        } elseif (!empty($b['base64'])) {
            $bytes=base64_decode($b['base64'],true);
            if ($bytes===false || $bytes==='') throw new ApiError('file_non_valido',422);
            $rec['file']=$this->svc->files()->put($bytes,V::str($b,'nome_file',true,120),V::str($b,'mime',true,120),'documento','patients',$p['id']);
            $rec['sha256']=$rec['file']['sha256'];
            if (V::bool($b,'firmato_cartaceo')) {
                $rec['stato']='firmato';$rec['firma']=['modalita'=>'modulo_cartaceo','at'=>Clock::stamp(),'by'=>$c->userId(),'ip'=>$c->req->ip];
            }
        } elseif (!empty($b['contenuto']) && $c->can('documenti.referti_crea')) {
            $rec['contenuto']=V::str($b,'contenuto',true,50000);$rec['file']=$this->pdf($b['titolo'],$rec['contenuto'],$p['id']);
            $rec['sha256']=$rec['file']['sha256'];
        } else throw new ApiError('contenuto_mancante',422);
        $r=$this->svc->store->transaction(function () use ($rec) {
            $r=$this->svc->store->put('documents',$rec);
            if ($r['stato']==='firmato') $this->consent($r);
            return $r;
        });
        $this->svc->audit()->log('documento.archiviato','documents',$r['id'],null,['patient_id'=>$p['id'],'tipo'=>$r['tipo'],'sha256'=>$r['sha256']]);
        return $r;
    }
    public function link(Context $c,string $id): array
    {
        $d=$this->svc->store->get('documents',$id) ?? throw ApiError::notFound();
        if (!$this->visible($c,$d)) throw ApiError::forbidden();
        if ($d['stato']!=='da_firmare') throw new ApiError('documento_non_firmabile',422);
        $raw=$this->svc->tokens()->issue('firma_documento',$id,1440*(int)$this->svc->settings()->get('documenti.link_scadenza_giorni',14),[],false);
        return ['token'=>$raw,'percorso'=>'/#/firma/'.$raw];
    }
    public function publicDocument(string $raw): array
    {
        $t=$this->svc->tokens()->peek('firma_documento',$raw);
        return $this->svc->store->get('documents',$t['subject']) ?? throw ApiError::notFound();
    }
    public function evidence(string $raw,string $ip,bool $read): array
    {
        $t=$this->svc->tokens()->peek('firma_documento',$raw);
        $t['data']['aperto_at']??=Clock::stamp();$t['data']['ip']=$ip;
        if ($read) $t['data']['letto_at']=Clock::stamp();
        $this->svc->store->put('tokens',$t);
        $d=$this->publicDocument($raw);
        return array_intersect_key($d,array_flip(['id','titolo','contenuto','tipo','versione','sha256','stato']));
    }
    public function requestOtp(string $raw,string $ip): array
    {
        $t=$this->svc->tokens()->peek('firma_documento',$raw);
        if (empty($t['data']['letto_at'])) throw new ApiError('lettura_richiesta',422);
        $d=$this->publicDocument($raw);
        $p=$this->svc->store->get('patients',$d['patient_id']);
        if ($d['stato']!=='da_firmare') throw new ApiError('documento_non_firmabile',422);
        return (new Otp($this->svc))->issue('firma',$d['id'],$p['telefono']??'',$ip,(int)$this->svc->settings()->get('documenti.otp_scadenza_minuti',10));
    }
    public function accept(string $raw,string $challenge,string $code,string $ip): array
    {
        $t=$this->svc->tokens()->peek('firma_documento',$raw);
        $d=$this->publicDocument($raw);
        if (empty($t['data']['letto_at']) || $d['stato']!=='da_firmare') throw new ApiError('documento_non_firmabile',422);
        (new Otp($this->svc))->verify($challenge,$code,'firma',$d['id']);
        return $this->svc->store->transaction(function () use ($raw,$d,$t,$ip) {
            $cur=$this->publicDocument($raw);
            if ($cur['stato']!=='da_firmare') throw new ApiError('documento_non_firmabile',409);
            $cur['stato']='firmato';$cur['firma']=['modalita'=>'otp_semplice','at'=>Clock::stamp(),'ip'=>$ip,'aperto_at'=>$t['data']['aperto_at'],'letto_at'=>$t['data']['letto_at'],'sha256'=>$d['sha256'],'versione'=>$d['versione']];
            $cur['file']=$this->pdf($d['titolo'],$d['contenuto']."\n\nAccettazione mediante codice monouso: ".Clock::stamp()."\nImpronta del testo: ".$d['sha256'],$d['patient_id']);
            $cur=$this->svc->store->put('documents',$cur);$this->consent($cur);
            $this->svc->tokens()->revokeFor('firma_documento',$d['id']);
            $this->svc->audit()->log('documento.accettato','documents',$d['id'],null,$cur['firma']);
            return ['stato'=>'firmato'];
        });
    }
    private function consent(array $d): void
    {
        if (!in_array($d['tipo'],Patients::CONSENTS,true)) return;
        $p=$this->svc->store->get('patients',$d['patient_id']);
        $p['consensi'][$d['tipo']]=['valore'=>true,'data'=>Clock::today(),'versione'=>$d['versione']??'cartaceo','modalita'=>$d['firma']['modalita'],'documento_id'=>$d['id']];
        $this->svc->store->put('patients',$p);
    }
    public function releaseAllowed(string $pid): bool
    {
        $p=$this->svc->store->get('patients',$pid);if(!$p||!empty($p['deleted_at']))return false;
        foreach ($this->svc->settings()->get('documenti.consensi_obbligatori',['privacy','trattamento']) as $key) {
            $cons=$p['consensi'][$key]??[];
            $doc=empty($cons['documento_id'])?null:$this->svc->store->get('documents',$cons['documento_id']);
            if (empty($cons['valore']) || !$doc || $doc['stato']!=='firmato' || $doc['patient_id']!==$pid || $doc['tipo']!==$key) return false;
        }
        return true;
    }
    private function pdf(string $title,string $text,string $pid): array
    {
        $pdf=new Dompdf(['isRemoteEnabled'=>false]);
        $pdf->loadHtml('<html><meta charset="UTF-8"><body><h1>'.htmlspecialchars($title).'</h1><p>'.nl2br(htmlspecialchars($text)).'</p></body></html>');
        $pdf->setPaper('A4');$pdf->render();
        return $this->svc->files()->put($pdf->output(),$title.'.pdf','application/pdf','documento','patients',$pid);
    }
}
