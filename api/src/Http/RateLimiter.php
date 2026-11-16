<?php
declare(strict_types=1);

namespace App\Http;

use App\Core\ApiError;

/** Limite a finestra scorrevole su file, con lock: sicuro con richieste concorrenti. */
final class RateLimiter
{
    public function __construct(private readonly string $dir)
    {
        @mkdir($dir, 0700, true);
    }

    /** @throws ApiError quando il limite è superato */
    public function hit(string $bucket, string $key, int $max, int $windowSeconds): void
    {
        $file = $this->dir . '/' . preg_replace('/[^a-z0-9_-]/i', '_', $bucket) . '-' . hash('sha256', $key) . '.json';
        $h = fopen($file, 'c+');
        flock($h, LOCK_EX);
        $raw = stream_get_contents($h);
        $hits = json_decode($raw ?: '[]', true) ?: [];
        $now = time();
        $hits = array_values(array_filter($hits, static fn ($t) => $t > $now - $windowSeconds));
        if (count($hits) >= $max) {
            flock($h, LOCK_UN);
            fclose($h);
            throw new ApiError('troppi_tentativi', 429, ['riprova_tra' => max(1, min($hits) + $windowSeconds - $now)]);
        }
        $hits[] = $now;
        ftruncate($h, 0);
        rewind($h);
        fwrite($h, json_encode($hits));
        fflush($h);
        flock($h, LOCK_UN);
        fclose($h);
    }

    public function sweep(int $olderThanSeconds = 86400): void
    {
        foreach (glob($this->dir . '/*.json') ?: [] as $f) {
            if (filemtime($f) < time() - $olderThanSeconds) {
                @unlink($f);
            }
        }
    }
}
