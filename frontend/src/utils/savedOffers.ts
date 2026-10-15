export type SavedOffer = {
  id: string;
  title: string;
  company: string;
  location: string;
  savedAt: string;
};

const STORAGE_KEY = "savedOffers";

const safelyParse = (value: string | null): SavedOffer[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as SavedOffer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const loadSavedOffers = (): SavedOffer[] => {
  if (typeof window === "undefined") return [];
  return safelyParse(window.localStorage.getItem(STORAGE_KEY));
};

export const saveSavedOffers = (offers: SavedOffer[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
};

export const isOfferSaved = (id: string) =>
  loadSavedOffers().some((offer) => offer.id === id);

export const toggleSavedOffer = (offer: SavedOffer) => {
  const current = loadSavedOffers();
  const exists = current.some((item) => item.id === offer.id);
  const next = exists
    ? current.filter((item) => item.id !== offer.id)
    : [{ ...offer, savedAt: new Date().toISOString() }, ...current];
  saveSavedOffers(next);
  return { offers: next, saved: !exists };
};

export const removeSavedOffer = (id: string) => {
  const current = loadSavedOffers();
  const next = current.filter((item) => item.id !== id);
  saveSavedOffers(next);
  return next;
};

const getApiBaseUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  return "http://localhost:3000";
};

const buildAuthHeaders = () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {
  }
  return headers;
};

export const loadSavedOffersAsync = async (): Promise<SavedOffer[]> => {
  try {
    const headers = buildAuthHeaders();
    if (!headers["Authorization"]) {
      return loadSavedOffers();
    }

    const res = await fetch(`${getApiBaseUrl()}/api/saved-offers`, { headers });
    const json = await res.json();
    if (!res.ok) return loadSavedOffers();
    type ApiRow = {
      offer_id: string;
      offer?: {
        title?: string;
        small_company?: { company_name?: string };
        formatted_places?: Array<{ place?: string }>;
      };
      saved_at?: string;
    };
    return (json.data as ApiRow[]).map((row) => ({
      id: row.offer_id,
      title: row.offer?.title ?? row.offer_id,
      company: row.offer?.small_company?.company_name ?? "",
      location: row.offer?.formatted_places?.[0]?.place ?? "",
      savedAt: row.saved_at ?? new Date().toISOString(),
    }));
  } catch {
    return loadSavedOffers();
  }
};

export const createSavedOfferAsync = async (offerId: string) => {
  try {
    const headers = buildAuthHeaders();
    if (!headers["Authorization"]) throw new Error("Unauthorized");
    const res = await fetch(`${getApiBaseUrl()}/api/saved-offers`, {
      method: "POST",
      headers,
      body: JSON.stringify({ offerId }),
    });
    if (!res.ok) throw new Error("Failed to save");
    return true;
  } catch {
    return false;
  }
};

export const deleteSavedOfferAsync = async (offerId: string) => {
  try {
    const headers = buildAuthHeaders();
    if (!headers["Authorization"]) throw new Error("Unauthorized");
    const res = await fetch(`${getApiBaseUrl()}/api/saved-offers/${encodeURIComponent(offerId)}`, {
      method: "DELETE",
      headers,
    });
    return res.ok;
  } catch {
    return false;
  }
};
