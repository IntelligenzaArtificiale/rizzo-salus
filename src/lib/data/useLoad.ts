/*
 * Carica dati da una funzione API e ne espone lo stato: loading, data, error, reload.
 * Una richiesta superata da una più recente viene ignorata.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResult } from "@/api/client";

export function useLoad<T>(load: () => Promise<ApiResult<T>>, deps: unknown[] = []) {
  const [state, setState] = useState<{ loading: boolean; data?: T; error?: string }>({ loading: true });
  const ticket = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++ticket.current;
    setState((s) => ({ ...s, loading: true }));
    const result = await load();
    if (mine !== ticket.current) return;
    setState(result.ok ? { loading: false, data: result.data } : { loading: false, error: result.error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload, setData: (data: T) => setState({ loading: false, data }) };
}
