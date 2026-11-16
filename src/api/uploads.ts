/*
 * Caricamento file a blocchi (chunk): funziona con file grandi, riprende da dove si era
 * fermato e ritenta i blocchi falliti. Endpoint PHP attesi:
 * POST /upload/inizia   { nome, dimensione, tipo, blocchi } → { uploadId, ricevute }  (ricevute: blocchi già presenti, per riprendere)
 * POST /upload/parte    multipart: uploadId, indice, blocco    → { ricevute }
 * POST /upload/completa { uploadId, nome }                     → { id, url }
 * Il server controlla di nuovo tipo e dimensione: i controlli qui servono solo all'utente.
 */
import { apiPost } from "@/api/client";
import { appConfig, useMockApi } from "@/config/app";

export const CHUNK_SIZE = 1024 * 1024;
const RETRIES = 3;

export type UploadResult = { id: string; url: string };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendPart(uploadId: string, index: number, blob: Blob): Promise<boolean> {
  if (useMockApi) return (await apiPost("/upload/parte", { uploadId, indice: index })).ok;
  const form = new FormData();
  form.append("uploadId", uploadId);
  form.append("indice", String(index));
  form.append("blocco", blob);
  try {
    const res = await fetch(`${appConfig.apiBaseUrl}/upload/parte`, { method: "POST", body: form, credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Carica un file. onProgress riceve 0..1. Interrompibile con signal. */
export async function uploadFile(file: File, onProgress: (p: number) => void, signal?: AbortSignal): Promise<UploadResult> {
  const parts = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const start = await apiPost<{ uploadId: string; ricevute: number }>("/upload/inizia", { nome: file.name, dimensione: file.size, tipo: file.type, blocchi: parts });
  if (!start.ok) throw new Error(start.error);
  const { uploadId, ricevute } = start.data;

  for (let i = ricevute; i < parts; i++) {
    if (signal?.aborted) throw new Error("annullato");
    let sent = false;
    for (let attempt = 0; attempt < RETRIES && !sent; attempt++) {
      if (attempt > 0) await wait(500 * 2 ** attempt);
      sent = await sendPart(uploadId, i, file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    if (!sent) throw new Error("rete");
    onProgress((i + 1) / parts);
  }

  /* con i dati finti l'anteprima locale fa da URL del file caricato */
  const preview = useMockApi && file.type.startsWith("image/") ? await readAsDataUrl(file) : undefined;
  const done = await apiPost<UploadResult>("/upload/completa", { uploadId, nome: file.name, anteprima: preview });
  if (!done.ok) throw new Error(done.error);
  return done.data;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
