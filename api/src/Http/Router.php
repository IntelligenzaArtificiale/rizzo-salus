<?php
declare(strict_types=1);

namespace App\Http;

/**
 * Tabella delle rotte. Ogni voce: handler [Classe, metodo], perm (uno di), public, method.
 * Una rotta pubblica non richiede sessione né CSRF (ha però i propri limiti di frequenza).
 */
final class Router
{
    /** @var array<string,array{handler:array{0:class-string,1:string},perm:list<string>,public:bool,method:string}> */
    private array $routes = [];

    /** @param list<string>|string|null $perm */
    public function add(string $path, array $handler, array|string|null $perm = null, bool $public = false, string $method = 'POST'): void
    {
        $this->routes[$path] = ['handler' => $handler, 'perm' => (array) ($perm ?? []), 'public' => $public, 'method' => $method];
    }

    public function match(string $path): ?array
    {
        return $this->routes[rtrim($path, '/') ?: '/'] ?? null;
    }

    /** @return list<string> */
    public function paths(): array
    {
        return array_keys($this->routes);
    }
}
