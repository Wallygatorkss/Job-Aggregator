import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

type PageShellProps = {
  title: string;
  subtitle?: string;
  description?: string;
  children: ReactNode;
};

function PageShell({ title, subtitle, description, children }: PageShellProps) {
  return (
    <div className="relative min-h-screen bg-[#0b0d10] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70 z-0">
        <div className="absolute left-[-10%] top-20 h-72 w-72 rounded-full bg-[#f6d889]/10 blur-3xl" />
        <div className="absolute right-[-5%] top-40 h-96 w-96 rounded-full bg-[#f6d889]/5 blur-[120px]" />
        <div className="absolute right-10 top-[30rem] h-40 w-40 rounded-full bg-[#f6d889]/10 blur-3xl" />
      </div>
      <div className="gold-particles pointer-events-none absolute inset-0 z-0" />

      <div className="relative z-10 min-h-screen">
        <Sidebar />

        <main className="min-h-screen px-8 py-8 lg:pl-[120px]">
          <header className="mb-10 flex flex-col gap-3">
            {subtitle ? (
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                {subtitle}
              </span>
            ) : null}
            <h1 className="text-3xl font-semibold text-white">{title}</h1>
            {description ? (
              <p className="max-w-2xl text-sm text-white/60">{description}</p>
            ) : null}
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}

export default PageShell;
