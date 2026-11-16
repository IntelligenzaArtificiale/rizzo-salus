<?php
declare(strict_types=1);
namespace App\Services;
use App\Core\ApiError;
use App\Domain\SettingsDefaults;
final class SettingsRules
{
    public static function check(array $patch): void
    {
        foreach($patch as $k=>$v)if(!array_key_exists($k,SettingsDefaults::all()))throw new ApiError('sezione_non_valida',422);
        self::walk($patch);
        if(isset($patch['integrazioni']['aruba']['ambiente'])&&!in_array($patch['integrazioni']['aruba']['ambiente'],['demo','produzione'],true))throw new ApiError('ambiente_non_valido',422);
        if(isset($patch['integrazioni']['sts']['ambiente'])&&!in_array($patch['integrazioni']['sts']['ambiente'],['test','produzione'],true))throw new ApiError('ambiente_non_valido',422);
        foreach($patch['agenda']['colori']??[] as $color)if(!is_string($color)||!preg_match('/^#[0-9a-fA-F]{6}$/',$color))throw new ApiError('colore_non_valido',422);
        foreach($patch['orari']??[] as $day=>$slots){
            if(!in_array((int)$day,range(1,7),true)||!is_array($slots))throw new ApiError('orari_non_validi',422);
            $prev=null;usort($slots,fn($a,$b)=>strcmp((string)($a[0]??''),(string)($b[0]??'')));
            foreach($slots as $slot){
                if(count($slot)!==2||!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/',(string)$slot[0])||!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/',(string)$slot[1])||$slot[0]>=$slot[1]||($prev&&$slot[0]<$prev))throw new ApiError('orari_non_validi',422);
                $prev=$slot[1];
            }
        }
        $ranges=['agenda.gruppi.max_standard'=>[1,6],'agenda.gruppi.max_complesso'=>[1,6],'agenda.gruppi.max_neurologici'=>[0,1],'ai.tetto_mensile_eur'=>[0,10000],'ai.tetto_giornaliero_eur'=>[0,10000],'prenotazioni.anticipo_minimo_ore'=>[0,720],
            'prenotazioni.orizzonte_giorni'=>[1,365],'prenotazioni.passo_minuti'=>[5,120],'documenti.link_scadenza_giorni'=>[1,90],
            'documenti.otp_scadenza_minuti'=>[1,30],'messaggi.followup.recensione_dopo_giorni'=>[2,3],'messaggi.followup.giorni_default'=>[1,365]];
        foreach($ranges as $path=>[$min,$max]){ $cur=$patch;foreach(explode('.',$path) as $part){if(!is_array($cur)||!array_key_exists($part,$cur))continue 2;$cur=$cur[$part];}if(!is_numeric($cur)||$cur<$min||$cur>$max)throw new ApiError('parametro_fuori_limite',422,['campo'=>$path]); }
        if(isset($patch['prenotazioni']['conferma'])&&$patch['prenotazioni']['conferma']!=='automatica')throw new ApiError('conferma_solo_automatica',422);
        if(!empty($patch['personale']['preparazione_conta'])||!empty($patch['personale']['preparazione_minuti']))throw new ApiError('preparazione_esclusa',422);
        if(isset($patch['documenti']['consensi_obbligatori']))foreach(['privacy','trattamento'] as $k)if(!in_array($k,$patch['documenti']['consensi_obbligatori'],true))throw new ApiError('consensi_obbligatori',422);
        foreach($patch['prenotazioni']['domande']??[] as $q)if(!is_array($q)||empty(trim((string)($q['testo']??'')))||mb_strlen($q['testo'])>300)throw new ApiError('domanda_non_valida',422);
        foreach($patch['messaggi']['silenzio']??[] as $t)if(!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/',(string)$t))throw new ApiError('orario_non_valido',422);
    }
    private static function walk(array $data): void
    {
        foreach($data as $k=>$v){
            if(in_array(strtolower((string)$k),['password','pin','api_key','openai_api_key','composio_api_key','aruba_password','sts_password','sts_pin'],true))throw new ApiError('usa_credenziali_riservate',422);
            if(is_array($v))self::walk($v);elseif(!is_scalar($v)&&$v!==null)throw new ApiError('parametro_non_valido',422);
            elseif(is_string($v)&&strlen($v)>50000)throw new ApiError('parametro_troppo_lungo',422);
        }
    }
}
