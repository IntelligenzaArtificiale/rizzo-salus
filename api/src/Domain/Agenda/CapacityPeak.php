<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
/** Capienza contemporanea: gli impegni consecutivi non si sommano tra loro. */
final class CapacityPeak
{
 public static function count(int $start,int $end,int $own,array $ranges):int
 {
  $points=[[$start,$own],[$end,-$own]];
  foreach($ranges as [$s,$e,$n]){if($s>=$end||$e<=$start)continue;$points[]=[max($start,$s),$n];$points[]=[min($end,$e),-$n];}
  usort($points,fn($a,$b)=>[$a[0],$a[1]]<=>[$b[0],$b[1]]);$max=0;$now=0;
  foreach($points as [$t,$delta]){$now+=$delta;$max=max($max,$now);}return $max;
 }
}
