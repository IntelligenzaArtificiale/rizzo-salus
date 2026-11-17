<?php
declare(strict_types=1);
namespace App\Domain\Assistant;
use App\Core\Clock;
use App\Http\Context;
/** Letture operative per rispondere su compensi, personale e attese senza allargare i permessi. */
final class OperatorBusinessContext
{
    public static function describe(Context $c): string
    {
        $out="\nDATI AMMINISTRATIVI AUTORIZZATI (solo righe registrate, non previsioni):\n";
        $mine=$c->user()['professional_id']??null;$s=$c->svc->store;
        $append=static function($name,$rows,$fields) use (&$out):void {
            if (count($rows)>100) $out.="$name: disponibili soltanto 100 righe su ".count($rows)." nel contesto; non dedurre totali completi da questo estratto.\n";
            $out.=$name.': '.json_encode(array_map(fn($r)=>array_intersect_key($r,array_flip($fields)),array_slice($rows,0,100)),JSON_UNESCAPED_UNICODE)."\n";
        };
        if ($c->can('compensi.vedi_tutti')||($mine&&$c->can('compensi.vedi_propri'))) {
            $rows=$s->all('compensations',fn($r)=>$c->can('compensi.vedi_tutti')||$r['professional_id']===$mine);
            $append('Compensi, importi in centesimi',$rows,['id','professional_id','da','a','stato','quota_professionista_cents','quota_struttura_cents']);
        }
        if ($c->can('personale.presenze')||($mine&&$c->can('personale.propria_scheda'))) {
            $rows=$s->all('staff_attendance',fn($r)=>substr($r['date'],0,7)===substr(Clock::today(),0,7)&&($c->can('personale.presenze')||$r['professional_id']===$mine));
            $append('Presenze del mese, minuti effettivi',$rows,['id','professional_id','date','tipo','da','a','minuti']);
        }
        if ($c->can('prenotazioni.liste_attesa')) {
            $append('Lista di attesa',$s->all('waitlist'),['id','professional_id','therapy_type_id','stato','created_on']);
        }
        if ($c->can('statistiche.economiche')) {
            $append('Spese, importi in centesimi',$s->all('expenses'),['id','descrizione','date','categoria','importo_cents','pagata','data_pagamento']);
        }
        return $out;
    }
}
