/* Attesa breve dentro la card (verifica di un link). Usa la rotellina spin di Beautiful UI. */
import { AuthLayout } from "@/layouts/AuthLayout";

export function LoadingPanel({ label }: { label: string }) {
  return (
    <AuthLayout>
      <div className="flex items-center gap-3 py-2 text-[14px] text-ink-2" role="status">
        <span className="size-4 rounded-full border-2 border-line-strong border-t-accent anim-spin" />
        {label}
      </div>
    </AuthLayout>
  );
}
