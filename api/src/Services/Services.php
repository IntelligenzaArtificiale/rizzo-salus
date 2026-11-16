<?php
declare(strict_types=1);

namespace App\Services;

use App\Domain\Messaging\{ComposioClient, EmailSender, Lines, MessageGateway, Notified, SmsSender, Templates, Variations, WeeklyReminder, WhatsAppSender};
use App\Domain\Planning\{AiAssist, AiClient, AvailabilityParser, Planner};
use App\Domain\Agenda\{Agenda, Appointments, Checker, CopyWeek, AgendaStats};
use App\Domain\Billing\{BillingExports, BillingStats, Compensations, Invoices};
use App\Domain\Assistant\Assistant;
use App\Domain\Calendar\Hours;
use App\Domain\Catalog\{Catalog, Seed};
use App\Domain\Patients\{Episodes, Patients};

use App\Http\RateLimiter;
use App\Store\Store;

/** Contenitore dei servizi: costruzione pigra, un'istanza per richiesta. */
final class Services
{
    public readonly Store $store;
    public readonly string $dataDir;
    private array $memo = [];
    /** @var callable|null sostituto della chiamata di rete verso OpenAI (solo per le prove) */
    public $aiTransport = null;
    /** @var callable|null sostituto della chiamata di rete verso Composio (solo per le prove) */
    public $composioTransport = null;

    public function __construct(Store|string $store)
    {
        $this->store = $store instanceof Store ? $store : new Store($store);
        $this->dataDir = $this->store->dir();
    }

    /** @template T of object @param class-string<T> $class @param callable():T $make @return T */
    private function once(string $class, callable $make): object
    {
        return $this->memo[$class] ??= $make();
    }

    public function secrets(): IntegrationSecrets
    {
        return $this->once(IntegrationSecrets::class, fn () => new IntegrationSecrets($this->store));
    }

    public function settings(): Settings
    {
        return $this->once(Settings::class, fn () => new Settings($this->store));
    }

    public function audit(): Audit
    {
        return $this->once(Audit::class, fn () => new Audit($this->store));
    }

    public function tokens(): Tokens
    {
        return $this->once(Tokens::class, fn () => new Tokens($this->store));
    }

    public function outbox(): Outbox
    {
        return $this->once(Outbox::class, fn () => new Outbox($this->store));
    }

    public function users(): Users
    {
        return $this->once(Users::class, fn () => new Users($this->store, $this->settings()));
    }

    public function limiter(): RateLimiter
    {
        return $this->once(RateLimiter::class, fn () => new RateLimiter($this->dataDir . '/_ratelimit'));
    }

    public function auth(): Auth
    {
        return $this->once(Auth::class, fn () => new Auth($this->store, $this->users(), $this->settings(), $this->audit(), $this->tokens(), $this->outbox(), $this->limiter()));
    }

    public function files(): Files
    {
        return $this->once(Files::class, fn () => new Files($this->store));
    }

    public function backup(): Backup
    {
        return $this->once(Backup::class, fn () => new Backup($this->store, $this->settings()));
    }

    public function export(): Export
    {
        return $this->once(Export::class, fn () => new Export($this->store, $this->files()));
    }

    public function scheduler(): Scheduler
    {
        return $this->once(Scheduler::class, function () {
            $s = new Scheduler($this->store, $this->settings());
            Jobs::register($s, $this);
            return $s;
        });
    }

    /** Può l'utente del contesto leggere questo file? Le regole per i documenti dei pazienti si aggiungono per modulo. */
    public function fileAccess(\App\Http\Context $c, array $meta): bool
    {
        return match ($meta['kind']) {
            'esportazione' => $c->can('backup.gestisci'),
            default => FileAccess::allowed($this->store, $c, $meta),
        };
    }

    public function hours(): Hours
    {
        return $this->once(Hours::class, fn () => new Hours($this->settings()));
    }

    public function catalog(): Catalog
    {
        return $this->once(Catalog::class, fn () => new Catalog($this->store));
    }

    public function seed(): Seed
    {
        return $this->once(Seed::class, fn () => new Seed($this->store));
    }

    public function patients(): Patients
    {
        return $this->once(Patients::class, fn () => new Patients($this->store));
    }

