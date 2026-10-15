import { Search } from "lucide-react";
import { useEffect, useState } from "react";

type PageHeaderProps = {
  total?: number | null;
  displayed?: number;
  collapsed?: boolean;
  onSearch?: (q: string) => void;
};

function PageHeader({ total, displayed, collapsed, onSearch }: PageHeaderProps) {
  const [term, setTerm] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      onSearch?.(term);
    }, 300);
    return () => clearTimeout(t);
  }, [term, onSearch]);
  return (
    <div className={`sticky top-0 z-20 bg-transparent ${collapsed ? 'pt-0' : 'pt-4'}`}>
      <div className={`transition-all duration-200 overflow-hidden ${collapsed ? 'max-h-0 mb-0' : 'max-h-[220px] mb-4'}`}>
        <div className="flex flex-col gap-">
          <div className="flex w-full justify-center">
            <div className="group w-full max-w-3xl">
              <div className={`sticky top-4 z-30 flex items-center gap-6 rounded-full border border-white/10 bg-[#15161b] px-7 text-sm text-white/70 shadow-[0_0_24px_rgba(216,178,94,0.15)] transition-all duration-300 group-hover:border-[#d8b25e]/60 group-hover:bg-[#1b1d23] group-hover:shadow-[0_0_36px_rgba(216,178,94,0.3)] ${collapsed ? 'py-2 opacity-0 pointer-events-none' : 'py-3.5 opacity-100'}`}>
                <Search size={18} className="text-[#d8b25e]" aria-hidden="true" />
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Rechercher un poste, une compétence..."
                  className="w-full bg-transparent text-base text-white/90 outline-none transition-all duration-300 group-hover:tracking-wide focus:tracking-wide"
                />
              </div>
            </div>
          </div>

          <div className="flex w-full justify-center">
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Offres d'emploi</p>
              <h1 className="text-2xl font-semibold text-white">
                {displayed != null && total != null ? `${displayed.toLocaleString()} / ${total.toLocaleString()} résultats` : (total != null ? `${total.toLocaleString()} résultats` : 'Chargement...')}
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
