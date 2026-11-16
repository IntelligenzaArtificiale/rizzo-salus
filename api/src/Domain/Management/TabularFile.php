<?php
declare(strict_types=1);
namespace App\Domain\Management;
use App\Core\ApiError;
use DOMDocument;
use DOMXPath;
use ZipArchive;
/** CSV e primo foglio XLSX: limiti espliciti, niente formule, macro o risorse esterne. */
final class TabularFile
{
    public static function xml(string $bytes): DOMDocument
    {
        if(strlen($bytes)>8*1024*1024||stripos($bytes,'<!DOCTYPE')!==false||stripos($bytes,'<!ENTITY')!==false)throw new ApiError('documento_non_sicuro',422);
        $doc=new DOMDocument();$old=libxml_use_internal_errors(true);$ok=$doc->loadXML($bytes,LIBXML_NONET|LIBXML_NOBLANKS);libxml_clear_errors();libxml_use_internal_errors($old);
        if(!$ok)throw new ApiError('documento_non_valido',422);return $doc;
    }
    public static function read(string $bytes,string $name): array
    {
        if(strlen($bytes)>8*1024*1024)throw new ApiError('file_troppo_grande',413);
        if(str_ends_with(strtolower($name),'.xlsx'))$rows=self::xlsx($bytes);else{
            if(!mb_check_encoding($bytes,'UTF-8'))$bytes=mb_convert_encoding($bytes,'UTF-8','Windows-1252');
            $bytes=preg_replace('/^\xEF\xBB\xBF/','',$bytes);$line=strtok($bytes,"\n");$sep=substr_count($line?:'',';')>=substr_count($line?:'',',')?';':',';
            $f=fopen('php://temp','w+');fwrite($f,$bytes);rewind($f);$rows=[];
            while(($r=fgetcsv($f,0,$sep,'"',''))!==false){if(count($r)>100||count($rows)>2000)throw new ApiError('file_troppe_righe',422);if(array_filter($r,fn($v)=>trim((string)$v)!==''))$rows[]=$r;}
            fclose($f);
        }
        if(count($rows)<2)throw new ApiError('file_senza_dati',422);
        $headers=array_map(fn($v)=>trim((string)$v),array_shift($rows));
        if(count(array_unique($headers))!==count($headers)||in_array('',$headers,true))throw new ApiError('intestazioni_non_valide',422);
        return ['colonne'=>$headers,'righe'=>array_map(fn($r)=>array_combine($headers,array_pad(array_slice($r,0,count($headers)),count($headers),'')),$rows)];
    }
    private static function xlsx(string $bytes): array
    {
        $tmp=tempnam(sys_get_temp_dir(),'rizxlsx');file_put_contents($tmp,$bytes);$zip=new ZipArchive();$opened=false;
        try{
            $opened=$zip->open($tmp)===true;if(!$opened||$zip->numFiles>1000)throw new ApiError('foglio_non_valido',422);
            $total=0;for($i=0;$i<$zip->numFiles;$i++){ $st=$zip->statIndex($i);$total+=$st['size'];if($total>25*1024*1024)throw new ApiError('file_troppo_grande',413); }
            $dateStyles=[];$styles=$zip->getFromName('xl/styles.xml');
            if($styles!==false){$st=self::xml($styles);$sx=new DOMXPath($st);$custom=[];foreach($sx->query('//*[local-name()="numFmt"]') as $f)$custom[(int)$f->getAttribute('numFmtId')]=$f->getAttribute('formatCode');
                foreach($sx->query('//*[local-name()="cellXfs"]/*[local-name()="xf"]') as $i=>$xf){$format=(int)$xf->getAttribute('numFmtId');$pattern=preg_replace('/"[^"]*"|\\\\.|\[[^\]]*\]/','',$custom[$format]??'');$dateStyles[$i]=in_array($format,array_merge(range(14,22),range(27,36),range(50,58)),true)||preg_match('/[dy]/i',$pattern);}}
            $base='1899-12-30';$workbook=$zip->getFromName('xl/workbook.xml');if($workbook!==false){$wb=self::xml($workbook);$wx=new DOMXPath($wb);$pr=$wx->query('//*[local-name()="workbookPr"]')->item(0);if($pr&&in_array($pr->getAttribute('date1904'),['1','true'],true))$base='1904-01-01';}
            $strings=[];$shared=$zip->getFromName('xl/sharedStrings.xml');
            if($shared!==false){$doc=self::xml($shared);$xp=new DOMXPath($doc);foreach($xp->query('//*[local-name()="si"]') as $si){$text='';foreach($xp->query('.//*[local-name()="t"]',$si) as $t)$text.=$t->textContent;$strings[]=$text;}}
            $sheet=$zip->getFromName('xl/worksheets/sheet1.xml');if($sheet===false)throw new ApiError('primo_foglio_mancante',422);
            $doc=self::xml($sheet);$xp=new DOMXPath($doc);$rows=[];
            foreach($xp->query('//*[local-name()="sheetData"]/*[local-name()="row"]') as $row){
                $out=[];foreach($xp->query('./*[local-name()="c"]',$row) as $cell){
                    if($xp->query('./*[local-name()="f"]',$cell)->length)throw new ApiError('formule_non_ammesse',422);
                    preg_match('/^([A-Z]+)/',$cell->getAttribute('r'),$hit);$i=0;foreach(str_split($hit[1]??'A') as $ch)$i=$i*26+ord($ch)-64;$i--;
                    if($i>99)throw new ApiError('troppe_colonne',422);
                    $v=$xp->query('./*[local-name()="v"]',$cell)->item(0)?->textContent??'';
                    $type=$cell->getAttribute('t');if($type==='s')$v=$strings[(int)$v]??'';elseif($type==='inlineStr')$v=$cell->textContent;
                    if(is_numeric($v)&&!in_array($type,['s','inlineStr'],true)&&!empty($dateStyles[(int)$cell->getAttribute('s')])){if((float)$v<0||(float)$v>3000000)throw new ApiError('data_excel_non_valida',422);$v=(new \DateTimeImmutable($base,new \DateTimeZone('UTC')))->modify('+'.(int)floor((float)$v).' days')->format('Y-m-d');}
                    $out[$i]=$v;
                }
                if(!$out)continue;$padded=array_fill(0,max(array_keys($out))+1,'');foreach($out as $i=>$v)$padded[$i]=$v;$rows[]=$padded;
                if(count($rows)>2001)throw new ApiError('file_troppe_righe',422);
            }
            return $rows;
        }finally{if($opened)$zip->close();@unlink($tmp);}
    }
}
