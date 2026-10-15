import { useState, useEffect, useRef, type ComponentType } from 'react';
import { Search, MapPin, ArrowRight, Zap, Sparkles, Users, Shield, Trophy, RefreshCw, Code, Database, Cloud, Target, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type BgParticle = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
};

type WaveParticle = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  phase: number;
};

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const bgParticles: BgParticle[] = [];
    const bgCount = 800;

    for (let i = 0; i < bgCount; i += 1) {
      bgParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.4 + 0.05,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.1,
      });
    }

    const waveParticles: WaveParticle[] = [];
    const waveCount = 600;

    for (let i = 0; i < waveCount; i += 1) {
      const x = Math.random() * canvas.width;
      const t = x / canvas.width;
      const waveY = canvas.height * 0.58 + Math.sin(t * Math.PI * 3) * 40 + Math.sin(t * Math.PI * 7) * 20;
      const y = waveY + (Math.random() - 0.5) * 60;

      waveParticles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const linePositions = [0.08, 0.18, 0.32, 0.48];

    const rings = [
      { rx: 180, ry: 280, rot: 0.3, dots: 6, radius: 1.5 },
      { rx: 260, ry: 380, rot: -0.2, dots: 8, radius: 2 },
      { rx: 340, ry: 480, rot: 0.5, dots: 10, radius: 1.5 },
    ];

    const animate = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      time += 0.006;

      bgParticles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 170, 120, ${p.opacity})`;
        ctx.fill();
      });

      waveParticles.forEach((p) => {
        const t = p.baseX / canvas.width;
        const waveOffset = Math.sin(t * Math.PI * 3 + time * 0.8) * 30 + Math.sin(t * Math.PI * 7 + time * 1.2) * 15;
        p.y = p.baseY + waveOffset + Math.sin(time + p.phase) * 8;
        p.x = p.baseX + Math.cos(time * 0.3 + p.phase) * 5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 130, ${p.opacity})`;
        ctx.fill();
      });

      ctx.strokeStyle = 'rgba(212, 175, 130, 0.08)';
      ctx.lineWidth = 0.5;

      for (let i = 0; i < waveParticles.length; i += 3) {
        const p1 = waveParticles[i];

        for (let j = i + 1; j < Math.min(i + 8, waveParticles.length); j += 1) {
          const p2 = waveParticles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < 40) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      linePositions.forEach((pos, idx) => {
        const x = canvas.width * pos;
        const waveBase = canvas.height * 0.58 + Math.sin(pos * Math.PI * 3 + time * 0.8) * 30;
        const lineHeight = 60 + idx * 25;
        const topY = waveBase - lineHeight;

        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, waveBase);
        ctx.strokeStyle = 'rgba(212, 175, 130, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, waveBase, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212, 175, 130, 0.6)';
        ctx.fill();

        const glow = 3 + Math.sin(time * 2 + idx) * 1;

        ctx.beginPath();
        ctx.arc(x, topY, glow, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212, 175, 130, 0.15)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, topY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 220, 170, 0.9)';
        ctx.fill();
      });

      const centerX = canvas.width * 0.82;
      const centerY = canvas.height * 0.42;

      rings.forEach((ring, rIdx) => {
        const rotation = time * (0.15 + rIdx * 0.08) + ring.rot;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, ring.rx, ring.ry, rotation, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212, 175, 130, ${0.15 - rIdx * 0.03})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        for (let d = 0; d < ring.dots; d += 1) {
          const angle = (d / ring.dots) * Math.PI * 2 + rotation;
          const dotX = centerX + Math.cos(angle) * ring.rx;
          const dotY = centerY + Math.sin(angle) * ring.ry;

          ctx.beginPath();
          ctx.arc(dotX, dotY, ring.radius * 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(212, 175, 130, 0.1)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(dotX, dotY, ring.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 220, 170, ${0.7 - rIdx * 0.15})`;
          ctx.fill();
        }
      });

      const gradient = ctx.createRadialGradient(
        canvas.width * 0.35,
        canvas.height * 0.55,
        0,
        canvas.width * 0.35,
        canvas.height * 0.55,
        300,
      );

      gradient.addColorStop(0, 'rgba(212, 175, 130, 0.04)');
      gradient.addColorStop(1, 'rgba(212, 175, 130, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-screen pointer-events-none" />;
};


const Navbar = () => {
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

type StatBadgeProps = {
  icon: ComponentType<{ size?: number; className?: string }>;
  value: string;
  label: string;
};

const StatBadge = ({ icon: Icon, value, label }: StatBadgeProps) => (
  <div className="flex items-center gap-3 bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#333] rounded-xl px-4 py-3">
    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center shrink-0">
      <Icon size={18} className="text-[#d4a574]" />
    </div>
    <div>
      <div className="text-white font-bold text-lg">{value}</div>
      <div className="text-gray-400 text-xs">{label}</div>
    </div>
  </div>
);

const SearchBar = () => (
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

const PopularTags = () => {
  const tags = ['Développeur', 'Data Analyst', 'Product Manager', 'DevOps', 'IA / Machine Learning'];
  return (
    <div className="flex items-center gap-3 flex-wrap mt-6">
      <span className="text-gray-400 text-sm">Recherches populaires :</span>
      {tags.map((tag) => (
        <button
          key={tag}
          className="px-4 py-1.5 rounded-full border border-[#333] text-gray-300 text-sm hover:border-[#d4a574] hover:text-[#d4a574] transition-colors"
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

type StatCardProps = {
  icon: ComponentType<{ size?: number; className?: string }>;
  value: string;
  title: string;
  description: string;
};

const StatCard = ({ icon: Icon, value, title, description }: StatCardProps) => (
  <div className="bg-[#111] border border-[#222] rounded-2xl p-6 hover:border-[#333] transition-colors">
    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-4">
      <Icon size={18} className="text-[#d4a574]" />
    </div>
    <div className="text-[#d4a574] text-2xl font-bold mb-2">{value}</div>
    <div className="text-white font-medium text-sm mb-1">{title}</div>
    <div className="text-gray-500 text-xs leading-relaxed">{description}</div>
  </div>
);

const VideoCard = () => (
  <div className="bg-[#111] border border-[#222] rounded-2xl p-6 relative overflow-hidden hover:border-[#333] transition-colors">
    <div className="relative z-10">
      <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-4">
        <Brain size={20} className="text-[#d4a574]" />
      </div>
      <div className="text-white font-medium text-lg mb-1">L'IA au service</div>
      <div className="text-white font-medium text-lg mb-4">de votre carrière</div>
      <div className="text-gray-500 text-xs leading-relaxed max-w-[180px]">
        Préparez-vous, entraînez-vous et décrochez le job de vos rêves.
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

const ExploreMetiers = () => {
  const metiers = [
    {
      icon: Code,
      title: 'Développement',
      description: 'Frontend, Backend, Fullstack',
      offres: '+5 062 offres'
    },
    {
      icon: Database,
      title: 'Data',
      description: 'Data Analyst, Scientist, Engineer',
      offres: '+1 880 offres'
    },
    {
      icon: Cloud,
      title: 'DevOps & Cloud',
      description: 'Infrastructure, SRE, Cloud Engineer',
      offres: '+1 341 offres'
    },
    {
      icon: Target,
      title: 'Product',
      description: 'Product Manager, Designer, Owner',
      offres: '+856 offres'
    },
    {
      icon: Brain,
      title: 'IA & Machine Learning',
      description: 'ML Engineer, AI Research, LLM',
      offres: '+3 294 offres'
    }
  ];

  return (
    <div className="mb-16">
      <div className="mb-12">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-4">// EXPLOREZ LES MÉTIERS TECH</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Des rôles.<br />
          Des possibilités.
        </h2>
        <p className="text-gray-400 text-base leading-relaxed max-w-2xl">
          Découvrez les domaines qui recrutent le plus dans la tech. Trouvez le rôle qui correspond à vos compétences et ambitions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metiers.map((metier) => {
          const IconComponent = metier.icon;
          return (
            <div
              key={metier.title}
              className="bg-[#111] border border-[#222] rounded-2xl p-6 hover:border-[#333] transition-all hover:bg-[#1a1a1a] cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <IconComponent size={20} className="text-[#d4a574]" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{metier.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{metier.description}</p>
              <div className="text-[#d4a574] text-xs font-medium">{metier.offres}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <button className="flex items-center justify-center gap-2 mx-auto text-gray-400 hover:text-[#d4a574] transition-colors text-sm">
          Voir tous les métiers
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

const API_URL = 'http://localhost:3000';

const formatStat = (value: number | null | undefined, fallback: string) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M+`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K+`;
  return `${value}`;
};

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<{ offers: number; users: number; companies: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => setMounted(true));
    fetch(`${API_URL}/api/analytics/public-stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!mounted) return null;

  const offersValue = formatStat(stats?.offers, '—');
  const usersValue = formatStat(stats?.users, '—');
  const companiesValue = formatStat(stats?.companies, '—');

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Canvas />

      <div className="relative z-10">
        <Navbar />

        <main className="px-8 pt-12 pb-16">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="mb-12 md:mb-20">
              <div className="max-w-2xl">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-6">
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
                  Le bon job en tech,
                  <br />
                  pour aller <span className="italic text-[#d4a574] font-serif">plus loin.</span>
                </h1>
                <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-lg">
                  Découvrez des milliers d'opportunités dans la tech.
                  <br />
                  Trouvez le poste qui va booster votre carrière.
                </p>

                <SearchBar />
                <PopularTags />
              </div>

              {/* Floating Stats - Desktop only, positioned absolutely */}
              <div className="hidden lg:block">
                <div className="absolute" style={{ top: '140px', right: '25%' }}>
                  <StatBadge
                    icon={RefreshCw}
                    value={offersValue}
                    label="Offres en ligne"
                  />
                </div>
                <div className="absolute" style={{ top: '240px', right: '12%' }}>
                  <StatBadge
                    icon={Sparkles}
                    value="IA"
                    label="Matching intelligent"
                  />
                </div>
                <div className="absolute" style={{ top: '400px', right: '5%' }}>
                  <div className="flex items-center gap-3 bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#333] rounded-xl px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center shrink-0">
                      <Trophy size={18} className="text-[#d4a574]" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{companiesValue}</div>
                      <div className="text-gray-400 text-xs">Entreprises</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats - Mobile/Tablet: shown below search */}
              <div className="lg:hidden mt-8 flex flex-wrap gap-3 justify-start">
                <StatBadge
                  icon={RefreshCw}
                  value={offersValue}
                  label="Offres en ligne"
                />
                <StatBadge
                  icon={Sparkles}
                  value="IA"
                  label="Matching intelligent"
                />
                <div className="flex items-center gap-3 bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#333] rounded-xl px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center shrink-0">
                    <Trophy size={18} className="text-[#d4a574]" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">{companiesValue}</div>
                    <div className="text-gray-400 text-xs">Entreprises</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <StatCard
                icon={Zap}
                value={offersValue}
                title="Offres tech disponibles"
                description="Mises à jour chaque jour"
              />
              <StatCard
                icon={Sparkles}
                value="IA"
                title="Matching intelligent"
                description="Des recommandations qui vous correspondent"
              />
              <StatCard
                icon={Users}
                value={usersValue}
                title="Candidats inscrits"
                description="Rejoignez une communauté tech ambitieuse"
              />
              <StatCard
                icon={Shield}
                value={companiesValue}
                title="Entreprises partenaires"
                description="Travaillez avec les meilleurs dans votre domaine"
              />
              <VideoCard />
            </div>

            {/* Company Logos */}
            <ExploreMetiers />
          </div>
        </main>
      </div>
    </div>
  );
}
