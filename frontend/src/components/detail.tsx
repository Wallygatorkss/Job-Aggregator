import { Bookmark, Briefcase, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import useIaMatches from "../hook/useIaMatches";
import { useAuth } from "../context/useAuth";
import { useDetail } from "../hook/useDetail";
import { createApplication, listApplications } from "../utils/applications";
import { getSkillDescription } from "../utils/skills";
import { formatContractType } from "../utils/contractTypes";
import {
  isOfferSaved,
  toggleSavedOffer,
  createSavedOfferAsync,
  deleteSavedOfferAsync,
} from "../utils/savedOffers";

type DetailProps = {
  selectedOfferId: string | null;
  onHeaderCollapseChange?: (collapsed: boolean) => void;
  refreshKey?: number;
};

const formatSalary = (
  salaryMin: number | null,
  salaryMax: number | null,
  currency: string | null,
  recurrence: string | null,
) => {
  const unit = currency ? ` ${currency}` : " €";
  const period = recurrence ? ` / ${recurrence}` : "";
  if (salaryMin !== null && salaryMax !== null) {
    return `${salaryMin} - ${salaryMax}${unit}${period}`;
  }
  if (salaryMin !== null) {
    return `À partir de ${salaryMin}${unit}${period}`;
  }
  if (salaryMax !== null) {
    return `Jusqu'à ${salaryMax}${unit}${period}`;
  }
  return "Non précisé";
};

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getCompanyInitial = (name: string) => name.trim().slice(0, 2).toUpperCase();
const getHighlights = (text: string) =>
  text
    .split(/\.|!|\?/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 4);

function Detail({ selectedOfferId, onHeaderCollapseChange, refreshKey }: DetailProps) {
  const { detail, loading, error } = useDetail(selectedOfferId, refreshKey);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applyNotice, setApplyNotice] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const auth = useAuth();
  const { matches } = useIaMatches();
  const skillMatchPercent = (() => {
    if (!detail) return 0;
    const available = matches && matches.length > 0 ? matches : [];
    const topScore = available.length > 0 ? Math.max(1, available[0].score) : 1;
    const myMatch = available.find((m) => m.offer.id === detail.id);
    const myScore = myMatch ? myMatch.score : 0;
    return Math.max(0, Math.min(100, Math.round((myScore / topScore) * 100)));
  })();

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedPercent(0));
    const frame = requestAnimationFrame(() => setAnimatedPercent(skillMatchPercent));
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(frame);
    };
  }, [skillMatchPercent]);

  useEffect(() => {
    if (!detail?.id) return;
    let isMounted = true;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const r1 = requestAnimationFrame(() => setIsSaved(isOfferSaved(detail.id)));
        import("../utils/savedOffers")
          .then((m) => m.loadSavedOffersAsync())
          .then((items) => {
            if (!isMounted) return;
            const exists = items.some((item) => item.id === detail.id);
            requestAnimationFrame(() => setIsSaved(exists));
          })
          .catch(() => {});
        return () => cancelAnimationFrame(r1);
      } else {
        const r2 = requestAnimationFrame(() => setIsSaved(isOfferSaved(detail.id)));
        return () => cancelAnimationFrame(r2);
      }
    } catch {
      const r3 = requestAnimationFrame(() => setIsSaved(isOfferSaved(detail.id)));
      return () => cancelAnimationFrame(r3);
    }
    return () => {
      isMounted = false;
    };
  }, [detail?.id]);

  useEffect(() => {
    if (!detail?.id) return;
    let isMounted = true;
    listApplications()
      .then((applications) => {
        if (!isMounted) return;
        const exists = applications.some((item) => item.offerId === detail.id);
        setHasApplied(exists);
      })
      .catch(() => {
        if (!isMounted) return;
        setHasApplied(false);
      });
    return () => {
      isMounted = false;
    };
  }, [detail?.id]);

  if (!selectedOfferId) {
    return (
      <section className="flex h-full w-full items-center justify-center rounded-[32px] border border-white/10 bg-[#121316] p-6 text-center text-sm text-white/60">
        Sélectionne une offre pour voir les détails.
      </section>
    );
  }

  if (loading) {
    return (
      <section className="flex h-full w-full items-center justify-center rounded-[32px] border border-white/10 bg-[#121316] p-6 text-center text-sm text-white/60">
        Chargement du détail...
      </section>
    );
  }

  if (error || !detail) {
    return (
      <section className="flex h-full w-full items-center justify-center rounded-[32px] border border-white/10 bg-[#121316] p-6 text-center text-sm text-red-200">
        {error ?? "Impossible de charger l'offre."}
      </section>
    );
  }

  const salaryLabel = formatSalary(
    detail.salary_min,
    detail.salary_max,
    detail.salary_currency,
    detail.salary_recurrence,
  );
  const contractTags = detail.contract_types.length > 0 ? detail.contract_types : [];
  const description = detail.description || detail.raw_description || "Description indisponible.";
  const descriptionPreview = detail.description_preview ?? description;
  const missionHighlights = getHighlights(description);
  const offerSkills = (detail as any).skills ? (detail as any).skills.map((s: any) => s.skill_name ?? s) : [];
  const infoItems = [
    { label: "Localisation", value: detail.location },
    { label: "Salaire", value: salaryLabel },
    { label: "Publié le", value: formatDate(detail.published_at) },
  ];
  const detailItems = [
    { label: "Type de contrat", value: detail.contract_type ?? "Non précisé" },
    {
      label: "Formats",
      value: contractTags.length > 0 ? contractTags.join(" • ") : "Non précisé",
    },
    { label: "Télétravail", value: detail.accept_remote ?? "Non précisé" },
    {
      label: "Rythme remote",
      value:
        detail.remote_policy_days_per_week !== null
          ? `${detail.remote_policy_days_per_week} jours/sem.`
          : detail.remote_policy_frequency ?? "Non précisé",
    },
    { label: "Prise de poste", value: detail.start ?? "Non précisé" },
    { label: "Langue", value: detail.locale ?? "Non précisé" },
    {
      label: "Salaire max annuel",
      value: detail.salary_max_per_year ? `${detail.salary_max_per_year} €` : "Non précisé",
    },
  ];


  return (
  <section className="flex h-full w-full flex-col gap-8 rounded-[32px] border border-white/10 bg-[#121316] p-6 text-white shadow-[0_0_60px_rgba(0,0,0,0.35)] sm:p-8">
      {/* wrapper ensures this panel can shrink and inner area becomes scrollable */}
      <div className="flex min-h-0 w-full flex-col">
        {/* sticky mini header for detail (title, salary, company) */}
        <div className="sticky top-0 z-20 mb-6 bg-transparent">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b1c22]/90 to-[#131419]/90 px-6 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10 text-sm font-semibold text-white">
                {detail.company_logo_url ? (
                  <img src={detail.company_logo_url} alt={detail.company_name} className="h-full w-full object-cover" />
                ) : (
                  <span>{getCompanyInitial(detail.company_name)}</span>
                )}
              </div>
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Détail de l'offre</p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold text-white">{detail.title}</div>
                  {detail.contract_type ? (
                    <span className="rounded-full border border-[#d8b25e]/50 bg-[#1f1a12] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f6d889]">
                      {formatContractType(detail.contract_type)}
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-white/60">
                  {detail.company_name} • {detail.location}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#d8b25e]/40 bg-[#1f1a12] px-3 py-1 text-xs font-semibold text-[#f6d889]">
                {salaryLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!detail) return;
                  try {
                    const token = localStorage.getItem("token");
                    if (token) {
                      (async () => {
                        if (isSaved) {
                          const ok = await deleteSavedOfferAsync(detail.id);
                          if (ok) setIsSaved(false);
                        } else {
                          const ok = await createSavedOfferAsync(detail.id);
                          if (ok) setIsSaved(true);
                        }
                      })();
                    } else {
                      const { saved } = toggleSavedOffer({
                        id: detail.id,
                        title: detail.title,
                        company: detail.company_name,
                        location: detail.location,
                        savedAt: new Date().toISOString(),
                      });
                      setIsSaved(saved);
                    }
                  } catch {
                    const { saved } = toggleSavedOffer({
                      id: detail.id,
                      title: detail.title,
                      company: detail.company_name,
                      location: detail.location,
                      savedAt: new Date().toISOString(),
                    });
                    setIsSaved(saved);
                  }
                }}
                className={`gold-particle-hover flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                  isSaved
                    ? "border-[#58A6FF]/50 bg-[#151b2a] text-[#58A6FF]"
                    : "border-white/10 bg-[#15171b] text-white/70"
                }`}
              >
                <Bookmark size={14} /> {isSaved ? "Sauvegardé" : "Sauvegarder"}
              </button>
              <button
                type="button"
                onClick={() => {
                    setSubmitError(null);
                    setSubmitSuccess(false);
                    if (!auth?.isAuthenticated) {
                      setSubmitError("Vous devez être connecté pour postuler.");
                      return;
                    }
                    setIsApplyOpen(true);
                  }}
                disabled={hasApplied}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                  hasApplied
                    ? "cursor-not-allowed bg-[#f6d889]/40 text-[#1a1203]/70"
                    : "bg-[#f6d889] text-[#1a1203]"
                }`}
              >
                {hasApplied ? "Déjà postulé" : "Postuler"}
              </button>
            </div>
          </div>
        </div>

        {applyNotice ? (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Candidature envoyée avec succès.
          </div>
        ) : null}

        <div onScroll={(e) => {
          const target = e.currentTarget as HTMLDivElement;
          const collapsed = target.scrollTop > 10;
          if (typeof onHeaderCollapseChange === 'function') onHeaderCollapseChange(collapsed);
        }} className="overflow-y-auto pr-2 pb-6">
      <div className="space-y-8">

      <div className="flex flex-wrap items-center gap-6">
        <div
          className="relative flex h-28 w-28 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#f6d889 ${animatedPercent * 3.6}deg, #58A6FF ${animatedPercent * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
            transition: "background 700ms ease",
          }}
        >
          <div className="absolute inset-1.5 rounded-full border border-white/10 bg-[#121316]" />
          <div className="relative z-10 text-center">
            <span className="text-2xl font-semibold text-[#f6d889]">{animatedPercent}%</span>
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.3em] text-white/50">Match</p>
          </div>
        </div>
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          {infoItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-[#15161b] px-4 py-4"
            >
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                {item.label}
              </p>
              <p className="mt-2 text-base font-semibold text-white/90">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white">Résumé du poste</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">{descriptionPreview}</p>
          </div>
          <div className="mt-3 text-sm text-white/60">
            <h4 className="text-xs font-semibold text-white/40">Compétences proposées</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {(offerSkills || []).slice(0, 6).map((s: string) => (
                <span key={s} className="rounded-full border border-white/10 bg-[#101116] px-3 py-1 text-xs text-white/70">{s}</span>
              ))}
            </div>
          </div>
          {detail.tags.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-white">Mots-clés</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-[#101116] px-3 py-1 text-xs text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="rounded-3xl border border-white/10 bg-[#15161b] p-4">
            <h4 className="text-sm font-semibold text-white">Entreprise</h4>
            <p className="mt-2 text-sm text-white/60">{detail.company_name}</p>
            {detail.company_type ? (
              <p className="mt-1 text-xs text-white/50">{detail.company_type}</p>
            ) : null}
            <p className="mt-1 text-xs text-white/50">{detail.location}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {contractTags.length > 0 ? (
                contractTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#d8b25e]/40 bg-[#1f1a12] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f6d889]"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-white/50">Contrat non précisé</span>
              )}
            </div>
            {detail.company_website_url ? (
              <a
                href={detail.company_website_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#15161b] px-4 py-2 text-xs text-white/70 transition hover:border-[#d8b25e]/50 hover:text-white"
              >
                <Briefcase size={14} className="text-[#f6d889]" />
                Site de l'entreprise
              </a>
            ) : null}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Missions clés</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              {missionHighlights.length > 0 ? (
                missionHighlights.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Briefcase size={14} className="text-[#f6d889]" />
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-white/50">Non précisé</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#15161b] p-4">
            <h4 className="text-sm font-semibold text-white">Compétences clés</h4>
            {detail.skills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/10 bg-[#101116] px-3 py-1 text-xs text-white/70"
                    title={getSkillDescription({ name: skill })}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-white/50">Non précisé</div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#15161b] p-4">
            <h4 className="text-sm font-semibold text-white">Détails du poste</h4>
            <ul className="mt-3 space-y-2 text-xs text-white/60">
              {detailItems.map((item) => (
                <li key={item.label} className="flex items-start gap-2">
                  <Building2 size={14} className="mt-0.5 text-[#f6d889]" />
                  <div>
                    <p className="text-[0.55rem] uppercase tracking-[0.3em] text-white/40">
                      {item.label}
                    </p>
                    <p className="text-sm text-white/80">{item.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
        </div>
        </div>
      </div>
    </div>

      {isApplyOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#121318] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Postuler</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{detail.title}</h3>
                <p className="mt-1 text-sm text-white/60">{detail.company_name} • {detail.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 transition hover:border-white/30"
              >
                Fermer
              </button>
            </div>

            <form
              className="mt-6 grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!detail) return;
                setIsSubmitting(true);
                setSubmitError(null);
                setSubmitSuccess(false);
                try {
                  await createApplication({
                    offerId: detail.id,
                    offerTitle: detail.title,
                    companyName: detail.company_name,
                    location: detail.location,
                    firstName,
                    lastName,
                    cvUrl,
                    linkedinUrl: linkedinUrl || undefined,
                  });
                  setSubmitSuccess(true);
                  setHasApplied(true);
                  setApplyNotice(true);
                  setFirstName("");
                  setLastName("");
                  setCvUrl("");
                  setLinkedinUrl("");
                  setIsApplyOpen(false);
                  window.setTimeout(() => {
                    setApplyNotice(false);
                  }, 4000);
                } catch (err) {
                  setSubmitError(err instanceof Error ? err.message : "Erreur inconnue");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Prénom</label>
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-2 text-sm text-white outline-none focus:border-[#58A6FF]/60"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Nom (optionnel)</label>
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-2 text-sm text-white outline-none focus:border-[#58A6FF]/60"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Lien du CV</label>
                <input
                  type="url"
                  value={cvUrl}
                  onChange={(event) => setCvUrl(event.target.value)}
                  required
                  placeholder="https://"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-2 text-sm text-white outline-none focus:border-[#58A6FF]/60"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Lien LinkedIn (optionnel)</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(event) => setLinkedinUrl(event.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-2 text-sm text-white outline-none focus:border-[#58A6FF]/60"
                />
              </div>

              {submitError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                  {submitError}
                </div>
              ) : null}

              {submitSuccess ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-100">
                  Candidature envoyée ✅
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-white/50">Les informations seront visibles dans Mes emplois.</p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-[#58A6FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#0b0d10] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Envoi..." : "Valider la postulation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
    
  );
}

export default Detail
