import { useEffect, useState } from "react";

export type DetailApiItem = {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  company_website_url: string | null;
  company_type: string | null;
  description: string;
  description_preview: string | null;
  raw_description: string | null;
  location: string;
  contract_type: string | null;
  contract_types: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_recurrence: string | null;
  salary_max_per_year: number | null;
  remote_policy_frequency: string | null;
  remote_policy_days_per_week: number | null;
  accept_remote: string | null;
  start: string | null;
  locale: string | null;
  required_experience: unknown;
  required_experience_pro: unknown;
  skills: string[];
  tags: string[];
  published_at: string;
  original_url: string | null;
  source_type: string | null;
  source_created_at: string | null;
  source_last_update_at: string | null;
  status: string | null;
};

type DetailState = {
  detail: DetailApiItem | null;
  loading: boolean;
  error: string | null;
};

const getApiBaseUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  return "http://localhost:3000";
};

export const useDetail = (id: string | null, refreshKey = 0) => {
  const [state, setState] = useState<DetailState>({
    detail: null,
    loading: Boolean(id),
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const res = await fetch(`${getApiBaseUrl()}/api/details/${id}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error ?? "Erreur lors du chargement");
        }
        if (isMounted) {
          setState({ detail: json.data ?? null, loading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            detail: null,
            loading: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      }
    };

    if (id) {
      fetchDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [id, refreshKey]);

  if (!id) {
    return { detail: null, loading: false, error: null };
  }

  return state;
};