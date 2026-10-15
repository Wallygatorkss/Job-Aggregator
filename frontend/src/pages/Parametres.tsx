import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/useAuth';

const API_URL = 'http://localhost:3000';

type UserInfo = {
  id: number;
  email: string;
  username: string;
  role: string;
  professional_status: string;
  phone: string | null;
  language: string | null;
  updated_at: string;
};

const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
];

const languageLabel = (code: string | null | undefined) =>
  LANGUAGE_OPTIONS.find((option) => option.value === code)?.label ?? '—';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#15161c]/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">{label}</p>
      <p className="mt-2 truncate text-white/70">{value}</p>
    </div>
  );
}

function Parametres() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '' });
  const [editSaving, setEditSaving] = useState(false);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefsForm, setPrefsForm] = useState({ phone: '', language: '' });
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => {});
  }, [token]);

  const openEdit = () => {
    if (!user) return;
    setEditForm({ username: user.username, email: user.email });
    setMessage(null);
    setEditOpen(true);
  };

  const openPrefs = () => {
    if (!user) return;
    setPrefsForm({ phone: user.phone ?? '', language: user.language ?? '' });
    setMessage(null);
    setPrefsOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setEditSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: editForm.username, email: editForm.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      setUser(data);
      setEditOpen(false);
      setMessage({ text: 'Informations mises à jour.', ok: true });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Erreur', ok: false });
    } finally {
      setEditSaving(false);
    }
  };

  const savePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPrefsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: prefsForm.phone.trim() || null,
          language: prefsForm.language || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      setUser(data);
      setPrefsOpen(false);
      setMessage({ text: 'Préférences mises à jour.', ok: true });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Erreur', ok: false });
    } finally {
      setPrefsSaving(false);
    }
  };

  const savePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (pwdForm.next !== pwdForm.confirm) {
      setMessage({ text: 'Les mots de passe ne correspondent pas.', ok: false });
      return;
    }
    setPwdSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/me/password`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      setPwdOpen(false);
      setPwdForm({ current: '', next: '', confirm: '' });
      setMessage({ text: 'Mot de passe mis à jour.', ok: true });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Erreur', ok: false });
    } finally {
      setPwdSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
    } catch {
      return iso;
    }
  };


  return (
    <PageShell
      title="Paramètres"
      subtitle="Configuration"
      description="Ajuste ton expérience, la sécurité et tes accès."
    >
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111217]/80 px-5 py-4 shadow-[0_0_30px_rgba(216,178,94,0.06)]">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Navigation</p>
            <p className="mt-1 text-sm text-white/70">Reviens à la vitrine publique d'Indeed.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/landing')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8b25e]/40 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#f6d889] transition hover:bg-[#f6d889] hover:text-[#141518]"
          >
            <Home size={14} />
            Page d'accueil
          </button>
        </div>

        {message && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${message.ok ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-8 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Compte</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Informations du compte</h3>
          <p className="mt-2 text-sm text-white/60">Modifie ton nom d'utilisateur et ton email.</p>

          <div className="mt-6 grid gap-4 text-sm text-white/60 sm:grid-cols-2">
            <Field label="Nom d'utilisateur" value={user?.username ?? '—'} />
            <Field label="Email" value={user?.email ?? '—'} />
            <Field label="Rôle" value={user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'} />
            <Field label="Mot de passe" value={user ? `Dernière modif. le ${formatDate(user.updated_at)}` : '—'} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openEdit}
              className="rounded-xl border border-[#d8b25e]/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#f6d889] transition hover:bg-[#f6d889] hover:text-[#141518]"
            >
              Modifier les infos
            </button>
            <button
              type="button"
              onClick={() => { setMessage(null); setPwdOpen(true); }}
              className="rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-[#58A6FF]/60 hover:text-white"
            >
              Changer le mot de passe
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-8 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Préférences</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Contact & langue</h3>
          <p className="mt-2 text-sm text-white/60">Ajoute ton numéro de téléphone et la langue de ton interface.</p>

          <div className="mt-6 grid gap-4 text-sm text-white/60 sm:grid-cols-2">
            <Field label="Numéro de téléphone" value={user?.phone ?? '—'} />
            <Field label="Langue" value={languageLabel(user?.language)} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openPrefs}
              className="rounded-xl border border-[#d8b25e]/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#f6d889] transition hover:bg-[#f6d889] hover:text-[#141518]"
            >
              Modifier les préférences
            </button>
          </div>
        </div>
      </section>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#111217] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Modifier les infos</h3>
              <button type="button" onClick={() => setEditOpen(false)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Fermer</button>
            </div>
            <form onSubmit={(e) => { void saveEdit(e); }} className="space-y-4 px-6 py-6">
              <div>
                <label className="block text-sm font-semibold text-white/70">Nom d'utilisateur</label>
                <input
                  value={editForm.username}
                  onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white focus:border-[#58A6FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/70">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white focus:border-[#58A6FF] focus:outline-none"
                />
              </div>
              {message && !message.ok && (
                <p className="text-sm text-red-400">{message.text}</p>
              )}
              <div className="flex gap-3 border-t border-white/10 pt-4">
                <button type="button" onClick={() => setEditOpen(false)} className="flex-1 rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Annuler</button>
                <button type="submit" disabled={editSaving} className="flex-1 rounded-xl border border-[#d8b25e]/40 bg-[#f6d889] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#141518] disabled:opacity-50">
                  {editSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {prefsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#111217] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Préférences</h3>
              <button type="button" onClick={() => setPrefsOpen(false)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Fermer</button>
            </div>
            <form onSubmit={(e) => { void savePrefs(e); }} className="space-y-4 px-6 py-6">
              <div>
                <label className="block text-sm font-semibold text-white/70">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={prefsForm.phone}
                  onChange={(e) => setPrefsForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+33 6 12 34 56 78"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white focus:border-[#58A6FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/70">Langue</label>
                <select
                  value={prefsForm.language}
                  onChange={(e) => setPrefsForm((f) => ({ ...f, language: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white focus:border-[#58A6FF] focus:outline-none"
                >
                  <option value="">— Non définie —</option>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {message && !message.ok && (
                <p className="text-sm text-red-400">{message.text}</p>
              )}
              <div className="flex gap-3 border-t border-white/10 pt-4">
                <button type="button" onClick={() => setPrefsOpen(false)} className="flex-1 rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Annuler</button>
                <button type="submit" disabled={prefsSaving} className="flex-1 rounded-xl border border-[#d8b25e]/40 bg-[#f6d889] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#141518] disabled:opacity-50">
                  {prefsSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pwdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#111217] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Changer le mot de passe</h3>
              <button type="button" onClick={() => setPwdOpen(false)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Fermer</button>
            </div>
            <form onSubmit={(e) => { void savePwd(e); }} className="space-y-4 px-6 py-6">
              <div>
                <label className="block text-sm font-semibold text-white/70">Mot de passe actuel</label>
                <input
                  type="password"
                  value={pwdForm.current}
                  onChange={(e) => setPwdForm((f) => ({ ...f, current: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white focus:border-[#58A6FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/70">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={pwdForm.next}
                  onChange={(e) => setPwdForm((f) => ({ ...f, next: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white focus:border-[#58A6FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/70">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  value={pwdForm.confirm}
                  onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white focus:border-[#58A6FF] focus:outline-none"
                />
              </div>
              {message && !message.ok && (
                <p className="text-sm text-red-400">{message.text}</p>
              )}
              <div className="flex gap-3 border-t border-white/10 pt-4">
                <button type="button" onClick={() => setPwdOpen(false)} className="flex-1 rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Annuler</button>
                <button type="submit" disabled={pwdSaving} className="flex-1 rounded-xl border border-[#d8b25e]/40 bg-[#f6d889] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#141518] disabled:opacity-50">
                  {pwdSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default Parametres;
