<?php
declare(strict_types=1);

namespace App\Http;

use App\Auth\Permissions;
use App\Core\ApiError;
use App\Core\Env;
use App\Services\Services;

/** Applicazione HTTP: instrada, autentica, controlla CSRF e permessi, traduce gli errori in risposte. */
final class App
{
    public function __construct(private readonly Services $svc, private readonly Router $router, private readonly ?\Closure $logger = null)
    {
    }

    public function handle(Request $req): Response
    {
        $session = null;
        $response = $this->dispatch($req, $session);
        if ($session !== null) {
            $session->save();
            if ($session->isDestroyed()) {
                $response->cookies[] = [Session::COOKIE, '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']];
            } elseif ($session->isNew && $session->get('user_id') !== null) {
                $secure = str_starts_with(Env::get('APP_URL'), 'https');
                $response->cookies[] = [Session::COOKIE, $session->id(), $session->cookieOptions($secure, 0)];
            }
        }
        return $this->secure($response, $req);
    }

    private function dispatch(Request $req, ?Session &$session = null): Response
    {
        try {
            $route = $this->router->match($req->path);
            if ($route === null) {
                return Response::error('non_trovato', 404);
            }
            if ($route['method'] !== '*' && $req->method !== $route['method']) {
                return Response::error('metodo_non_consentito', 405);
            }
            $this->svc->limiter()->hit('api-ip', $req->ip, 600, 60);
            $this->svc->audit()->withIp($req->ip);

            $idle = (int) $this->svc->settings()->get('sicurezza.sessione_minuti', 60);
            $session = Session::open($this->svc->dataDir . '/_sessions', $req->cookies[Session::COOKIE] ?? null, $idle);

            $user = null;
            if ($uid = $session->get('user_id')) {
                $u = $this->svc->users()->get($uid);
                if ($u !== null && $u['attivo'] && empty($u['deleted_at'])) {
                    $user = $u;
                } else {
                    $session->forget('user_id');
                }
            }
            $perms = $user ? $this->svc->users()->permissions($user) : [];
            $ctx = new Context($req, $this->svc, $session, $user, $perms);

            if (!$route['public']) {
                if ($user === null) {
                    return Response::error('non_autenticato', 401);
                }
                if ($req->method !== 'GET') {
                    $token = $req->header('x-csrf-token') ?? '';
                    if (!hash_equals($session->csrf(), $token)) {
                        return Response::error('csrf', 403);
                    }
                }
                if ($route['perm'] !== []) {
                    $ctx->need(...$route['perm']);
                }
                $this->svc->store->actAs($user['id']);
            }

            [$class, $method] = $route['handler'];
            $result = (new $class())->$method($ctx);
            return $result instanceof Response ? $result : Response::ok($result ?? []);
        } catch (ApiError $e) {
            return Response::error($e->errorCode, $e->status, $e->extra);
        } catch (\Throwable $e) {
            ($this->logger ?? static fn () => null)($e);
            return Response::error('errore_interno', 500);
        }
    }

    private function secure(Response $r, Request $req): Response
    {
        $framing = "frame-ancestors 'none'";
        $r->headers += [
            'X-Content-Type-Options' => 'nosniff',
            'Referrer-Policy' => 'same-origin',
            'Cache-Control' => 'no-store',
            'Permissions-Policy' => 'camera=(), microphone=(), geolocation=()',
            'Content-Security-Policy' => "default-src 'none'; $framing",
            'X-Frame-Options' => 'DENY',
        ];
        if (str_starts_with(Env::get('APP_URL'), 'https')) {
            $r->headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
        }
        return $r;
    }
}
