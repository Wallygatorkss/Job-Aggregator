import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/useAuth';

const API = 'http://localhost:3000';

type User = {
  id: number;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

type Stats = {
  users: number;
  offers: number;
  activeUsers: number;
};

type Charts = {
  savedPerDay: { date: string; count: number }[];
  applicationsPerDay: { date: string; count: number }[];
  contractTypes: { type: string; count: number }[];
  topCities: { city: string; count: number }[];
  offersPerMonth: { month: string; count: number }[];
  usersPerMonth: { month: string; count: number }[];
};

const GOLD = '#f6d889';
const BLUE = '#58A6FF';
const GREEN = '#3fb950';
const PURPLE = '#bc8cff';
const PIE_COLORS = [GOLD, BLUE, GREEN, PURPLE, '#ff7b72', '#ffa657', '#79c0ff', '#56d364'];

const tooltipStyle = {
  contentStyle: { background: '#111217', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 },
  labelStyle: { color: 'rgba(255,255,255,0.6)' },
  itemStyle: { color: '#fff' },
};

const axisStyle = { tick: { fill: 'rgba(255,255,255,0.4)', fontSize: 11 }, axisLine: false, tickLine: false };

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-6 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">{subtitle}</p>
      <h3 className="mt-1 mb-5 text-base font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

function Analytics() {
  const { isAdmin, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banningId, setBanningId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, statsRes, chartsRes] = await Promise.all([
          fetch(`${API}/api/analytics/users`, { headers }),
          fetch(`${API}/api/analytics/stats`, { headers }),
          fetch(`${API}/api/analytics/charts`, { headers }),
        ]);
        if (usersRes.ok) setUsers(await usersRes.json());
        else setError('Impossible de charger la liste des utilisateurs');
        if (statsRes.ok) setStats(await statsRes.json());
        if (chartsRes.ok) {
          setCharts(await chartsRes.json());
        } else {
          const errBody = await chartsRes.text().catch(() => '');
          console.error('Charts endpoint error', chartsRes.status, errBody);
          setError(`Charts indisponibles (HTTP ${chartsRes.status})`);
        }
      } catch (err) {
        console.error(err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [isAdmin, token]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const handleBanUser = async (userId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir bannir cet utilisateur ?')) return;
    try {
      setBanningId(userId);
      const res = await fetch(`${API}/api/moderation/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: false } : u)));
      else setError("Erreur lors du bannissement de l'utilisateur");
    } catch {
      setError('Erreur de connexion');
    } finally {
      setBanningId(null);
    }
  };

  return (
    <PageShell
      title="Analytics"
      subtitle="Administration"
      description="Vue d'ensemble réservée aux administrateurs pour suivre l'activité et les performances."
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">

        {/* KPI cards */}
        <div className="grid gap-6 lg:grid-cols-4">
          {stats && [
            { label: 'Utilisateurs totaux', value: stats.users, color: GOLD },
            { label: 'Utilisateurs actifs', value: stats.activeUsers, color: GREEN },
            { label: 'Offres publiées', value: stats.offers, color: BLUE },
            { label: 'Offres sauvegardées', value: '—', color: PURPLE },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-[#111217]/80 p-6 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">{item.label}</p>
              <h3 className="mt-3 text-3xl font-semibold" style={{ color: item.color }}>{item.value}</h3>
            </div>
          ))}
        </div>

        {loading && <p className="text-center text-white/50">Chargement des graphiques...</p>}

        {!loading && !charts && (
          <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-200">
            Les graphiques n'ont pas pu être chargés. Vérifie la console et que le backend est à jour avec la route <code>/api/analytics/charts</code>.
          </div>
        )}

        {charts && (
          <>
            {/* Row 1 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Offres sauvegardées — 30 derniers jours" subtitle="Engagement">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={charts.savedPerDay} barSize={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" {...axisStyle} interval={4} />
                    <YAxis {...axisStyle} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" name="Sauvegardes" fill={GOLD} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Candidatures soumises — 30 derniers jours" subtitle="Candidatures">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={charts.applicationsPerDay} barSize={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" {...axisStyle} interval={4} />
                    <YAxis {...axisStyle} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" name="Candidatures" fill={BLUE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row 2 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Offres publiées par mois" subtitle="Publication">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={charts.offersPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" {...axisStyle} />
                    <YAxis {...axisStyle} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="count" name="Offres" stroke={GREEN} strokeWidth={2} dot={{ fill: GREEN, r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Inscriptions utilisateurs par mois" subtitle="Croissance">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={charts.usersPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" {...axisStyle} />
                    <YAxis {...axisStyle} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="count" name="Utilisateurs" stroke={PURPLE} strokeWidth={2} dot={{ fill: PURPLE, r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row 3 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Distribution des types de contrat" subtitle="Marché">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={charts.contractTypes}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {charts.contractTypes.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v, n) => [v, n]} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}
                      formatter={(value) => value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Top 10 villes — nombre d'offres" subtitle="Géographie">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={charts.topCities} layout="vertical" barSize={10} margin={{ left: 8 }}>
                    <XAxis type="number" {...axisStyle} allowDecimals={false} />
                    <YAxis type="category" dataKey="city" {...axisStyle} width={90} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" name="Offres" fill={BLUE} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}

        {/* Users table */}
        <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-6 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Utilisateurs</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Gestion des utilisateurs</h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-xl border border-[#58A6FF]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#58A6FF] transition hover:bg-[#58A6FF] hover:text-[#0b0d10]"
            >
              Retour accueil
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-center text-white/60">Chargement des utilisateurs...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-white/60">Aucun utilisateur pour l'instant</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Email', 'Utilisateur', 'Rôle', 'Statut', 'Inscrit', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-white">{user.email}</td>
                      <td className="px-4 py-3 text-white/70">{user.username}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] ${
                          user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>{user.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] ${
                          user.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>{user.is_active ? 'Actif' : 'Banni'}</span>
                      </td>
                      <td className="px-4 py-3 text-white/60">{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        {!user.is_active ? (
                          <span className="text-[0.65rem] text-white/40">Banni</span>
                        ) : (
                          <button
                            type="button"
                            disabled={banningId === user.id}
                            onClick={() => void handleBanUser(user.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-500/50 bg-red-500/10 px-2 py-1 text-[0.65rem] text-red-400 transition hover:border-red-400 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            Bannir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default Analytics;
