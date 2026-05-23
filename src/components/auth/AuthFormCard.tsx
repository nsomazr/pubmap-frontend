import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

/** Single auth panel card  -  method picker + form live inside one surface. */
export function AuthFormCard({ children, className = "" }: Props) {
  return <div className={`auth-form-card ${className}`.trim()}>{children}</div>;
}
