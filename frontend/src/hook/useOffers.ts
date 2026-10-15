import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from '../context/useAuth';

export type OfferApiItem = {
  id: string;
  title: string;
  company_name: string;
  skills?: Array<string | { skill_name?: string }>;
  company_logo_url?: string | null;
  location: string;
  salary_min?: number | null;
  salary_max?: number | null;
  contract_type?: string | null;
  published_at?: string;
  small_company?: { company_name?: string };
  formatted_places?: Array<{ place?: string }>;
  contract_types?: Array<{ contract_type?: string }>;
};

const PAGE_SIZE = 8;

type CareerPreferences = {
  status?: 'looking_for_work' | 'employed';
  contractTypes?: string[];
  locations?: string[];
};

const CAREER_PREFERENCES_KEY = 'user_career_preferences';

const loadCareerPreferences = (): CareerPreferences | null => {
  try {
    const raw = localStorage.getItem(CAREER_PREFERENCES_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const buildPreferencesFromApi = (user: any): CareerPreferences | null => {
  if (!user) return null;
  const contractTypes = Array.isArray(user.contract_preferences) ? user.contract_preferences.map((c: any) => c.contract_type) : undefined;
  const locations = Array.isArray(user.location_preferences) ? user.location_preferences.map((l: any) => l.location) : undefined;
  return {
    status: user.professional_status,
    contractTypes,
    locations,
  };
};

const normalizeText = (value: string) => value.toLowerCase();

const scoreOffer = (offer: OfferApiItem, preferences: CareerPreferences | null) => {
  if (!preferences) return 0;

  const offerLocation = normalizeText(offer.location ?? '');
  const contract = normalizeText(offer.contract_type ?? '');
  const title = normalizeText(offer.title ?? '');
  let score = 0;

  const locations = preferences.locations ?? [];
  for (const location of locations) {
    const normalizedLocation = normalizeText(location);
    if (normalizedLocation && offerLocation.includes(normalizedLocation)) {
      score += 60;
    }
  }

  const preferredContracts = (preferences.contractTypes ?? []).map(normalizeText);
  if (preferredContracts.length > 0 && preferredContracts.some((ct) => contract.includes(ct))) {
    score += 40;
  }

  if (preferences.status === 'employed' && (offerLocation.includes('remote') || title.includes('remote'))) {
    score += 8;
  }

  if (preferences.status === 'looking_for_work' && (contract.includes('cdi') || contract.includes('cdd'))) {
    score += 6;
  }

  return score;
};

const sortOffersWithPreferences = (offers: OfferApiItem[], sort?: string, preferences?: CareerPreferences | null) => {
  const prefs = preferences ?? loadCareerPreferences();

  const sorted = [...offers];

  if (sort === 'Plus ancien' || sort === 'Plus récent') {
    sorted.sort((a, b) => {
      const aDate = new Date(a.published_at ?? '').getTime();
      const bDate = new Date(b.published_at ?? '').getTime();
      return sort === 'Plus récent' ? bDate - aDate : aDate - bDate;
    });
    return sorted;
  }

  sorted.sort((a, b) => {
    const scoreDelta = scoreOffer(b, prefs) - scoreOffer(a, prefs);
    if (scoreDelta !== 0) return scoreDelta;

    const aDate = new Date(a.published_at ?? '').getTime();
    const bDate = new Date(b.published_at ?? '').getTime();
    return bDate - aDate;
  });

  return sorted;
};

export type OfferQueryParams = {
  q?: string;
  location?: string;
  locations?: string[];
  contractTypes?: string[];
  experience?: string;
  sort?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
};

export const useOffers = (params?: OfferQueryParams) => {
  const { token } = useAuth();
  const [offers, setOffers] = useState<OfferApiItem[]>([]);
  const [preferences, setPreferences] = useState<CareerPreferences | null>(() => loadCareerPreferences());
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);

  const cursorRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const fetchOffers = useCallback(async (options?: { reset?: boolean }) => {
    if (loadingRef.current || !hasMoreRef.current) return;

    if (options?.reset) {
      cursorRef.current = null;
      hasMoreRef.current = true;
      loadingRef.current = false;
      setOffers([]);
      setHasMore(true);
      setLoading(false);
      setTotal(null);
    }

    loadingRef.current = true;
    setLoading(true);

    try {
      const qs = new URLSearchParams();
      qs.set('limit', String(PAGE_SIZE));
      qs.set('cursor', cursorRef.current ?? '');
      if (params?.q) qs.set('q', params.q);
      if (params?.locations && params.locations.length) qs.set('locations', params.locations.join(','));
      else if (params?.location) qs.set('location', params.location);
      if (params?.contractTypes && params.contractTypes.length) qs.set('contractTypes', params.contractTypes.join(','));
      if (params?.experience) qs.set('experience', params.experience);
      if (params?.sort) qs.set('sort', params.sort);
      if (params?.salaryMin != null) qs.set('salaryMin', String(params.salaryMin));
      if (params?.salaryMax != null) qs.set('salaryMax', String(params.salaryMax));

      const res = await fetch(`http://localhost:3000/api/offers?${qs.toString()}`);

      const json = await res.json();

  const newOffers = json.data.offers ?? [];
      const apiTotal = typeof json.data.total === 'number' ? json.data.total : null;

      if (apiTotal !== null) {
        setTotal(apiTotal);
      }

  const sortedOffers = sortOffersWithPreferences(newOffers, params?.sort, preferences);

      if (!cursorRef.current) {
        setOffers(sortedOffers);
      } else {
        setOffers((prev) => {
          const seen = new Set(prev.map((o) => o.id));
          const merged = [...prev];
          for (const o of sortedOffers) {
            if (!seen.has(o.id)) {
              merged.push(o);
              seen.add(o.id);
            }
          }
          return merged;
        });
      }

  cursorRef.current = json.data.nextCursor;

      if (!json.data.nextCursor) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const json = await res.json();
        const prefs = buildPreferencesFromApi(json);
        if (prefs) setPreferences(prefs);
      } catch {
      }
    };
    void load();
  }, [token]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fetchOffers({ reset: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [fetchOffers]);

  useEffect(() => {
    const handlePreferencesUpdate = () => {
      void fetchOffers({ reset: true });
    };

    window.addEventListener('career-preferences-updated', handlePreferencesUpdate);
    return () => window.removeEventListener('career-preferences-updated', handlePreferencesUpdate);
  }, [fetchOffers]);

  const removeOffer = useCallback((id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const patchOffer = useCallback((id: string, patch: { title?: string; company_name?: string; place?: string; contract_type?: string }) => {
    setOffers((prev) => prev.map((o) => {
      if (o.id !== id) return o;
      return {
        ...o,
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.company_name !== undefined && {
          small_company: { ...o.small_company, company_name: patch.company_name },
        }),
        ...(patch.place !== undefined && {
          formatted_places: [{ place: patch.place }, ...(o.formatted_places?.slice(1) ?? [])],
        }),
        ...(patch.contract_type !== undefined && {
          contract_types: [{ contract_type: patch.contract_type }, ...(o.contract_types?.slice(1) ?? [])],
        }),
      };
    }));
  }, []);

  return { offers, loading, fetchOffers, hasMore, total, removeOffer, patchOffer };
};

export type UseOffersReturn = ReturnType<typeof useOffers> & { total: number | null };
