<?php
declare(strict_types=1);
namespace App\Domain\Catalog;
use App\Core\ApiError;
use App\Store\Store;
use App\Support\Validator as V;
/** Validazioni dei vincoli organizzativi configurabili dal titolare. */
final class CatalogRules
{
 public static function resources(Store $store,array $ids):array
 {
  foreach($ids as $id)if(!is_string($id)||!$store->get('resources',$id))throw new ApiError('risorsa_non_trovata',422);
  return array_values(array_unique($ids));
 }
 public static function preferences(array $items):array
 {
  $out=[];
  foreach($items as $item){$a=['categoria'=>V::enum($item,'categoria',Catalog::CATEGORIES,true),'da'=>V::time($item,'da',true),'a'=>V::time($item,'a',true),'peso'=>V::int($item,'peso',false,0,100)??40];if($a['da']>=$a['a'])throw new ApiError('fascia_non_valida',422);$out[]=$a;}
  return $out;
 }
}
