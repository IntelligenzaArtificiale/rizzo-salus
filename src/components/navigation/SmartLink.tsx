/* Link che sceglie da solo: rotta interna con il router, indirizzo esterno con <a>. */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (href.startsWith("/")) return <Link to={href} className={className}>{children}</Link>;
  return <a href={href} className={className}>{children}</a>;
}
