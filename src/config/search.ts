/** Ricerca trasversale solo nei punti di ingresso; liste e form usano i propri controlli. */
export const GLOBAL_SEARCH_ROUTES = ["/admin", "/area"] as const;

export function hasGlobalSearch(pathname: string): boolean {
  return GLOBAL_SEARCH_ROUTES.some((route) => pathname === route);
}
