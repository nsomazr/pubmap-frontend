interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function PublicSection({ title, subtitle, children, className = "" }: Props) {
  return (
    <section className={`gre-public-card p-5 sm:p-6 ${className}`}>
      <header className="mb-4">
        <h2 className="text-base font-semibold text-ink sm:text-lg">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
