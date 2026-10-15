import { useState, type FormEvent } from 'react';
import { AuthenticateButton } from './LargeButton';

const ACCENT = '#c9a84c';
const MUTED = '#888888';
const BORDER = '#2a2a2a';
const SURFACE = '#111111';
const INPUT_BG = '#1a1a1a';

export function HeroSection() {
  const metrics = [
    { icon: '✦', value: '12K+', label: 'Offres disponibles' },
    { icon: '✦', value: '95%', label: 'Match IA intelligent' },
    { icon: '👥', value: '1M+', label: 'Candidats déjà placés' },
    { icon: '🏆', value: 'Top', label: 'Entreprises partenaires' },
  ];

  return (
    <div className="col-span-12 lg:col-span-7">
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.24em',
          color: '#ffffff',
          textTransform: 'uppercase',
        }}
      >
      </div>

      <h1
        style={{
          marginTop: '16px',
          fontSize: '52px',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          lineHeight: '1.1',
          color: '#ffffff',
        }}
      >
        Le bon job en tech,
        <br />
        pour aller <span style={{ color: ACCENT, fontStyle: 'italic' }}>plus loin.</span>
      </h1>

      <p
        style={{
          marginTop: '14px',
          fontSize: '15px',
          fontWeight: 400,
          lineHeight: '1.6',
          color: MUTED,
          maxWidth: '460px',
        }}
      >
        Découvrez des milliers d'opportunités tech
        <br />
        et trouvez le poste qui va booster votre carrière.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {metrics.map(metric => (
          <div key={`${metric.value}-${metric.label}`} className="flex items-start gap-3">
            <span style={{ color: ACCENT, fontSize: '14px', lineHeight: '1.1' }}>{metric.icon}</span>
            <div>
              <div style={{ color: ACCENT, fontWeight: 700, fontSize: '16px' }}>{metric.value}</div>
              <div style={{ color: MUTED, fontSize: '12px' }}>{metric.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoginCard() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="col-span-12 lg:col-span-5">
      <div
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: '16px',
          padding: '32px',
        }}
      >
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: mode === 'login' ? ACCENT : MUTED,
              borderBottom: mode === 'login' ? `2px solid ${ACCENT}` : 'none',
              paddingBottom: '6px',
            }}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: mode === 'register' ? ACCENT : MUTED,
              borderBottom: mode === 'register' ? `2px solid ${ACCENT}` : 'none',
              paddingBottom: '6px',
            }}
          >
            Inscription
          </button>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>
            {mode === 'login' ? 'Bienvenue de retour' : 'Créer un compte'}
          </h2>
          <p style={{ fontSize: '14px', color: MUTED, marginTop: '6px' }}>
            {mode === 'login'
              ? 'Connectez-vous à votre compte Indeed'
              : 'Rejoignez-nous et trouvez le job idéal'}
          </p>
        </div>

        <LoginFormFields mode={mode} />
      </div>
    </div>
  );
}

function LoginFormFields({ mode }: { mode?: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`❌ Erreur: ${data.message || 'Une erreur est survenue'}`);
      } else {
        if (mode === 'register') {
          alert('✅ COMPTE CRÉÉ !');
        } else {
          alert('✅ AUTHENTIFIÉ');
          localStorage.setItem('token', data.token);
        }
      }
    } catch {
      alert('📡 Serveur hors ligne. Vérifie le backend.');
    }
  };

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 500, color: '#ffffff' }}>Adresse e-mail</label>
        <div className="relative mt-2">
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            ✉️
          </span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full"
            style={{
              background: INPUT_BG,
              border: `1px solid ${BORDER}`,
              borderRadius: '10px',
              padding: '12px 12px 12px 38px',
              fontSize: '14px',
              color: '#ffffff',
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#ffffff' }}>Mot de passe</label>
          <button type="button" style={{ fontSize: '12px', color: ACCENT }}>
            Mot de passe oublié ?
          </button>
        </div>
        <div className="relative mt-2">
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            🔒
          </span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full"
            style={{
              background: INPUT_BG,
              border: `1px solid ${BORDER}`,
              borderRadius: '10px',
              padding: '12px 38px',
              fontSize: '14px',
              color: '#ffffff',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            👁️
          </span>
        </div>
      </div>

      <AuthenticateButton name={mode === 'register' ? "S'inscrire" : "Se connecter"} />

      <div style={{ textAlign: 'center', color: MUTED, fontSize: '12px' }}>
        — ou continuer avec —
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          style={{
            background: '#0a0a0a',
            border: `1px solid ${BORDER}`,
            borderRadius: '10px',
            padding: '10px 0',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          GitHub
        </button>
        <button
          type="button"
          style={{
            background: '#0a0a0a',
            border: `1px solid ${BORDER}`,
            borderRadius: '10px',
            padding: '10px 0',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Google
        </button>
        <button
          type="button"
          style={{
            background: '#0a66c2',
            border: `1px solid ${BORDER}`,
            borderRadius: '10px',
            padding: '10px 0',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          LinkedIn
        </button>
      </div>

      <div style={{ textAlign: 'center', color: MUTED, fontSize: '12px' }}>
        Pas encore de compte ?{' '}
        <button type="button" style={{ color: ACCENT, textDecoration: 'underline' }}>
          Inscrivez-vous
        </button>
      </div>
    </form>
  );
}
