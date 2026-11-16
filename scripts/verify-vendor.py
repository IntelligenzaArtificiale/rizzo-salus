#!/usr/bin/env python3
"""Confronta i file Beautiful UI del boilerplate con un clone del repository ufficiale.

Uso: python3 -I scripts/verify-vendor.py <clone-beautiful-ui> [--scrivi]
Stampa per ogni file: identico, modificato (con i punti [boilerplate]) o assente a monte,
e i componenti a monte che il boilerplate non include. Con --scrivi aggiorna docs/provenienza.json.
Non scarica nulla: il clone va preparato a parte (git clone https://github.com/slev12397/beautiful-ui).
"""
import hashlib, json, subprocess, sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GROUPS = ["atoms", "primitives"]


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__); return 2
    up = Path(sys.argv[1]).resolve()
    commit = subprocess.run(["git", "-C", str(up), "log", "-1", "--format=%H %cs"], capture_output=True, text=True).stdout.strip()
    version = json.loads((up / "package.json").read_text()).get("version", "?")
    rows, missing_here = [], []
    for g in GROUPS:
        local_dir, up_dir = ROOT / "src/components" / g, up / "components" / g
        for f in sorted(local_dir.glob("*.tsx")):
            u = up_dir / f.name
            marks = f.read_text().count("[boilerplate]")
            if not u.exists():
                state = "assente a monte"
            elif sha(u) == sha(f):
                state = "identico"
            else:
                state = "modificato"
            rows.append({"file": f"src/components/{g}/{f.name}", "stato": state, "patch_marcate": marks, "sha256": sha(f)})
        for u in sorted(up_dir.glob("*.tsx")):
            if not (local_dir / u.name).exists():
                missing_here.append(f"components/{g}/{u.name}")
    for r in rows:
        flag = "" if r["stato"] != "modificato" or r["patch_marcate"] else "  ← modifica senza marcatura [boilerplate]"
        print(f'{r["stato"]:16} {r["patch_marcate"]:2}  {r["file"]}{flag}')
    print(f"\nA monte ma non nel boilerplate ({len(missing_here)}): " + (", ".join(missing_here) or "nessuno"))
    print(f"Repository: {commit} · versione package {version}")
    if "--scrivi" in sys.argv:
        out = {"verificato": str(date.today()), "repository": "https://github.com/slev12397/beautiful-ui", "commit": commit,
               "versione_package": version, "registro": "https://www.beautifului.dev/r/<id>.json", "licenza": "MIT",
               "file": rows, "a_monte_non_inclusi": missing_here}
        (ROOT / "docs/provenienza.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
        print("docs/provenienza.json aggiornato")
    unmarked = [r for r in rows if r["stato"] == "modificato" and not r["patch_marcate"]]
    return 1 if unmarked else 0


if __name__ == "__main__":
    sys.exit(main())
