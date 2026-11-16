// Invio singolo e feedback condiviso, indipendenti dalla cornice delle pagine.
import { useToast } from "@/components/feedback/toast-context";
import { useSubmit } from "@/lib/forms/useSubmit";
export function useAction() {
  const submit = useSubmit();
  const toast = useToast();
  return {
    ...submit,
    act: (fn: () => Promise<unknown>, message?: string) =>
      submit.run(async () => {
        try {
          await fn();
          if (message) toast.show({ tone: "success", title: message });
        } catch (e) {
          toast.show({ tone: "error", title: (e as Error).message });
        }
      }),
  };
}
