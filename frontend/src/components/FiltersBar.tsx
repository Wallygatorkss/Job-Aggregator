import { useEffect, useState } from "react";
import { ChevronDown, ArrowUpDown } from "lucide-react";

const filters = ["Date de publication", "Expérience", "Lieu", "Type de contrat", "Salaire"];

type FiltersBarProps = {
  onFilterChange?: (filterIndex: number) => void;
  onLocationSelect?: (locations?: string[]) => void;
  onContractChange?: (types?: string[]) => void;
  onSalaryChange?: (min?: number | null, max?: number | null) => void;
  onExperienceSelect?: (level?: string) => void;
  onSortChange?: (sort?: string) => void;
};

const contractTypes = ['CDI', 'CDD', 'Stage', 'Alternance', 'Temps partiel', 'Freelance'];

const CONTRACT_TYPE_TO_DB: Record<string, string> = {
  'CDI': 'permanent',
  'CDD': 'fixedTerm',
  'Stage': 'internship',
  'Alternance': 'apprenticeship',
  'Temps partiel': 'partTime',
  'Freelance': 'freelance',
};
const experiences = ['Tous', 'Junior', 'Confirmé', 'Senior'];
const API_URL = 'http://localhost:3000';

function FiltersBar({ onFilterChange, onLocationSelect, onContractChange, onSalaryChange, onExperienceSelect, onSortChange }: FiltersBarProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/offers/cities`)
      .then((r) => r.json())
      .then((data) => setAvailableCities(data.cities ?? []))
      .catch(() => setAvailableCities([]));
  }, []);
  const [experience, setExperience] = useState<string>('Tous');
  const [sort, setSort] = useState<string>('Pertinence');
  const MIN_SALARY = 0;
  const MAX_SALARY = 200000;
  const [salaryMin, setSalaryMin] = useState<number | null>(null);
  const [salaryMax, setSalaryMax] = useState<number | null>(null);
  const [tempMin, setTempMin] = useState<number>(MIN_SALARY);
  const [tempMax, setTempMax] = useState<number>(60000);
  const [dateOrder, setDateOrder] = useState<'recent' | 'oldest'>('recent');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState<string>('');
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      {filters.map((filter, index) => (
        <div key={filter} className="relative">
          <button
            onClick={() => {
              onFilterChange?.(index);
              setOpenIndex((cur) => (cur === index ? null : index));
            }}
            className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition border-white/10 bg-[#14161b] text-white/70 hover:border-white/20 hover:text-white`}
          >
            <span>
              {filter}
              {filter === 'Expérience' && experience !== 'Tous' ? ` · ${experience}` : ''}
              {filter === 'Date de publication' && dateOrder === 'recent' ? ' · Plus récent' : ''}
              {filter === 'Date de publication' && dateOrder === 'oldest' ? ' · Plus ancien' : ''}
            </span>
            <ChevronDown size={16} className="text-white/40" />
          </button>
          {filter === 'Lieu' && openIndex === index && (
            <div className="absolute left-0 z-50 mt-2 min-w-[240px] rounded-[12px] border border-white/10 bg-[#15161b] p-3 shadow-[0_0_24px_rgba(216,178,94,0.12)]">
              <div className="mb-2">
                <input value={locationInput} onChange={(e) => setLocationInput(e.target.value)} onKeyDown={(e) => {
                  if (e.key === 'Enter' && locationInput.trim()) {
                    const v = locationInput.trim();
                    if (!selectedLocations.includes(v)) {
                      const next = [...selectedLocations, v];
                      setSelectedLocations(next);
                      onLocationSelect?.(next);
                    }
                    setLocationInput('');
                    setOpenIndex(null);
                  }
                }} placeholder="Rechercher une ville..." className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-white/80" />
              </div>
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                {(locationInput.trim()
                  ? availableCities.filter((c) => c.toLowerCase().includes(locationInput.toLowerCase()))
                  : availableCities
                ).map((c, i, arr) => (
                  <button key={c} onClick={() => {
                    if (!selectedLocations.includes(c)) {
                      const next = [...selectedLocations, c];
                      setSelectedLocations(next);
                      onLocationSelect?.(next);
                    }
                    setOpenIndex(null);
                  }} className={`block w-full text-left px-3 py-2 text-sm transition ${i > 0 ? 'border-t border-white/10' : ''} ${selectedLocations.includes(c) ? 'bg-[#d8b25e]/8 text-white font-semibold' : 'text-white/80 hover:bg-white/5'} ${i === 0 ? 'rounded-t-[12px]' : ''} ${i === arr.length - 1 ? 'rounded-b-[12px]' : ''}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filter === 'Type de contrat' && openIndex === index && (
            <div className="absolute left-0 z-50 mt-2 min-w-[220px] rounded-[12px] border border-white/10 bg-[#15161b] p-3 shadow-[0_0_24px_rgba(216,178,94,0.12)]">
              <div className="flex flex-col gap-2">
                {contractTypes.map((ct) => (
                  <label key={ct} className="flex items-center gap-2 px-2 py-1 text-sm">
                    <input type="checkbox" checked={selectedContracts.includes(ct)} onChange={() => {
                      const next = selectedContracts.includes(ct) ? selectedContracts.filter(c => c !== ct) : [...selectedContracts, ct];
                      setSelectedContracts(next);
                    }} />
                    <span className="text-white/80">{ct}</span>
                  </label>
                ))}
                <div className="mt-2 flex gap-2">
                  <button onClick={() => {
                    const dbValues = selectedContracts.map((ct) => CONTRACT_TYPE_TO_DB[ct] ?? ct);
                    onContractChange?.(dbValues.length ? dbValues : undefined);
                    setOpenIndex(null);
                  }} className="rounded-[32px] bg-[#d8b25e] px-3 py-1 text-sm font-semibold text-[#1a1203]">Appliquer</button>
                  <button onClick={() => { setSelectedContracts([]); onContractChange?.(undefined); setOpenIndex(null); }} className="rounded-[32px] border border-white/10 px-3 py-1 text-sm">Effacer</button>
                </div>
              </div>
            </div>
          )}

          {filter === 'Salaire' && openIndex === index && (
            <div className="absolute left-0 z-50 mt-2 w-80 rounded-[12px] border border-white/10 bg-[#15161b] p-4 shadow-[0_0_24px_rgba(216,178,94,0.12)]">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-white/60">Salaire (€)</label>
                  <div className="text-sm text-white/70">{salaryMin === null ? `${tempMin.toLocaleString()}€` : `${salaryMin.toLocaleString()}€`} - {salaryMax === null ? `${tempMax.toLocaleString()}€` : `${salaryMax.toLocaleString()}€`}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <input type="range" min={MIN_SALARY} max={MAX_SALARY} step={1000} value={tempMin} onChange={(e) => {
                    const val = Number(e.target.value);
                    const newMin = Math.min(val, tempMax);
                    setTempMin(newMin);
                  }} className="w-full" />
                  <input type="range" min={MIN_SALARY} max={MAX_SALARY} step={1000} value={tempMax} onChange={(e) => {
                    const val = Number(e.target.value);
                    const newMax = Math.max(val, tempMin);
                    setTempMax(newMax);
                  }} className="w-full" />
                </div>
                <div className="mt-3 flex gap-3">
                  <button onClick={() => {
                    setSalaryMin(tempMin);
                    setSalaryMax(tempMax);
                    onSalaryChange?.(tempMin, tempMax);
                    setOpenIndex(null);
                  }} className="flex-1 rounded-[32px] bg-[#d8b25e] px-4 py-2 text-sm font-semibold text-[#1a1203]">Appliquer</button>
                  <button onClick={() => {
                    setSalaryMin(null);
                    setSalaryMax(null);
                    setTempMin(MIN_SALARY);
                    setTempMax(60000);
                    onSalaryChange?.(null, null);
                    setOpenIndex(null);
                  }} className="rounded-[32px] border border-white/10 px-4 py-2 text-sm">Effacer</button>
                </div>
              </div>
            </div>
          )}
          {filter === 'Expérience' && openIndex === index && (
            <div className="absolute left-0 z-50 mt-2 min-w-[180px] w-44 rounded-[12px] border border-white/10 bg-[#15161b] p-1 shadow-[0_0_24px_rgba(216,178,94,0.12)]">
              {experiences.map((e, i) => (
                <button key={e} onClick={() => { setExperience(e); onExperienceSelect?.(e === 'Tous' ? undefined : e); setOpenIndex(null); }} className={
                  `block w-full text-left px-3 py-2 transition duration-150 ease-in-out ${i > 0 ? 'border-t border-white/10' : ''} ` +
                  `${experience === e ? 'bg-[#d8b25e]/8 text-white font-semibold ' : 'text-white/80 hover:bg-white/5'} ` +
                  `${i === 0 ? 'rounded-t-[12px]' : ''} ${i === experiences.length - 1 ? 'rounded-b-[12px]' : ''}`
                }>{e}</button>
              ))}
            </div>
          )}

          {filter === 'Date de publication' && openIndex === index && (
            <div className="absolute left-0 z-50 mt-2 w-52 rounded-[12px] border border-white/10 bg-[#15161b] p-1 shadow-[0_0_24px_rgba(216,178,94,0.12)]">
              {['recent','oldest'].map((d, i) => (
                <button key={d} onClick={() => {
                  if (d === 'recent') { setDateOrder('recent'); setSort('Plus récent'); onSortChange?.('Plus récent'); }
                  else { setDateOrder('oldest'); setSort('Plus ancien'); onSortChange?.('Plus ancien'); }
                  setOpenIndex(null);
                }} className={
                  `block w-full text-left px-3 py-2 transition duration-150 ease-in-out ${i > 0 ? 'border-t border-white/10' : ''} ` +
                  `${(d === 'recent' && dateOrder === 'recent') || (d === 'oldest' && dateOrder === 'oldest') ? 'bg-[#d8b25e]/8 text-white font-semibold' : 'text-white/80 hover:bg-white/5'} ` +
                  `${i === 0 ? 'rounded-t-[12px]' : ''} ${i === 1 ? 'rounded-b-[12px]' : ''}`
                }>
                  <div className="flex items-center gap-2">{d === 'recent' ? <><ArrowUpDown size={16} /> Plus récent</> : 'Plus ancien'}</div>
                </button>
              ))}
            </div>
          )}

          
        </div>
      ))}

      {/* Active filters chips */}
      <div className="w-full mt-3 flex flex-wrap items-center gap-3">
        {selectedLocations.map((loc) => (
          <div key={loc} className="inline-flex items-center gap-3 rounded-full bg-white/6 px-4 py-2 text-sm text-white/90">
            <span>{loc}</span>
            <button onClick={() => { const next = selectedLocations.filter(l => l !== loc); setSelectedLocations(next); onLocationSelect?.(next.length ? next : undefined); }} className="ml-1 rounded-full bg-white/10 px-2 text-sm">✕</button>
          </div>
        ))}

        {selectedContracts.map((ct) => (
          <div key={ct} className="inline-flex items-center gap-3 rounded-full bg-white/6 px-4 py-2 text-sm text-white/90">
            <span>{ct}</span>
            <button onClick={() => {
              const next = selectedContracts.filter(c => c !== ct);
              setSelectedContracts(next);
              const dbValues = next.map((c) => CONTRACT_TYPE_TO_DB[c] ?? c);
              onContractChange?.(dbValues.length ? dbValues : undefined);
            }} className="ml-1 rounded-full bg-white/10 px-2 text-sm">✕</button>
          </div>
        ))}

        {experience && experience !== 'Tous' && (
          <div className="inline-flex items-center gap-3 rounded-full bg-white/6 px-4 py-2 text-sm text-white/90">
            <span>{experience}</span>
            <button onClick={() => { setExperience('Tous'); onExperienceSelect?.(undefined); }} className="ml-1 rounded-full bg-white/10 px-2 text-sm">✕</button>
          </div>
        )}

        {(salaryMin !== null || salaryMax !== null) && (
          <div className="inline-flex items-center gap-3 rounded-full bg-white/6 px-4 py-2 text-sm text-white/90">
            <span>Salaire: {salaryMin !== null ? salaryMin.toLocaleString() + '€' : `${tempMin.toLocaleString()}€`} - {salaryMax !== null ? salaryMax.toLocaleString() + '€' : `${tempMax.toLocaleString()}€`}</span>
            <button onClick={() => { setSalaryMin(null); setSalaryMax(null); onSalaryChange?.(null, null); }} className="ml-1 rounded-full bg-white/10 px-2 text-sm">✕</button>
          </div>
        )}

        {sort && sort !== 'Pertinence' && (
          <div className="inline-flex items-center gap-3 rounded-full bg-white/6 px-4 py-2 text-sm text-white/90">
            <span>{sort}</span>
            <button onClick={() => { setSort('Pertinence'); setDateOrder('recent'); onSortChange?.('Pertinence'); }} className="ml-1 rounded-full bg-white/10 px-2 text-sm">✕</button>
          </div>
        )}

        {/* Clear all button */}
        {(selectedLocations.length > 0 || selectedContracts.length > 0 || (experience && experience !== 'Tous') || salaryMin !== null || salaryMax !== null || (sort && sort !== 'Pertinence')) && (
          <button onClick={() => {
            setSelectedLocations([]);
            setSelectedContracts([]);
            setExperience('Tous');
            setSalaryMin(null);
            setSalaryMax(null);
            setTempMin(MIN_SALARY);
            setTempMax(60000);
            setSort('Pertinence');
            setDateOrder('recent');
            onLocationSelect?.(undefined);
            onContractChange?.(undefined);
            onExperienceSelect?.(undefined);
            onSalaryChange?.(null, null);
            onSortChange?.('Pertinence');
          }} className="ml-1 rounded-full border border-white/10 px-4 py-2 text-sm">Effacer tout</button>
        )}
      </div>
    </div>
  );
}

export default FiltersBar;
