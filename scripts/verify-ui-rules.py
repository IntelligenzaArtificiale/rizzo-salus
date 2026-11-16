#!/usr/bin/env python3
"""Controlli statici delle regole UI che una build non vede. Uso: python3 -I scripts/verify-ui-rules.py [cartella-src]

1. Testi tecnici nei testi visibili (JSX e stringhe): UUID, hash, date ISO, chiavi snake_case,
   percorsi API, parole d'ambiente (collaudo, staging, V2, mock, lorem, TODO).
2. Superfici: SidebarNav/AppLayout solo nelle pagine dell'app; nessuna pagina in routes/site.tsx
   o routes/auth.tsx che importi AppLayout.
3. Doppioni: componenti che reimplementano Pagination o bottoni testuali «Precedente/Successiva».
4. Stati scritti come testo: parole di stato in meta/sottotitoli senza StatusPill nello stesso file.
Le eccezioni motivate si scrivono nel codice con il commento  ui-rules: consentito <motivo>.
Esce con 1 se trova problemi. Non sostituisce la revisione visiva.
"""
import re, sys
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "src").resolve()
SKIP = ("components/primitives", "components/atoms", "api/mock", "pages/dev", "app/beautifui", "email/")
TECH = [
    (r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b", "UUID"),
    (r"\b[a-z]+_[0-9a-f]{8,}\b", "identificativo con hash"),
    (r"\b20\d\d-\d\d-\d\d\b", "data ISO"),
    (r"(?i)\b(collaudo|staging|ambiente v\d|lorem ipsum|mock|todo:)\b", "testo d'ambiente o provvisorio"),
    (r"(?i)\b(endpoint|payload|tabella sql|json)\b", "termine tecnico"),
]
TEXT = re.compile(r">([^<>{}]*[A-Za-zÀ-ú][^<>{}]*)<|\b(?:title|label|placeholder|hint|description|body|message|subtitle)=\"([^\"]+)\"")
problems = []

def rel(p): return str(p.relative_to(SRC))

for f in sorted(SRC.rglob("*.tsx")):
    r = rel(f)
    if any(r.startswith(s) or s in r for s in SKIP):
        continue
    text = f.read_text()
    for n, line in enumerate(text.splitlines(), 1):
        if "ui-rules: consentito" in line or line.strip().startswith(("//", "*", "/*", "import")):
            continue
        for m in TEXT.finditer(line):
            chunk = m.group(1) or m.group(2) or ""
            for rx, what in TECH:
                if re.search(rx, chunk):
                    problems.append(f"{r}:{n}: {what} nel testo visibile → «{chunk.strip()[:70]}»")
    if re.search(r">\s*(Precedente|Successiva)\s*<", text) and r != "components/app/Pagination.tsx":
        problems.append(f"{r}: paginazione testuale «Precedente/Successiva», usa components/app/Pagination")
    if re.search(r"function\s+(Pager|Paginator|Pagination)\b", text) and r != "components/app/Pagination.tsx":
        problems.append(f"{r}: reimplementa la paginazione, usa components/app/Pagination")
    if ("SidebarNav" in text or "AppLayout" in text) and (r.startswith("pages/site") or r.startswith("pages/auth") or r.startswith("pages/blog/BlogPublic")):
        problems.append(f"{r}: superficie pubblica o di accesso che usa la cornice dell'app")
    if re.search(r"meta[:=]\s*[^\n]*\b(In attesa|Confermat[ao]|Rifiutat[ao]|Completat[ao])\b", text) and "StatusPill" not in text and "statusOf" not in text:
        problems.append(f"{r}: stato scritto come testo, usa statusOf + StatusPill")

for routes in ("routes/site.tsx", "routes/auth.tsx"):
    p = SRC / routes
    if p.exists() and re.search(r"AppLayout|SidebarNav|\barea\(", p.read_text()):
        problems.append(f"{routes}: usa la cornice dell'app")

print("\n".join(problems) if problems else "Nessun problema trovato dai controlli statici.")
print("Ricorda: questi controlli non sostituiscono la revisione visiva (docs/verifica-ui.md).")
sys.exit(1 if problems else 0)
