/* Contratto dei toast: chi mostra un messaggio usa useToast().show(...). */
import { createContext, useContext } from "react";

export type ToastTone = "error" | "warning" | "success" | "info";

export type ToastInput = {
  tone: ToastTone;
  title: string;
  body?: string;
  action?: { label: string; href: string };
};

export type ToastApi = { show: (toast: ToastInput) => void };

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast va usato dentro <ToastProvider>");
  return api;
}
