<?php
declare(strict_types=1);
namespace App\Domain\Billing;
use App\Services\Settings;
/** Importi in centesimi, IVA per riga e bollo sulle sole quote senza IVA configurate. */
final class InvoiceTax
{
 public static function totals(array $lines,Settings $settings):array
 {
  $net=array_sum(array_column($lines,'importo_cents'));$vat=array_sum(array_column($lines,'iva_cents'));$exempt=0;
  foreach($lines as $l)if(($l['aliquota_iva']??0)==0&&in_array($l['natura_iva']??'N4',['N4','N2.2'],true))$exempt+=$l['importo_cents'];
  $stamp=$exempt>Money::cents($settings->get('fatturazione.bollo_soglia',77.47))?Money::cents($settings->get('fatturazione.bollo_importo',2)):0;
  return ['imponibile_cents'=>$net,'iva_cents'=>$vat,'bollo_cents'=>$stamp,'totale_cents'=>$net+$vat+($settings->get('fatturazione.bollo_a_carico','paziente')==='paziente'?$stamp:0)];
 }
}
