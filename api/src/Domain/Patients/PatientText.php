<?php
declare(strict_types=1);

namespace App\Domain\Patients;

/** Normalizzazione e confronto tollerante agli errori di battitura. */
final class PatientText
{
    public static function norm(string $s): string
    {
        $s = mb_strtolower(trim($s));
        $s = strtr($s, ['à' => 'a', 'á' => 'a', 'è' => 'e', 'é' => 'e', 'ì' => 'i', 'í' => 'i', 'ò' => 'o', 'ó' => 'o', 'ù' => 'u', 'ú' => 'u', 'ç' => 'c', 'ñ' => 'n']);
        return preg_replace('/[^a-z0-9 ]+/', ' ', $s) ?? '';
    }

    /** @return list<string> */
    public static function tokens(string $s): array
    {
        return array_values(array_filter(explode(' ', self::norm($s)), static fn ($t) => $t !== ''));
    }

    /** Punteggio 0..1 di quanto un token di ricerca corrisponde a un token del paziente. */
    public static function tokenScore(string $q, string $t): float
    {
        if ($q === $t) {
            return 1.0;
        }
        if (str_starts_with($t, $q)) {
            return 0.9;
        }
        if (strlen($q) >= 4) {
            $d = levenshtein($q, $t);
            if ($d <= 1) {
                return 0.8;
            }
            if ($d <= 2 && strlen($q) >= 6) {
                return 0.6;
            }
            // errore sul prefisso digitato
            $d2 = levenshtein($q, substr($t, 0, strlen($q)));
            if ($d2 <= 1) {
                return 0.7;
            }
        }
        return 0.0;
    }

    public static function digits(string $s): string
    {
        return preg_replace('/\D+/', '', $s) ?? '';
    }
}
