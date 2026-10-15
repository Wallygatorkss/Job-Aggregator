export type ApplicationPayload = {
  offerId: string;
  offerTitle: string;
  companyName: string;
  location: string;
  firstName: string;
  lastName: string;
  cvUrl: string;
  linkedinUrl?: string;
};

export type ApplicationRecord = ApplicationPayload & {
  id: string;
  createdAt: string;
};

const getApiBaseUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  return "http://localhost:3000";
};

export const createApplication = async (payload: ApplicationPayload) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  try {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {
  }

  const res = await fetch(`${getApiBaseUrl()}/api/applications`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? "Impossible d'envoyer la candidature");
  }

  return json.data as ApplicationRecord;
};

export const listApplications = async () => {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {
  }

  const res = await fetch(`${getApiBaseUrl()}/api/applications`, { headers });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? "Impossible de charger les candidatures");
  }
  return json.data as ApplicationRecord[];
};
