<?php
declare(strict_types=1);
namespace App\Services;
use App\Core\ApiError;
use App\Core\Env;
use App\Store\Store;
/** Segreti cifrati, mai restituiti nelle risposte o nel registro. */
final class IntegrationSecrets
{
    public const KEYS = ['composio_api_key', 'openai_api_key', 'aruba_password', 'sts_password', 'sts_pin'];
    public function __construct(private readonly Store $store) {}
    public function get(string $key): string
    {
        $values = $this->store->get('integration_secrets', 'sec_main')['valori'] ?? [];
        $fallback = ['composio_api_key'=>'COMPOSIO_API_KEY', 'openai_api_key'=>'OPENAI_API_KEY'][$key] ?? null;
        return (string) ($values[$key] ?? ($fallback ? Env::get($fallback) : ''));
    }
    public function status(): array
    {
        $out=[];
        foreach (self::KEYS as $k) $out[$k] = $this->get($k) !== '';
        return $out;
    }
    public function save(array $input): array
    {
        $this->store->transaction(function () use ($input) {
            $rec=$this->store->get('integration_secrets', 'sec_main') ?? ['id'=>'sec_main','valori'=>[]];
            foreach ($input as $k=>$v) {
                if (!in_array($k,self::KEYS,true) || !is_string($v) || strlen($v)>4096) throw new ApiError('segreto_non_valido',422);
                if ($v === '__RIMUOVI__') unset($rec['valori'][$k]);
                elseif ($v !== '') $rec['valori'][$k]=$v;
            }
            $this->store->put('integration_secrets',$rec);
        });
        return $this->status();
    }
}
