<?php
declare(strict_types=1);

use App\Http\{Context, Request};
use App\Http\Controllers\{EpisodesController, PatientsController};
use App\Domain\Patients\Documents;

$patient = $s->patients()->create(['nome' => 'Profilo', 'cognome' => 'Collaudo', 'data_nascita' => '1981-04-09']);
$input = ['id' => $patient['id'], 'revision' => $patient['revision'], 'voci' => ['esami' => 'Annotazione di prova']];
$withBody = static fn(Context $ctx, array $body): Context => new Context(
    new Request('POST', '/test', $body), $ctx->svc, $ctx->session, $ctx->user, $ctx->perms
);
$patientsController = new PatientsController();
$patientsController->anamnesi($withBody($c, $input));
fails(fn() => $patientsController->anamnesi($withBody($c, $input)), 'revisione_vecchia');
fails(fn() => $patientsController->anamnesi($withBody($fc, $input)), 'non_autorizzato');
$s->patients()->attachProfessional($patient['id'], $fc->user()['professional_id']);
$current = $s->store->get('patients', $patient['id']);
ok($current['anamnesi_voci'] === $input['voci'], 'anamnesi strutturata ricaricata');
ok(!array_key_exists('anamnesi_voci', $s->patients()->present($fc, $current)), 'anamnesi filtrata per ruolo');

$docs = new Documents($s);
$template = $docs->saveTemplate(['nome' => 'Dati paziente', 'tipo' => 'altro', 'versione' => '1', 'attivo' => true, 'testo' => '{{nome}} · {{data_nascita}}']);
$preview = $docs->compilaModello($c, $patient, $template['id']);
$document = $docs->save($c, ['patient_id' => $patient['id'], 'titolo' => 'Facsimile', 'modello_id' => $template['id']]);
ok($preview['compilato'] === 'Profilo · 09/04/1981' && $document['contenuto'] === $preview['compilato'], 'anteprima e documento salvato con la stessa data di nascita');

$episodeInput = ['patient_id' => $patient['id'], 'titolo' => 'Percorso di prova', 'terapie' => [['therapy_type_id' => $therapy['id'], 'sedute_previste' => 3]], 'distretti' => ['posteriore_lombare']];
$episode = $s->episodes()->save($episodeInput, null, null);
unset($episodeInput['distretti']);
$episodeInput['terapie'] = $episode['therapies'];
$updated = $s->episodes()->save($episodeInput, $episode['id'], $episode['revision']);
ok($updated['distretti'] === ['posteriore_lombare'], 'un aggiornamento da una scheda precedente conserva i distretti');
ok(!isset(EpisodesController::present($fc, $updated)['distretti']), 'distretti filtrati per ruolo');
$episodeInput['distretti'] = ['zona_inesistente'];
fails(fn() => $s->episodes()->save($episodeInput, $episode['id'], $updated['revision']), 'distretti_non_validi');
