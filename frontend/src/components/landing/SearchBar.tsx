import { Search, MapPin } from 'lucide-react';

export const SearchBar = () => (
  <div className="flex items-center bg-[#1a1a1a] border border-[#333] rounded-2xl p-2 max-w-2xl">
    <div className="flex items-center gap-3 flex-1 px-4">
      <Search size={18} className="text-gray-500" />
      <input
        type="text"
        placeholder="Poste, compétence ou mot-clé"
        className="bg-transparent text-white placeholder-gray-500 text-sm outline-none w-full py-3"
      />
    </div>
    <div className="w-px h-8 bg-[#333]" />
    <div className="flex items-center gap-3 flex-1 px-4">
      <MapPin size={18} className="text-gray-500" />
      <input
        type="text"
        placeholder="Ville ou télétravail"
        className="bg-transparent text-white placeholder-gray-500 text-sm outline-none w-full py-3"
      />
    </div>
    <button className="w-12 h-12 rounded-xl bg-[#d4a574] flex items-center justify-center hover:bg-[#c49664] transition-colors">
      <Search size={20} className="text-[#1a1a1a]" />
    </button>
  </div>
);
