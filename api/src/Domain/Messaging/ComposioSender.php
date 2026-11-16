<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

use App\Core\Env;
use App\Services\Settings;

/**
 * Base dei tre mittenti. Lo slug dell'azione e i nomi dei campi vengono da Impostazioni → Messaggi (messaggi.composio.<canale>)
 * oppure dal .env (COMPOSIO_SLUG_<CANALE>): non sono scritti nel codice perché dipendono dall'account collegato.
 */
abstract class ComposioSender implements ChannelSender
{
    public function __construct(protected readonly ComposioClient $client, protected readonly Settings $settings, protected readonly ?\App\Services\Files $files = null)
    {
    }

    /** @return array{destinatario:string,testo:string,oggetto:?string} nomi di default dei campi dell'azione */
    abstract protected function fields(): array;

    public function send(array $message): array
    {
        $ch = $this->channel();
        $cfg = (array) $this->settings->get("messaggi.composio.$ch", []);
        $slug = (string) ($cfg['slug'] ?? '') ?: Env::get('COMPOSIO_SLUG_' . strtoupper($ch));
        if ($slug === '' || !$this->client->configured()) {
            return ['ok' => false, 'provider_id' => null, 'error' => 'canale_non_configurato', 'permanent' => true, 'cost_eur' => null];
        }
        $f = array_replace($this->fields(), (array) ($cfg['campi'] ?? []));
        $args = [$f['destinatario'] => $message['to'], $f['testo'] => $message['body']];
        if (!empty($f['oggetto']) && !empty($message['subject'])) {
            $args[$f['oggetto']] = $message['subject'];
        }
        if (!empty($message['attachments'])) {
            if (empty($cfg['campo_allegati']) || !$this->files) return ['ok'=>false,'provider_id'=>null,'error'=>'allegati_non_configurati','permanent'=>true,'cost_eur'=>null];
            $attachments=[];
            foreach($message['attachments'] as $fid) {
                $f=$this->files->read($fid);
                $attachments[]=[($cfg['allegato_nome']??'filename')=>$f['meta']['name'],($cfg['allegato_contenuto']??'content')=>base64_encode($f['bytes']),($cfg['allegato_mime']??'content_type')=>$f['meta']['mime']];
            }
            $args[$cfg['campo_allegati']]=$attachments;
        }
        foreach ((array) ($cfg['argomenti_fissi'] ?? []) as $k => $v) {
            if(is_array($v)&&isset($v['chiave']))$args[(string)$v['chiave']]=$v['valore']??'';else $args[$k]=$v;
        }
        $res = $this->client->execute($slug, $args, ($cfg['account'] ?? '') ?: Env::get('COMPOSIO_ACCOUNT_' . strtoupper($ch)));
        if (!$res['ok']) {
            return ['ok' => false, 'provider_id' => null, 'error' => $res['error'], 'permanent' => !$res['temporary'], 'cost_eur' => null];
        }
        $d = $res['data']['data'] ?? $res['data'];
        $id = $d['id'] ?? $d['message_id'] ?? $d['sid'] ?? $d['messages'][0]['id'] ?? $d['response_data']['id'] ?? null;
        return ['ok' => true, 'provider_id' => $id !== null ? (string) $id : null, 'error' => null, 'permanent' => false, 'cost_eur' => null];
    }
}
