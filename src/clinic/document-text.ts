// Estrazione nel browser con CDN versionati; i documenti non vengono inviati al CDN.
import type { Data } from "./api";
const PDF_JS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.min.mjs";
const PDF_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs";
const MAMMOTH = "https://cdn.jsdelivr.net/npm/mammoth@1.11.0/mammoth.browser.min.js";
let mammothLoad: Promise<Data> | undefined;
async function wordLibrary(): Promise<Data> {
  if ((window as unknown as Data).mammoth) return (window as unknown as Data).mammoth;
  if (!mammothLoad) mammothLoad = new Promise((resolve, reject) => {
    const script = document.createElement("script"); script.src = MAMMOTH; script.crossOrigin = "anonymous";
    script.onload = () => resolve((window as unknown as Data).mammoth);
    script.onerror = () => { script.remove(); mammothLoad = undefined; reject(new Error("Non riesco a caricare il lettore Word. Controlla la connessione e riprova.")); };
    document.head.append(script);
  });
  return mammothLoad;
}
export async function extractDocumentText(file: File): Promise<string> {
  let text = "";
  if (/\.txt$/i.test(file.name)) text = await file.text();
  else if (/\.docx$/i.test(file.name)) text = (await (await wordLibrary()).extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
  else if (/\.pdf$/i.test(file.name)) {
    const pdfjs = await import(/* @vite-ignore */ PDF_JS);
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
    try {
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n), content = await page.getTextContent();
        text += content.items.map((x: Data) => (x.str || "") + (x.hasEOL ? "\n" : " ")).join("") + "\n\n";
        if (text.length > 500000) throw new Error("Il documento contiene troppo testo. Dividilo in più procedure.");
        page.cleanup();
      }
    } finally { await pdf.destroy(); }
  } else throw new Error("Scegli un PDF, un documento Word .docx oppure un file TXT.");
  text = text.replace(/\u0000/g, "").trim();
  if (!text) throw new Error("Non ho trovato testo leggibile. Per una scansione, incolla o trascrivi il contenuto della procedura.");
  if (text.length > 500000) throw new Error("Dividi questo documento in più procedure prima di salvarlo.");
  return text;
}
