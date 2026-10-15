import { ArrowRight } from 'lucide-react';

export const CompanyLogos = () => {
  const companies = [
    { name: 'alan', display: 'alan' },
    { name: 'Qonto', display: 'Qonto' },
    { name: 'MIRAKL', display: 'MIRAKL' },
    { name: 'Back Market', display: 'Back\nMarket' },
    { name: 'Doctolib', display: 'Doctolib' },
    { name: 'Contentsquare', display: 'Contentsquare' },
  ];

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl px-8 py-6">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <span className="text-gray-500 text-xs uppercase tracking-wider">ILS RECRUTENT SUR INDEED</span>
        <div className="flex items-center gap-8 flex-wrap">
          {companies.map((company) => (
            <span key={company.name} className="text-gray-400 text-sm font-medium whitespace-pre-line text-center">
              {company.display}
            </span>
          ))}
        </div>
        <button className="flex items-center gap-2 text-gray-400 text-sm hover:text-white transition-colors">
          Voir toutes les entreprises
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
