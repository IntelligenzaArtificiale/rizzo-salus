<?php
declare(strict_types=1);
namespace App\Domain\Assistant;

/** Pseudonimi reversibili soltanto sul server, anche per nuovi recapiti digitati. */
final class OperatorPrivacy
{
    private array $values = [];
    public function __construct(private readonly array $aliases) {}
    public function mask(string $text): string
    {
        $names = [];
        foreach ($this->aliases as $code => $variants) foreach ($variants as $name) {
            if ($name !== '' && mb_strlen($name) > 1) $names[$name][] = $code;
        }
        uksort($names, static fn ($a, $b) => mb_strlen($b) <=> mb_strlen($a));
        foreach ($names as $name => $codes) {
            if (count(array_unique($codes)) !== 1) continue;
            $text = preg_replace('/(?<![\pL\pN])' . preg_quote($name, '/') . '(?![\pL\pN])/iu', $codes[0], $text) ?? $text;
        }
        foreach (['/\S+@\S+\.\S+/', '/\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/i', '/\+?\d[\d ]{7,}\d/'] as $pattern) {
            $text = preg_replace_callback($pattern, function ($m) {
                $found = array_search($m[0], $this->values, true);
                if ($found !== false) return $found;
                $code = 'DATO_' . (count($this->values) + 1);
                $this->values[$code] = $m[0];
                return $code;
            }, $text) ?? $text;
        }
        return $text;
    }
    public function restore(string $text): string
    {
        $text = preg_replace_callback('/\bP(\d+)\b/', fn ($m) => $this->aliases['P' . $m[1]][0] ?? $m[0], $text) ?? $text;
        return preg_replace_callback('/\bDATO_\d+\b/', fn ($m) => $this->values[$m[0]] ?? $m[0], $text) ?? $text;
    }
}
