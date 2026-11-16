<?php
declare(strict_types=1);
namespace App\Domain\Patients;
use App\Core\ApiError;
use App\Support\Validator as V;
final class Availability
{
    public static function clean(array $in): array
    {
        if (count($in)>40) throw new ApiError('troppe_fasce',422);
        $out=[];
        foreach ($in as $a) {
            $row=['giorno'=>V::int($a,'giorno',true,1,7),'da'=>V::time($a,'da',true),'a'=>V::time($a,'a',true),
                'preferenza'=>V::enum($a,'preferenza',['alta','media','bassa'],false,'media'),
                'valida_dal'=>V::date($a,'valida_dal'),'valida_al'=>V::date($a,'valida_al')];
            if ($row['da'] >= $row['a'] || ($row['valida_dal'] && $row['valida_al'] && $row['valida_al']<$row['valida_dal'])) throw new ApiError('fascia_non_valida',422);
            $out[]=$row;
        }
        return $out;
    }
}
