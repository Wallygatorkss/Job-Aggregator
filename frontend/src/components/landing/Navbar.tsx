import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between px-8 py-5">
      <div className="flex items-center gap-2">
        <div className="text-white text-2xl font-bold tracking-tight">
          indeed<span className="text-[#d4a574]">_</span>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Offres d'emploi</a>
        <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Entreprises</a>
        <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Salaire</a>
        <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Découvrir</a>
        <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Carrière</a>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/login')}
          className="text-gray-300 hover:text-white text-sm transition-colors"
        >
          Se connecter
        </button>
        <button
          onClick={() => navigate('/register')}
          className="flex items-center gap-2 bg-[#f5e6d3] text-[#1a1a1a] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#e8d5c0] transition-colors"
        >
          Créer un compte
          <ArrowRight size={16} />
        </button>
      </div>
    </nav>
  );
};