    public function appointments(): Appointments
    {
        return $this->once(Appointments::class, fn () => new Appointments($this->store));
    }

    public function invoices(): Invoices
    {
        return $this->once(Invoices::class, fn () => new Invoices($this->store, $this->appointments(), $this->settings(), $this->files()));
    }

    public function compensations(): Compensations
    {
        return $this->once(Compensations::class, fn () => new Compensations($this->store, $this->appointments()));
    }

    public function billingStats(): BillingStats
    {
        return $this->once(BillingStats::class, fn () => new BillingStats($this->store, $this->appointments()));
    }

    public function billingExports(): BillingExports
    {
        return $this->once(BillingExports::class, fn () => new BillingExports($this->store, $this->files(), $this->settings()));
    }

    public function assistant(): Assistant
    {
        return $this->once(Assistant::class, fn () => new Assistant());
    }

    public function episodes(): Episodes
    {
        return $this->once(Episodes::class, fn () => new Episodes($this->store, $this->appointments(), $this->patients()));
    }

    public function checker(): Checker
    {
        return $this->once(Checker::class, fn () => new Checker($this->store, $this->settings(), $this->hours(), $this->appointments()));
    }

    public function agenda(): Agenda
    {
        return $this->once(Agenda::class, function () {
            $a = new Agenda($this->store, $this->appointments(), $this->checker(), $this->patients(), $this->episodes());
            $a->listen(fn (string $e, ?array $b, ?array $x) => $this->variations()->onEvent($e, $b, $x));
            $a->listen(fn (string $e, ?array $b, ?array $x) => (new \App\Domain\Management\Stock($this))->appointment($b,$x));
            $a->listen(fn (string $e, ?array $b, ?array $x) => \App\Domain\Patients\BookingNotifications::agenda($this,$e,$b,$x));
            return $a;
        });
    }

    public function copyWeek(): CopyWeek
    {
        return $this->once(CopyWeek::class, fn () => new CopyWeek($this->store, $this->appointments(), $this->checker(), $this->hours(), $this->agenda()));
    }

    public function agendaStats(): AgendaStats
    {
        return $this->once(AgendaStats::class, fn () => new AgendaStats($this->store, $this->appointments(), $this->hours()));
    }

    public function planner(): Planner
    {
        return $this->once(Planner::class, fn () => new Planner($this->store, $this->appointments(), $this->hours(), $this->agenda(), $this->settings()));
    }

    public function ai(): AiClient
    {
        return $this->once(AiClient::class, fn () => new AiClient($this->store, $this->settings(), $this->aiTransport));
    }

    public function aiAssist(): AiAssist
    {
        return $this->once(AiAssist::class, fn () => new AiAssist($this->store, $this->ai(), new AvailabilityParser(), $this->agendaStats(), $this->hours()));
    }

    public function composio(): ComposioClient
    {
        return $this->once(ComposioClient::class, fn () => new ComposioClient($this->composioTransport, $this->secrets()));
    }

    public function templates(): Templates
    {
        return $this->once(Templates::class, fn () => new Templates($this->store));
    }

    public function gateway(): MessageGateway
    {
        return $this->once(MessageGateway::class, function () {
            $c = $this->composio();
            $s = $this->settings();
            return new MessageGateway($this->store, $s, $this->templates(), ['whatsapp' => new WhatsAppSender($c, $s), 'sms' => new SmsSender($c, $s), 'email' => new EmailSender($c, $s, $this->files())]);
        });
    }

    public function notified(): Notified
    {
        return $this->once(Notified::class, fn () => new Notified($this->store));
    }

    public function lines(): Lines
    {
        return $this->once(Lines::class, fn () => new Lines($this->store));
    }

    public function weeklyReminder(): WeeklyReminder
    {
        return $this->once(WeeklyReminder::class, fn () => new WeeklyReminder($this->store, $this->settings(), $this->appointments(), $this->gateway(), $this->tokens(), $this->notified(), $this->lines()));
    }

    public function variations(): Variations
    {
        return $this->once(Variations::class, fn () => new Variations($this->store, $this->settings(), $this->gateway(), $this->notified(), $this->lines()));
    }
}
