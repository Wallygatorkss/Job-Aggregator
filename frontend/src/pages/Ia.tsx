import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import PdfPreview from '../components/PdfPreview';
import { useAuth } from '../context/useAuth';
import useIaMatches from '../hook/useIaMatches';
import { Bookmark, ThumbsDown } from 'lucide-react';
import { isOfferSaved, toggleSavedOffer, createSavedOfferAsync, deleteSavedOfferAsync } from '../utils/savedOffers';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3000';

function Ia() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [templateHtml, setTemplateHtml] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const { profile, matches, loading: matchesLoading, autoApply, userSkills, userExperiences } = useIaMatches();
  const navigate = useNavigate();
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>(() => {
    try {
      const map: Record<string, boolean> = {};
      matches.forEach((m) => { map[m.offer.id] = isOfferSaved(m.offer.id); });
      return map;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      try {
        if (token) {
          const m = await import('../utils/savedOffers').then((r) => r.loadSavedOffersAsync());
          if (!mounted) return;
          const map: Record<string, boolean> = {};
          m.forEach((item: any) => { map[item.id] = true; });
          matches.forEach((mm) => { if (!(mm.offer.id in map)) map[mm.offer.id] = false; });
          setSavedMap(map);
        } else {
          const m = await import('../utils/savedOffers').then((r) => r.loadSavedOffers());
          if (!mounted) return;
          const map: Record<string, boolean> = {};
          m.forEach((item: any) => { map[item.id] = true; });
          matches.forEach((mm) => { if (!(mm.offer.id in map)) map[mm.offer.id] = false; });
          setSavedMap(map);
        }
      } catch {
      }
    };
    void sync();
    return () => { mounted = false; };
  }, [matches, token]);
  const [applying, setApplying] = useState(false);
  const [applyResults, setApplyResults] = useState<{ offerId: string; ok: boolean; error?: string }[] | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [applyMessageType, setApplyMessageType] = useState<'success' | 'error' | 'info' | null>(null);
  const [visibleLimit, setVisibleLimit] = useState<number>(6);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(() => {
    try {
      const v = localStorage.getItem('iaAutoApplyCooldown');
      return v ? Number(v) : null;
    } catch {
      return null;
    }
  });
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [disliked, setDisliked] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    let mounted = true;
    const loadServerDislikes = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/ia-dislikes`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const json = await res.json();
        const ids: string[] = Array.isArray(json.data) ? json.data.map((r: any) => r.offer_id ?? r.offerId ?? r.offer) : [];
        if (!mounted) return;
        setDisliked(new Set(ids.filter(Boolean)));
      } catch {
      }
    };
    void loadServerDislikes();
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    if (downloadUrl) {
      return () => {
        URL.revokeObjectURL(downloadUrl);
      };
    }
  }, [downloadUrl]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (sampleUrl) {
      return () => {
        URL.revokeObjectURL(sampleUrl);
      };
    }
  }, [sampleUrl]);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await fetch(`${API_URL}/api/cv/template`);
        if (!response.ok) {
          throw new Error('Impossible de charger le template.');
        }
        const html = await response.text();
        setTemplateHtml(html);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Impossible de charger le template.';
        setTemplateError(message);
      }
    };

    const loadSamplePdf = async () => {
      try {
        const response = await fetch(`${API_URL}/api/cv/sample`);
        if (!response.ok) {
          throw new Error('Impossible de charger le CV exemple.');
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setSampleUrl(url);
      } catch {
      }
    };

    loadTemplate();
    loadSamplePdf();
  }, []);

  const handleGenerateCv = async () => {
    if (!token) {
      setError('Vous devez être connecté pour générer votre CV.');
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/api/cv/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Impossible de générer le CV pour le moment.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setSuccess('CV généré avec succès. Le téléchargement a démarré.');

      const link = document.createElement('a');
      link.href = url;
      link.download = 'cv.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Une erreur est survenue.';
        setError(message);
      } finally {
      setLoading(false);
    }
  };
  return (
    <PageShell
      title="IA"
      subtitle="Signal Engine"
      description="Des outils intelligents pour accélérer la recherche et la candidature."
    >
      <section className="flex justify-center">
        <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[#111217]/80 p-10 text-center shadow-[0_0_40px_rgba(88,166,255,0.12)]">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">CV IA</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Générer mon CV personnalisé</h3>
          <p className="mt-2 text-sm text-white/60">
            L’IA utilise les informations de ton profil (compétences, expériences, email) pour produire un PDF prêt à envoyer.
            {profile && (
              <span className="block mt-2 text-xs text-white/40">Profil: {profile.username ?? profile.email}</span>
            )}
          </p>

          {!token && (
            <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              Connecte-toi pour générer ton CV automatiquement.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-100">
              {success}
            </p>
          )}

          {downloadUrl && (
            <a
              className="mt-3 block text-xs font-semibold uppercase tracking-[0.24em] text-[#58A6FF] hover:text-white"
              href={downloadUrl}
              download="cv.pdf"
            >
              Télécharger à nouveau
            </a>
          )}

          <button
            className="mt-6 rounded-full border border-[#58A6FF]/50 px-6 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#58A6FF] transition hover:bg-[#58A6FF] hover:text-[#0b0d10] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleGenerateCv}
            disabled={loading}
          >
            {loading ? 'Génération en cours...' : 'Générer mon CV'}
          </button>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-6 text-left shadow-[0_0_30px_rgba(216,178,94,0.08)]">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Template</p>
          <h4 className="mt-2 text-lg font-semibold text-white">Modèle utilisé</h4>
          <p className="mt-2 text-sm text-white/60">
            Voici le template HTML qui sera utilisé pour générer ton CV.
          </p>

          {templateError && (
            <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {templateError}
            </p>
          )}

          {sampleUrl && (
            <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-[0_0_24px_rgba(0,0,0,0.08)]">
              <PdfPreview blobUrl={sampleUrl} className="w-full" alt="Template CV" />
            </div>
          )}

          {!sampleUrl && templateHtml && (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white">
              <iframe
                title="Template CV"
                className="h-[520px] w-full"
                sandbox=""
                srcDoc={templateHtml}
              />
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-6 text-left shadow-[0_0_30px_rgba(216,178,94,0.08)]">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Matching</p>
          <h4 className="mt-2 text-lg font-semibold text-white">Offres correspondant à mon profil</h4>
          <p className="mt-2 text-sm text-white/60">L'IA propose des offres triées selon ton profil. Tu peux postuler automatiquement sur les meilleures correspondances.</p>

          <div className="mt-4">
            {matchesLoading ? (
              <div className="text-sm text-white/60">Chargement des correspondances...</div>
            ) : (
              <ul className="space-y-3">
                {(() => {
                  const available = matches.filter((mm) => !disliked.has(mm.offer.id));
                  const topScore = available.length > 0 ? Math.max(1, available[0].score) : 1;
                  const shown = available.slice(0, visibleLimit);
                  return shown.map((m) => {
                    const pct = Math.max(0, Math.min(100, Math.round((m.score / topScore) * 100)));
                    const saved = savedMap[m.offer.id] ?? isOfferSaved(m.offer.id);
                    const offerSkills = (m.offer as any).skills ? (m.offer as any).skills.map((s: any) => s.skill_name ?? s) : [];
                    const matched = (userSkills ?? []).filter((us: string) => offerSkills.map((os: string) => os.toLowerCase()).includes(us.toLowerCase()));
                    const uniqueOfferSkills = Array.from(new Set((offerSkills ?? []).map((s: any) => String(s)).filter(Boolean))) as string[];
                    const suggested = uniqueOfferSkills.filter((s) => !matched.map((mm) => mm.toLowerCase()).includes(s.toLowerCase())).slice(0, 4);
                    const offerTitleText = String(m.offer.title ?? '').toLowerCase();
                    const offerDescText = String((m.offer as any).description ?? '').toLowerCase();
                    const matchedEx = (userExperiences ?? []).filter((ue: string) => offerTitleText.includes(ue.toLowerCase()) || offerDescText.includes(ue.toLowerCase()));
                    return (
                      <li key={m.offer.id} className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2">
                        <div className="text-sm">
                          <div className="font-semibold">{m.offer.title}</div>
                          <div className="text-xs text-white/50">{m.offer.company_name} • {m.offer.location ?? m.offer.formatted_places?.[0]?.place}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-white/60 text-right">
                            <div className="font-semibold">{pct}%</div>
                            <div className="text-xs text-white/40">Correspondance</div>
                          </div>
                            <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); navigate(`/?offerId=${encodeURIComponent(m.offer.id)}`, { state: { offerId: m.offer.id } }); }}
                              className="rounded-full border px-3 py-2 text-sm transition bg-[#15161b] text-white/70 hover:border-white/20 hover:text-white"
                            >
                              Voir l'offre
                            </button>
                            <button
                              type="button"
                              aria-label="Ignorer l'offre"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (token) {
                                  try {
                                    const res = await fetch(`${API_URL}/api/ia-dislikes`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ offerId: m.offer.id }),
                                    });
                                    if (res.ok) {
                                      setDisliked((s) => new Set(Array.from(s).concat([m.offer.id])));
                                      return;
                                    }
                                  } catch {
                                  }
                                }

                                setDisliked((s) => new Set(Array.from(s).concat([m.offer.id])));
                              }}
                              className="rounded-full border border-red-400/30 bg-red-500/8 p-2 text-red-300 transition hover:bg-red-500/12 hover:brightness-110"
                            >
                              <ThumbsDown size={14} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  if (saved) {
                                    const ok = token ? await deleteSavedOfferAsync(m.offer.id).catch(() => false) : false;
                                    if (ok) {
                                      setSavedMap((s) => ({ ...s, [m.offer.id]: false }));
                                    } else {
                                      const { saved: toggled } = toggleSavedOffer({ id: m.offer.id, title: m.offer.title, company: m.offer.company_name ?? '', location: m.offer.location ?? '', savedAt: new Date().toISOString() });
                                      setSavedMap((s) => ({ ...s, [m.offer.id]: toggled }));
                                    }
                                  } else {
                                    const ok = token ? await createSavedOfferAsync(m.offer.id).catch(() => false) : false;
                                    if (ok) {
                                      setSavedMap((s) => ({ ...s, [m.offer.id]: true }));
                                    } else {
                                      const { saved: toggled } = toggleSavedOffer({ id: m.offer.id, title: m.offer.title, company: m.offer.company_name ?? '', location: m.offer.location ?? '', savedAt: new Date().toISOString() });
                                      setSavedMap((s) => ({ ...s, [m.offer.id]: toggled }));
                                    }
                                  }
                                } catch {
                                  const { saved: toggled } = toggleSavedOffer({ id: m.offer.id, title: m.offer.title, company: m.offer.company_name ?? '', location: m.offer.location ?? '', savedAt: new Date().toISOString() });
                                  setSavedMap((s) => ({ ...s, [m.offer.id]: toggled }));
                                }
                              }}
                              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${saved ? 'border-[#58A6FF]/50 bg-[#151b2a] text-[#58A6FF]' : 'border-white/10 bg-[#15171b] text-white/60 hover:border-white/20 hover:text-white'}`}
                            >
                              <Bookmark size={12} className={saved ? 'fill-[#58A6FF]' : ''} />
                              {saved ? 'Sauvegardé' : 'Sauvegarder'}
                            </button>
                              {/* show matched/suggested skills preview */}
                              <div className="hidden flex-col items-end text-right text-xs text-white/50 sm:flex">
                                <div>
                                  {matched.length > 0 ? (
                                    <span className="text-[11px] text-emerald-200">{matched.slice(0,3).join(', ')}</span>
                                  ) : (
                                    <span className="text-[11px] text-white/40">Aucune compétence correspondante</span>
                                  )}
                                </div>
                                {suggested.length > 0 && (
                                  <div className="mt-1 text-[10px] text-white/40">+ {suggested.slice(0,3).join(', ')}</div>
                                )}
                                {matchedEx.length > 0 && (
                                  <div className="mt-1 text-[10px] text-white/40">Exp: {matchedEx.slice(0,2).join(', ')}</div>
                                )}
                              </div>
                          </div>
                        </div>
                      </li>
                    );
                  });
                })()}
              </ul>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                disabled={applying || matchesLoading || !(matches && matches.length > 0) || visibleLimit === 0 || ((cooldownUntil ?? 0) > nowTick)}
                onClick={async () => {
                  if (!token) {
                    setApplyMessage('Vous devez être connecté pour postuler automatiquement');
                    setApplyMessageType('error');
                    return;
                  }

                  const available = matches.filter((mm) => !disliked.has(mm.offer.id)).slice(0, visibleLimit);
                  const toApply = available.map((a) => a.offer.id).slice(0, 50);
                  if (toApply.length === 0) return;
                  setApplying(true);
                  setApplyResults(null);
                  setApplyMessage(null);
                  setApplyMessageType(null);
                  try {
                    const res = await autoApply({ max: toApply.length });
                    setApplyResults(res);

                    const okCount = res.filter((r) => r.ok).length;
                    const failItems = res.filter((r) => !r.ok);

                    if (okCount > 0) {
                      setApplyMessage(`${okCount} candidatures envoyées`);
                      setApplyMessageType('success');
                      const until = Date.now() + 30_000;
                      try { localStorage.setItem('iaAutoApplyCooldown', String(until)); } catch {}
                      setCooldownUntil(until);
                    }

                    if (failItems.length > 0 && okCount === 0) {
                      const msgs = failItems.map((f) => (f.error ?? '').toLowerCase());
                      if (msgs.every((m) => m.includes('unauthorized') || m.includes('connect'))) {
                        setApplyMessage('Vous devez être connecté pour postuler automatiquement');
                        setApplyMessageType('error');
                      } else if (msgs.every((m) => m.includes('déjà') || m.includes('already') || m.includes('duplicate') || m.includes('409'))) {
                        setApplyMessage("Vous avez déjà postulé à ces offres");
                        setApplyMessageType('error');
                      } else {
                        setApplyMessage("Impossible d'envoyer les candidatures pour certaines offres. Réessaie plus tard.");
                        setApplyMessageType('error');
                      }
                    }

                    if (failItems.length > 0 && okCount > 0) {
                      setApplyMessage((prev) => (prev ? `${prev} — Certaines candidatures ont échoué, vous avez déjà postulé à certaines offres.` : 'Certaines candidatures ont échoué. Vous avez peut-être déjà postulé à certaines offres ou votre session a expiré.'));
                      setApplyMessageType('success');
                    }
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Erreur inconnue';
                    if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('connect')) {
                      setApplyMessage('Vous devez être connecté pour postuler automatiquement');
                    } else {
                      setApplyMessage("Impossible d'envoyer les candidatures pour le moment.");
                    }
                    setApplyMessageType('error');
                    setApplyResults([{ offerId: 'error', ok: false, error: message }]);
                  } finally {
                    setApplying(false);
                  }
                }}
                className="rounded-full border border-[#58A6FF]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#58A6FF] transition hover:bg-[#58A6FF] hover:text-[#0b0d10] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {applying ? 'Candidature en cours...' : ((cooldownUntil ?? 0) > nowTick ? `Recharger dans ${Math.ceil(((cooldownUntil ?? 0) - nowTick)/1000)}s` : `Postuler aux ${Math.min(visibleLimit, 50)} offres`)}
              </button>

              <button
                type="button"
                onClick={() => {
                  setVisibleLimit((cur) => Math.min(50, cur + 6));
                }}
                disabled={visibleLimit >= 50 || (matches?.filter((mm) => !disliked.has(mm.offer.id)).length ?? 0) <= visibleLimit}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Charger plus
              </button>
            </div>

            {applyMessage ? (
              <div className={`mt-3 rounded-xl px-4 py-2 text-xs ${applyMessageType === 'success' ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border border-red-500/30 bg-red-500/10 text-red-200'}`}>
                {applyMessage}
              </div>
            ) : null}

            {applyResults && (
              <div className="text-sm text-white/60">
                {applyResults.length === 0 ? 'Aucune candidature envoyée' : `${applyResults.filter(r => r.ok).length} envoyées, ${applyResults.filter(r => !r.ok).length} échouées`}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-6 text-left shadow-[0_0_30px_rgba(216,178,94,0.08)]">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">PDF</p>
          <h4 className="mt-2 text-lg font-semibold text-white">Dernier CV généré</h4>
          <p className="mt-2 text-sm text-white/60">
            Le PDF généré apparaît ici après la création.
          </p>

          {!downloadUrl && (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/50">
              Aucun CV généré pour le moment.
            </p>
          )}

          {downloadUrl && (
            <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-[0_0_24px_rgba(0,0,0,0.08)]">
              <PdfPreview blobUrl={downloadUrl} className="w-full" alt="Dernier CV" />
            </div>
          )}

        </div>
      </section>
    </PageShell>
  );
}

export default Ia;
