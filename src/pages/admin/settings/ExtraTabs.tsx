/* Integrazioni: esempio di chiamata per collegare un altro sistema (Code Block di Beautiful UI). Solo per amministratori. */
import CodeBlock from "@/components/primitives/CodeBlock";
import { SettingsSection } from "@/components/app/SettingsSection";

export function Integrations() {
  const lines = [
    "POST /api/richieste/salva",
    "Content-Type: application/json",
    "",
    "{",
    '  "dati": {',
    '    "titolo": "Fornitura adesivo per piastrelle",',
    '    "cliente": "Edil Sud S.r.l.",',
    '    "categoria": "Fornitura"',
    "  }",
    "}",
  ];
  return (
    <SettingsSection title="Creare richieste da un altro sistema" description="Per chi collega un gestionale o un modulo esterno. La chiave d'accesso si chiede all'assistenza.">
      <CodeBlock variant="Code" filename="Esempio di chiamata" lines={lines} labels={{ copy: "Copia", copied: "Copiato" }} />
    </SettingsSection>
  );
}
