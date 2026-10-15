import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, ArrowRight, Mail, Lock, Sparkles, Zap, Users, Award, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const API_URL = 'http://localhost:3000';

type FeedbackKind = 'success' | 'error';
type Feedback = { kind: FeedbackKind; title: string; message: string } | null;

type AuthMode = 'login' | 'register';

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

export function Login({ mode = 'login' }: { mode?: AuthMode }) {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthMode>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<{ offers: number; users: number; companies: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/analytics/public-stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setActiveTab(mode));
    return () => cancelAnimationFrame(frame);
  }, [mode]);

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

  const switchMode = (nextMode: AuthMode) => {
    setActiveTab(nextMode);
    navigate(nextMode === 'login' ? '/login' : '/register');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const endpoint = activeTab === 'register' ? '/api/auth/register' : '/api/auth/login';
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          kind: 'error',
          title: 'Authentification refusée',
          message: data.message || 'Une erreur est survenue.',
        });
        return;
      }

      setSession(data.token, data.user?.role);
      setFeedback({
        kind: 'success',
        title: activeTab === 'register' ? 'Compte créé' : 'Connexion réussie',
        message:
          activeTab === 'register'
            ? 'Bienvenue sur Indeed. Préparation de votre espace...'
            : 'Authentification confirmée. Redirection en cours...',
      });
      window.setTimeout(() => navigate('/'), 900);
    } catch {
      setFeedback({
        kind: 'error',
        title: 'Serveur indisponible',
        message: 'Impossible de contacter le service. Vérifiez votre connexion.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCount = (value: number | null | undefined, fallback: string) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M+`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K+`;
    return `${value}`;
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-screen pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-8">
        <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">indeed</span>
          <span className="text-2xl font-light text-white/60">_</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/landing')}
            className="flex items-center gap-2 rounded-full border border-[#F6D889]/35 bg-[#F6D889]/10 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-[#F6D889] transition hover:border-[#F6D889]/60 hover:bg-[#F6D889]/20 hover:text-[#FFE6A9]"
          >
            <Sparkles className="h-4 w-4" />
            <span>Accueil</span>
          </button>

          <button type="button" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <Sun className="h-4 w-4" />
            <span>Mode clair</span>
          </button>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-110px)] flex-col lg:flex-row">
        <div className="flex-1 px-6 pb-10 lg:px-16 xl:px-24 lg:pb-16 flex items-center">
          <div className="max-w-xl">
            <p className="mb-6 text-xs tracking-widest text-white/50 uppercase">// FIND WHAT MATTERS</p>

            <h1 className="mb-6 text-4xl font-bold leading-tight lg:text-5xl xl:text-6xl">
              Le bon job en tech,
              <br />
              pour aller <span className="italic font-light text-[#F6D889]">plus loin.</span>
            </h1>

            <p className="mb-14 max-w-md text-base leading-relaxed text-white/60">
              Découvrez des milliers d'opportunités tech
              <br />
              et trouvez le poste qui va booster votre carrière.
            </p>

            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-[#F6D889]" />
                <div>
                  <p className="text-lg font-semibold text-white">{formatCount(stats?.offers, '—')}</p>
                  <p className="mt-0.5 text-xs text-white/50">Offres disponibles</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-5 w-5 text-[#F6D889]" />
                <div>
                  <p className="text-lg font-semibold text-white">IA</p>
                  <p className="mt-0.5 text-xs text-white/50">Matching intelligent</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 text-[#F6D889]" />
                <div>
                  <p className="text-lg font-semibold text-white">{formatCount(stats?.users, '—')}</p>
                  <p className="mt-0.5 text-xs text-white/50">Candidats inscrits</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="mt-0.5 h-5 w-5 text-[#F6D889]" />
                <div>
                  <p className="text-lg font-semibold text-white">{formatCount(stats?.companies, '—')}</p>
                  <p className="mt-0.5 text-xs text-white/50">Entreprises partenaires</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 pb-8 lg:px-16 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-white/5 bg-[#111111]/80 p-8 backdrop-blur-xl">
              <div className="mb-8 flex border-b border-white/10">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`relative flex-1 pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'login' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Connexion
                  {activeTab === 'login' && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full bg-[#F6D889]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`relative flex-1 pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'register' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Inscription
                  {activeTab === 'register' && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full bg-[#F6D889]" />
                  )}
                </button>
              </div>

              <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-semibold text-white">
                  {activeTab === 'login' ? 'Bienvenue de retour' : 'Créer votre compte'}
                </h2>
                <p className="text-sm text-white/50">
                  {activeTab === 'login'
                    ? 'Connectez-vous à votre compte Indeed'
                    : 'Inscrivez-vous pour rejoindre Indeed'}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm text-white/70">Adresse e-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 transition-colors focus:border-[#F6D889]/50 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm text-white/70">Mot de passe</label>
                    <button type="button" className="text-xs text-white/50 hover:text-[#F6D889] transition-colors">
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 transition-colors focus:border-[#F6D889]/50 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-[#F6D889] py-3 font-medium text-[#0a0a0a] transition-colors hover:bg-[#E8C76D] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Veuillez patienter...' : activeTab === 'login' ? 'Se connecter' : "S'inscrire"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/40">ou continuer avec</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] py-2.5 transition-colors hover:bg-[#222]">
                  <span className="text-sm text-white/80">GitHub</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] py-2.5 transition-colors hover:bg-[#222]">
                  <span className="text-sm text-white/80">Google</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] py-2.5 transition-colors hover:bg-[#222]">
                  <span className="text-sm text-white/80">LinkedIn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 py-4 lg:px-8">
        <p className="text-xs text-white/30">© 2024 Indeed. All rights reserved.</p>
      </div>

      {feedback ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/95 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className={`flex items-start gap-4 px-6 py-5 ${feedback.kind === 'success' ? 'border-b border-[#F6D889]/20' : 'border-b border-red-500/20'}`}>
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${feedback.kind === 'success' ? 'border-[#F6D889]/40 bg-[#F6D889]/10 text-[#F6D889]' : 'border-red-500/40 bg-red-500/10 text-red-400'}`}>
                {feedback.kind === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                  {feedback.kind === 'success' ? 'Succès' : 'Erreur'}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">{feedback.title}</h3>
                <p className="mt-2 text-sm text-white/60">{feedback.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                aria-label="Fermer"
                className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition hover:border-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end px-6 py-4">
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                  feedback.kind === 'success'
                    ? 'bg-[#F6D889] text-[#0a0a0a] hover:bg-[#E8C76D]'
                    : 'border border-white/10 bg-[#1a1a1a] text-white/80 hover:border-white/20 hover:text-white'
                }`}
              >
                {feedback.kind === 'success' ? 'Continuer' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
