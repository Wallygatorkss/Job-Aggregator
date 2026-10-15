import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  return (
    <header className="futuristic-line w-full bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-ultraViolet via-brightLilac to-iceBlue shadow-md shadow-ultraViolet/30" />
          <div className="text-2xl font-extrabold tracking-tight text-deepIris">
            Job<span className="text-ultraViolet">Aggregator</span>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-iris md:flex">
          <span className="cursor-pointer transition-colors hover:text-ultraViolet">Accueil</span>
          <span className="cursor-pointer transition-colors hover:text-iceBlue">Offres</span>
          <span className="cursor-pointer transition-colors hover:text-[#ff9f66]">À propos</span>
        </nav>
        <button onClick={() => navigate("/login")} className="rounded-full border border-iceBlue/45 bg-cloud px-4 py-2 text-sm font-semibold text-deepIris shadow-sm transition hover:scale-[1.02] hover:bg-lavender">
          Se connecter
        </button>
      </div>
    </header>
  )
}

export default Header