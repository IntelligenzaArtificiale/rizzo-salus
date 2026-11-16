<?php
declare(strict_types=1);

namespace App\Services;

/** Registro delle attività pianificate. Ogni modulo aggiunge le sue qui sotto. */
final class Jobs
{
    public static function register(Scheduler $s, Services $svc): void
    {
        PackageJobs::register($s,$svc);
        $cfg = $svc->settings();
        $care=new \App\Domain\Messaging\CareCommunications($svc);
        $s->register('ricontatti','Ricontatti dopo le cure','Prepara le attività per contatti manuali, senza inviare WhatsApp.', ['giornaliera'=>'08:30'],fn()=>$care->refresh(),recuperoOre:24);
        $s->register('conferme_visite','Conferma visite di domani','Richiede la conferma personale con SMS.', ['giornaliera'=>(string)$cfg->get('messaggi.visite.ora_richiesta','12:00')],fn()=>$care->visitReminders(),recuperoOre:8);
        $s->register('riepilogo_medici','Visite confermate ai medici','Invia soltanto il conteggio delle visite confermate dai pazienti.', ['giornaliera'=>(string)$cfg->get('messaggi.visite.ora_riepilogo_medico','20:00')],fn()=>$care->doctorDigest(),recuperoOre:2);
        $s->register(
            'backup',
            'Copia di sicurezza',
            'Salva tutti i dati in un archivio cifrato e tiene le copie più recenti.',
            ['giornaliera' => (string) $cfg->get('backup.ora', '02:30')],
            static function () use ($svc, $cfg) {
                if (!$cfg->get('backup.attivo', true)) {
                    return 'disattivata nelle impostazioni';
                }
                $b = $svc->backup()->create('automatico');
                $removed = $svc->backup()->rotate();
                $svc->audit()->log('backup_creato', 'backup', $b['id'], null, ['tipo' => 'automatico']);
                return ['copia' => $b['id'], 'rimosse' => count($removed)];
            },
            recuperoOre: 20,
            essenziale: true,
        );
        $s->register(
            'pulizia',
            'Pulizia tecnica',
            'Elimina sessioni scadute, vecchi link e contatori di sicurezza.',
            ['giornaliera' => '03:30'],
            static function () use ($svc, $cfg) {
                return [
                    'sessioni' => \App\Http\Session::sweep($svc->dataDir . '/_sessions', (int) $cfg->get('sicurezza.sessione_minuti', 60)),
                    'link' => $svc->tokens()->sweep(),
                ];
            },
            recuperoOre: 24,
        );
    
        $s->register(
            'riepilogo_mattina',
            'Riepilogo del mattino',
            'Prepara il riepilogo della giornata per la segreteria: appuntamenti, assenze e spazi liberi.',
            ['giornaliera' => '07:30'],
            static function () use ($svc) {
                $r = $svc->aiAssist()->dailySummary(\App\Core\Clock::today());
                return ['riepilogo' => $r['id']];
            },
            recuperoOre: 6,
        );
    
        $s->register('messaggi_coda', 'Invio messaggi', 'Spedisce i messaggi in coda, con nuovi tentativi se qualcosa non va.', ['ogni_minuti' => 1],
            static fn () => $svc->gateway()->process(), recuperoOre: 1, essenziale: true);
        $s->register('variazioni', 'Variazioni agenda', 'Raccoglie i cambi di agenda e prepara un solo messaggio per paziente.', ['ogni_minuti' => 5],
            static function () use ($svc) {
                $svc->variations()->flush();
                return $svc->gateway()->process();
            }, recuperoOre: 1);
        $s->register('promemoria_settimanale', 'Promemoria settimanale', 'Ogni venerdì alle 13:00 invia ai pazienti gli appuntamenti della settimana successiva.',
            ['settimanale' => [(int) $cfg->get('messaggi.promemoria.giorno', 5), (string) $cfg->get('messaggi.promemoria.ora', '13:00')]],
            static fn () => $svc->weeklyReminder()->run(), recuperoOre: (int) $cfg->get('messaggi.promemoria.finestra_recupero_ore', 18), essenziale: true,
            attivaSe: static fn () => (bool) $cfg->get('messaggi.promemoria.attivo', true));
    }
}
