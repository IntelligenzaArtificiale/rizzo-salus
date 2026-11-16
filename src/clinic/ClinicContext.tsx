// Sessione verificata dal server e catalogo reale della copia indipendente.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, setCsrf, type Data } from "./api";
type State = {
  user: Data | null;
  loading: boolean;
  catalog: Data;
  can: (p: string) => boolean;
  login: (email: string, password: string, codice?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};
const Context = createContext<State | null>(null);
export function ClinicProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [catalog, setCatalog] = useState<Data>({ professionisti: [], terapie: [] });
  const load = async (u: Data) => {
    setCsrf(u.csrf);
    setUser(u);
    setCatalog(await api("/catalogo/elenco"));
  };
  useEffect(() => {
    api("/auth/sessione")
      .then(load)
      .catch(() => {
        setUser(null);
        setCsrf("");
      })
      .finally(() => setLoading(false));
    const expire = () => {
      setUser(null);
      setCsrf("");
    };
    window.addEventListener("clinic-expired", expire);
    return () => window.removeEventListener("clinic-expired", expire);
  }, []);
  return (
    <Context.Provider
      value={{
        user,
        loading,
        catalog,
        can: (p) => Boolean(user?.permessi?.includes(p)),
        login: async (email, password, codice) =>
          load(await api("/auth/login", { email, password, codice })),
        logout: async () => {
          await api("/auth/logout");
          setUser(null);
          setCsrf("");
        },
        refresh: async () => load(await api("/auth/sessione")),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useClinic() {
  const c = useContext(Context);
  if (!c) throw new Error("ClinicProvider richiesto");
  return c;
}
