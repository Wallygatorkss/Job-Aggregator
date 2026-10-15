import { Play } from 'lucide-react';

export const VideoCard = () => (
  <div className="bg-[#111] border border-[#222] rounded-2xl p-6 relative overflow-hidden hover:border-[#333] transition-colors">
    <div className="relative z-10">
      <div className="text-white font-medium text-lg mb-1">L'IA au service</div>
      <div className="text-white font-medium text-lg mb-4">de votre carrière</div>
      <div className="text-gray-500 text-xs leading-relaxed max-w-[180px]">
        Préparez-vous, entraînez-vous et décrochez le job de vos rêves.
      </div>
    </div>
    <div className="absolute right-4 bottom-4">
      <div className="w-14 h-14 rounded-full bg-[#d4a574] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
        <Play size={20} className="text-[#1a1a1a] ml-1" fill="#1a1a1a" />
      </div>
    </div>
    <div className="absolute right-0 top-0 w-32 h-32 opacity-10">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="80" cy="20" r="60" fill="none" stroke="#d4a574" strokeWidth="0.5" />
        <circle cx="80" cy="20" r="40" fill="none" stroke="#d4a574" strokeWidth="0.5" />
      </svg>
    </div>
  </div>
);
