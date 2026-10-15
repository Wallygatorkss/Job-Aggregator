import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/useAuth';
import type { OfferApiItem } from './useOffers';
import { getOfferSkillNames as getOfferSkillNamesFromUtils } from '../utils/offers';
import { createApplication } from '../utils/applications';

const API_URL = (() => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL as string;
  return 'http://localhost:3000';
})();

type Profile = {
  id: number;
  email: string;
  username: string | null;
  professional_status?: 'looking_for_work' | 'employed';
  interests?: string[] | null;
  formations?: Array<{ diplome?: string | null; ecole?: string | null; dates?: string | null }> | null;
};

export type IaMatch = { offer: OfferApiItem; score: number };

const normalize = (s?: string | null) => (s ?? '').toLowerCase();

const splitUsername = (username: string | null, email: string | null) => {
  if (!username) {
    if (email && email.includes('@')) {
      const base = email.split('@')[0];
      return { firstName: base, lastName: '' };
    }
    return { firstName: '', lastName: '' };
  }
  const parts = username.replace(/[_-]+/g, ' ').trim().split(/\s+/g).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

const computeSkillOverlapScore = (offerSkills: string[] | undefined, userSkills: string[] | undefined) => {
  if (!offerSkills || offerSkills.length === 0) return 0;
  if (!userSkills || userSkills.length === 0) return 0;

  const offerSet = new Set(offerSkills.map((s) => s.toLowerCase()));
  let common = 0;
  for (const us of userSkills) {
    if (offerSet.has(us.toLowerCase())) common += 1;
  }

  const pct = common / offerSkills.length;
  return Math.round(pct * 50);
};


const score = (offer: OfferApiItem, profile: Profile | null, userSkills: string[] | null) => {
  const title = normalize(offer.title);
  const company = normalize(offer.company_name ?? offer.small_company?.company_name ?? '');
  const location = normalize(offer.location ?? offer.formatted_places?.[0]?.place ?? '');
  const contract = normalize(offer.contract_type ?? offer.contract_types?.[0]?.contract_type ?? '');

  let s = 0;

  try {
    const prefLocations: string[] = profile && Array.isArray((profile as unknown as Record<string, unknown>).location_preferences)
      ? ((profile as unknown as Record<string, any>).location_preferences as any[]).map((l) => (typeof l === 'string' ? l : (l && typeof l.location === 'string' ? l.location : ''))).filter(Boolean)
      : [];
    const prefContracts: string[] = profile && Array.isArray((profile as unknown as Record<string, unknown>).contract_preferences)
      ? ((profile as unknown as Record<string, any>).contract_preferences as any[]).map((c) => (typeof c === 'string' ? c : (c && typeof c.contract_type === 'string' ? c.contract_type : ''))).filter(Boolean)
      : [];

    for (const pl of prefLocations) {
      if (pl && location.includes(String(pl).toLowerCase())) {
        s += 100; // big boost
        break;
      }
    }

    for (const pc of prefContracts) {
      if (pc && contract.includes(String(pc).toLowerCase())) {
        s += 80; // big boost
        break;
      }
    }
  } catch {
  }

  const offerSkills = getOfferSkillNamesFromUtils(offer as unknown as Record<string, unknown>);
  s += computeSkillOverlapScore(offerSkills, userSkills ?? undefined);

  const { firstName, lastName } = splitUsername(profile?.username ?? null, profile?.email ?? null);
  if (firstName && title.includes(firstName.toLowerCase())) s += 10;
  if (lastName && company.includes(lastName.toLowerCase())) s += 8;

  if (profile?.professional_status === 'employed') {
    if (location.includes('remote') || title.includes('remote')) s += 5;
  }
  if (profile?.professional_status === 'looking_for_work') {
    if (contract.includes('cdi') || contract.includes('cdd')) s += 4;
  }

  const keywords = ['developer', 'développeur', 'engineer', 'ingénieur', 'full-stack', 'frontend', 'backend'];
  for (const kw of keywords) if (title.includes(kw)) s += 1;

  return s;
};

export const useIaMatches = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [offers, setOffers] = useState<OfferApiItem[]>([]);
  const [userSkills, setUserSkills] = useState<string[] | null>(null);
  const [userExperiences, setUserExperiences] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!token) return setProfile(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Impossible de récupérer le profil');
      const json = await res.json();
      setProfile(json);
    } catch {
      setProfile(null);
    }
  }, [token]);

  const fetchUserSkills = useCallback(async () => {
    if (!token) return setUserSkills(null);
    try {
      const res = await fetch(`${API_URL}/api/skills/user`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Impossible de récupérer les compétences');
      const json = await res.json();
      const names = Array.isArray(json)
        ? json
            .map((us: unknown) => {
              const u = us as Record<string, unknown> | null;
              const skill = u?.skill as Record<string, unknown> | undefined;
              return skill && typeof skill.name === 'string' ? skill.name : null;
            })
            .filter(Boolean) as string[]
        : [];
      setUserSkills(names);
    } catch {
      setUserSkills(null);
    }
  }, [token]);

  const fetchUserExperiences = useCallback(async () => {
    if (!token) return setUserExperiences(null);
    try {
      const res = await fetch(`${API_URL}/api/experiences/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Impossible de récupérer les expériences');
      const json = await res.json();
      const list = Array.isArray(json)
        ? json
            .map((e: unknown) => {
              const obj = e as Record<string, unknown> | null;
              if (!obj) return '';
              if (typeof obj.title === 'string') return obj.title;
              if (typeof obj.company === 'string') return obj.company;
              return '';
            })
            .filter(Boolean) as string[]
        : [];
      setUserExperiences(list);
    } catch {
      setUserExperiences(null);
    }
  }, [token]);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
  const res = await fetch(`${API_URL}/api/offers?limit=200&includeSkills=true`);
      if (!res.ok) throw new Error('Impossible de récupérer les offres');
      const json = await res.json();
      setOffers(json.data.offers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      await fetchProfile();
      if (!mounted) return;
      await fetchUserSkills();
      if (!mounted) return;
      await fetchUserExperiences();
    };
    void run();
    return () => { mounted = false; };
  }, [fetchProfile, fetchUserSkills, fetchUserExperiences]);

  useEffect(() => {
    const run = async () => {
      await fetchOffers();
    };
    void run();
  }, [fetchOffers]);

  const matches = useMemo(() => {
    if (!offers || offers.length === 0) return [] as IaMatch[];
    const scored = offers.map((o) => ({ offer: o, score: score(o, profile, userSkills) }));
    scored.sort((a, b) => b.score - a.score || new Date(b.offer.published_at ?? '').getTime() - new Date(a.offer.published_at ?? '').getTime());
    return scored;
  }, [offers, profile, userSkills]);

  const autoApply = useCallback(async (opts?: { max?: number }) => {
    if (!token) throw new Error('Vous devez être connecté pour postuler automatiquement');
    const toApply = matches.filter((m) => m.score > 0).slice(0, opts?.max ?? 10);
    const results: { offerId: string; ok: boolean; error?: string }[] = [];

    const { firstName, lastName } = splitUsername(profile?.username ?? null, profile?.email ?? null);
    const sendFirstName = (firstName && firstName.trim().length > 0) ? firstName : 'Candidat';
    const sendLastName = (lastName && lastName.trim().length > 0) ? lastName : 'Inconnu';

    const createdObjectUrls: string[] = [];

    for (const m of toApply) {
      try {
    const offerSkills = getOfferSkillNamesFromUtils(m.offer as unknown as Record<string, unknown>);
    const matchedSkills = (userSkills ?? []).filter((us) => offerSkills.map((os) => os.toLowerCase()).includes(us.toLowerCase()));
    const uniqueOfferSkills = Array.from(new Set(offerSkills.map((s) => String(s)).filter(Boolean))) as string[];
    const suggestedSkills = uniqueOfferSkills.filter((s) => !matchedSkills.map((x) => x.toLowerCase()).includes(s.toLowerCase())).slice(0, 6);

        const offerPayload: Record<string, any> = {
          titre: m.offer.title,
          societe: m.offer.company_name ?? m.offer.small_company?.company_name ?? '',
          mots_cles: [...matchedSkills.slice(0, 6), ...suggestedSkills].slice(0, 8),
          offer_match: JSON.stringify({ matchedSkills, suggestedSkills }),
        };

        let cvUrlToSend = `${API_URL}/api/cv/sample`;
        try {
          const resp = await fetch(`${API_URL}/api/cv/generate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(offerPayload),
          });

          if (resp.ok) {
            const contentType = resp.headers.get('content-type') || '';
            if (contentType.includes('application/pdf')) {
              const blob = await resp.blob();
              const objUrl = URL.createObjectURL(blob);
              createdObjectUrls.push(objUrl);
              cvUrlToSend = objUrl;
            } else {
              const payload = await resp.json().catch(() => null);
              if (payload && payload.url) {
                cvUrlToSend = payload.url;
              } else {
                cvUrlToSend = `${API_URL}/api/cv/sample`;
              }
            }
          } else {
            cvUrlToSend = `${API_URL}/api/cv/sample`;
          }
        } catch {
          cvUrlToSend = `${API_URL}/api/cv/sample`;
        }

        await createApplication({
          offerId: m.offer.id,
          offerTitle: m.offer.title,
          companyName: m.offer.company_name ?? m.offer.small_company?.company_name ?? '',
          location: m.offer.location ?? m.offer.formatted_places?.[0]?.place ?? '',
          firstName: sendFirstName,
          lastName: sendLastName,
          cvUrl: cvUrlToSend,
        });
        results.push({ offerId: m.offer.id, ok: true });
      } catch (e) {
        results.push({ offerId: m.offer.id, ok: false, error: e instanceof Error ? e.message : 'Erreur' });
      }
    }

    for (const u of createdObjectUrls) {
      try { URL.revokeObjectURL(u); } catch {
      }
    }

    return results;
  }, [matches, profile, token, userSkills]);

  return { profile, offers, matches, loading, error, fetchOffers, fetchProfile, autoApply, userSkills, userExperiences } as const;
};

export default useIaMatches;
