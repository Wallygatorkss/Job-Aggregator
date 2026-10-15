export type InterviewRecord = {
  id: string;
  offerId: string;
  role: string;
  company: string;
  location: string;
  stage: string;
  scheduledAt: string;
  place: string;
};

export type ArchiveRecord = {
  id: string;
  offerId: string;
  role: string;
  company: string;
  location: string;
  status: string;
  archivedAt: string;
};

const INTERVIEWS_KEY = "mesEmplois_interviews";
const ARCHIVES_KEY = "mesEmplois_archives";

const safeParse = <T>(value: string | null): T[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const loadInterviews = () => {
  if (typeof window === "undefined") return [] as InterviewRecord[];
  return safeParse<InterviewRecord>(window.localStorage.getItem(INTERVIEWS_KEY));
};

export const saveInterviews = (items: InterviewRecord[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INTERVIEWS_KEY, JSON.stringify(items));
};

export const addInterview = (item: InterviewRecord) => {
  const current = loadInterviews();
  const next = [item, ...current.filter((entry) => entry.offerId !== item.offerId)];
  saveInterviews(next);
  return next;
};

export const removeInterview = (offerId: string) => {
  const current = loadInterviews();
  const next = current.filter((entry) => entry.offerId !== offerId);
  saveInterviews(next);
  return next;
};

export const loadArchives = () => {
  if (typeof window === "undefined") return [] as ArchiveRecord[];
  return safeParse<ArchiveRecord>(window.localStorage.getItem(ARCHIVES_KEY));
};

export const saveArchives = (items: ArchiveRecord[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ARCHIVES_KEY, JSON.stringify(items));
};

export const addArchive = (item: ArchiveRecord) => {
  const current = loadArchives();
  const next = [item, ...current.filter((entry) => entry.offerId !== item.offerId)];
  saveArchives(next);
  return next;
};
