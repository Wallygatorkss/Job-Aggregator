export const getOfferSkillNames = (offer: Record<string, unknown>): string[] => {
  const raw = (offer?.skills ?? []) as unknown;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      if (typeof s === 'string') return s;
      if (s && typeof s === 'object') {
        const obj = s as Record<string, unknown>;
        if (typeof obj.skill_name === 'string') return obj.skill_name;
      }
      return '';
    })
    .filter(Boolean);
};
