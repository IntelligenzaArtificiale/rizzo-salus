<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\ApiError;
use App\Core\Crypto;
use App\Core\Ids;
use App\Store\Store;

/**
 * Archivio dei file (PDF, certificati, allegati clinici, XML). Ogni file è cifrato su disco con
 * libsodium e ha un hash SHA-256 del contenuto in chiaro. I metadati stanno accanto al file.
 * Il permesso di lettura lo decide il chiamante (dominio) prima di chiamare read().
 */
final class Files
{
    private const MAX_BYTES = 15 * 1024 * 1024;
    private const ALLOWED = [
        'application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png', 'application/xml' => 'xml', 'text/xml' => 'xml',
        'application/zip' => 'zip', 'text/csv' => 'csv', 'text/plain' => 'txt',
    ];

    private string $root;

    public function __construct(private readonly Store $store)
    {
        $this->root = $store->dir() . '/_files';
        @mkdir($this->root, 0700, true);
    }

    /** @return array{id:string,name:string,mime:string,size:int,sha256:string} */
    public function put(string $bytes, string $name, string $mime, string $kind, ?string $ownerEntity = null, ?string $ownerId = null): array
    {
        if (strlen($bytes) > self::MAX_BYTES) {
            throw new ApiError('file_troppo_grande', 413);
        }
        $mime = strtolower($mime);
        if (!isset(self::ALLOWED[$mime])) {
            throw new ApiError('tipo_file_non_consentito', 415);
        }
        $this->assertContentMatches($bytes, $mime);
        $id = 'fil_' . bin2hex(random_bytes(10));
        $meta = [
            'id' => $id, 'name' => $this->safeName($name), 'mime' => $mime, 'size' => strlen($bytes), 'sha256' => hash('sha256', $bytes),
            'kind' => $kind, 'owner_entity' => $ownerEntity, 'owner_id' => $ownerId, 'at' => \App\Core\Clock::stamp(), 'by' => $this->store->actor(),
        ];
        $dir = $this->root . '/' . substr($id, 4, 2);
        @mkdir($dir, 0700, true);
        $tmp = "$dir/$id.tmp";
        file_put_contents($tmp, Crypto::sealBytes($bytes), LOCK_EX);
        chmod($tmp, 0600);
        rename($tmp, "$dir/$id.bin");
        file_put_contents("$dir/$id.json", json_encode($meta, JSON_UNESCAPED_UNICODE), LOCK_EX);
        return ['id' => $id, 'name' => $meta['name'], 'mime' => $mime, 'size' => $meta['size'], 'sha256' => $meta['sha256']];
    }

    /** @return array{meta:array,bytes:string} */
    public function read(string $id): array
    {
        $meta = $this->meta($id);
        $bin = $this->root . '/' . substr($id, 4, 2) . "/$id.bin";
        $bytes = Crypto::openBytes((string) file_get_contents($bin));
        if (hash('sha256', $bytes) !== $meta['sha256']) {
            throw new ApiError('file_alterato', 500);
        }
        return ['meta' => $meta, 'bytes' => $bytes];
    }

    public function meta(string $id): array
    {
        if (!preg_match('/^fil_[a-f0-9]{20}$/', $id)) {
            throw ApiError::notFound();
        }
        $f = $this->root . '/' . substr($id, 4, 2) . "/$id.json";
        if (!is_file($f)) {
            throw ApiError::notFound();
        }
        return json_decode((string) file_get_contents($f), true);
    }

    public function exists(string $id): bool
    {
        try {
            $this->meta($id);
            return true;
        } catch (ApiError) {
            return false;
        }
    }

    public function root(): string
    {
        return $this->root;
    }

    private function safeName(string $name): string
    {
        $name = preg_replace('/[^\p{L}\p{N}._ -]+/u', '_', basename($name)) ?? 'file';
        return mb_substr($name === '' ? 'file' : $name, 0, 120);
    }

    /** Il tipo dichiarato deve corrispondere al contenuto (niente eseguibili travestiti). */
    private function assertContentMatches(string $bytes, string $mime): void
    {
        $head = substr($bytes, 0, 8);
        $ok = match ($mime) {
            'application/pdf' => str_starts_with($head, '%PDF'),
            'image/jpeg' => str_starts_with($head, "\xFF\xD8\xFF"),
            'image/png' => str_starts_with($head, "\x89PNG"),
            'application/zip' => str_starts_with($head, 'PK'),
            'application/xml', 'text/xml' => str_contains(substr($bytes, 0, 200), '<'),
            default => !str_contains(substr($bytes, 0, 1024), "\0"),
        };
        if (!$ok) {
            throw new ApiError('contenuto_non_corrisponde', 415);
        }
    }
}
