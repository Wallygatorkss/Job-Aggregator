type SkillLike = {
  name: string;
  type?: 'hardskill' | 'softskill';
};

const normalizeName = (name: string) => name.trim().toLowerCase();

const specificSkillDescriptions: Record<string, string> = {
  html5: 'Langage de balisage pour structurer le contenu des pages web.',
  css3: 'Langage de style pour mettre en forme les pages web.',
  javascript: 'Langage pour rendre un site web interactif.',
  typescript: 'Version typée de JavaScript pour fiabiliser le code.',
  react: 'Bibliothèque JavaScript pour construire des interfaces utilisateur.',
  php: 'Langage côté serveur souvent utilisé pour les sites web.',
  python: 'Langage polyvalent utilisé pour automatiser, analyser et développer.',
  sql: 'Langage pour interroger et gérer des bases de données.',
  html: 'Langage de balisage pour structurer le contenu des pages web.',
  nodejs: 'Environnement JavaScript côté serveur pour construire des applications web.',
};

export const getSkillDescription = (skill: SkillLike) => {
  const normalizedName = normalizeName(skill.name);

  if (specificSkillDescriptions[normalizedName]) {
    return specificSkillDescriptions[normalizedName];
  }

  if (skill.type === 'softskill') {
    return 'Qualité relationnelle utile au travail en équipe.';
  }

  if (skill.type === 'hardskill') {
    return 'Compétence technique liée à un outil, un langage ou un framework.';
  }

  return 'Compétence utile pour ce poste.';
};