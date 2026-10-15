const DB_TO_LABEL: Record<string, string> = {
  permanent: 'CDI',
  fixedTerm: 'CDD',
  internship: 'Stage',
  apprenticeship: 'Alternance',
  partTime: 'Temps partiel',
  freelance: 'Freelance',
};

export const formatContractType = (value: string | null | undefined): string => {
  if (!value) return '';
  return DB_TO_LABEL[value] ?? value;
};
