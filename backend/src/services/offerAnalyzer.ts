type Profile = Record<string, any>;
type Offer = { titre?: string; societe?: string; mots_cles?: string[]; offer_match?: string; title?: string; company?: string };

const normalize = (s: string) => (s || '').toLowerCase();

export const generateOfferMatch = (profile: Profile, offer: Offer): string => {
  const title = offer.titre || offer.title || '';
  const company = offer.societe || offer.company || '';
  const keywords = Array.isArray(offer.mots_cles) ? offer.mots_cles.map((k) => normalize(String(k))) : [];

  const profileSkills: string[] = Array.isArray(profile.skills)
    ? profile.skills.map((s: any) => String(Array.isArray(s) ? s[0] : s).trim())
    : [];
  const summary = String(profile.summary || profile.bio || '').trim();
  const experiences = Array.isArray(profile.experiences) ? profile.experiences : [];

  const matchedSkills = new Set<string>();

  for (const kw of keywords) {
    if (!kw) continue;
    for (const sk of profileSkills) {
      if (normalize(sk).includes(kw) || kw.includes(normalize(sk))) {
        matchedSkills.add(sk);
      }
    }
    if (normalize(summary).includes(kw)) matchedSkills.add(kw);
    for (const exp of experiences) {
      const text = `${exp?.titre || ''} ${exp?.societe || ''} ${exp?.bullets?.join(' ') || ''}`;
      if (normalize(text).includes(kw)) matchedSkills.add(kw);
    }
  }

  const matchedArray = Array.from(matchedSkills).slice(0, 6);

  const relevantExps: string[] = [];
  for (const exp of experiences) {
    const text = `${exp?.titre || ''} ${exp?.societe || ''} ${exp?.bullets?.join(' ') || ''}`;
    const found = keywords.some((kw) => normalize(text).includes(kw));
    if (found) {
      const titlePart = exp?.titre ? `${exp.titre}` : '';
      const companyPart = exp?.societe ? `chez ${exp.societe}` : '';
      const bullet = exp?.bullets && exp.bullets.length ? exp.bullets[0] : '';
      relevantExps.push([titlePart, companyPart, bullet].filter(Boolean).join(' — '));
    }
    if (relevantExps.length >= 2) break;
  }

  const parts: string[] = [];

  const role = profile.poste || (experiences[0] && experiences[0].titre) || '';

  if (matchedArray.length > 0) {
    parts.push(
      `Mon expérience en ${matchedArray.join(', ')}${role ? ` et mon rôle en tant que ${role}` : ''} ` +
        `font de moi un(e) bon(ne) candidat(e) pour le poste de ${title || 'votre offre'}${company ? ` chez ${company}` : ''}.`
    );
  } else if (role) {
    parts.push(`En tant que ${role}, j'ai acquis des compétences transférables qui correspondent au poste${company ? ` chez ${company}` : ''}.`);
  } else if (summary) {
    parts.push(summary);
  } else {
    parts.push(`Je suis intéressé(e) par le poste de ${title || 'votre offre'}${company ? ` chez ${company}` : ''} et je pense pouvoir apporter une contribution rapidement.`);
  }

  if (relevantExps.length > 0) {
    parts.push(`Par exemple : ${relevantExps.join(' ; ')}.`);
  }

  const motivators: string[] = [];
  if (keywords.some((k) => k.includes('agile') || k.includes('scrum'))) motivators.push('travailler en équipe agile');
  if (keywords.some((k) => k.includes('saas') || k.includes('startup'))) motivators.push('construire des produits orientés utilisateur');
  if (keywords.some((k) => k.includes('cloud') || k.includes('aws') || k.includes('gcp') || k.includes('azure'))) motivators.push('contribuer à des architectures cloud résilientes');

  if (motivators.length > 0) {
    parts.push(`Je suis particulièrement motivé(e) par ${motivators.slice(0, 2).join(' et ')}.`);
  }

  parts.push('Je serais ravi(e) d’en discuter davantage et de montrer comment je peux contribuer à vos objectifs.');

  const result = parts.join(' ').replace(/\s+/g, ' ').trim();
  return result.length > 800 ? result.slice(0, 790) + '…' : result;
};

export default generateOfferMatch;

export const reformulateOfferMatch = (text: string, profile?: Profile, offer?: Offer): string => {
  let s = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!s) return '';

  const patterns: Array<[RegExp, string]> = [
    [/\bMon exp\u00e9rience\b/gi, 'Fort(e) de mon exp\u00e9rience'],
    [/\bJ'ai d\u00e9j\u00e0 travaill\u00e9\b/gi, "J'ai d\u00e9j\u00e0 eu l'occasion de travailler"],
    [/\bcorrespond exactement\b/gi, 'correspond parfaitement'],
    [/\bagilit\u00e9\b/gi, 'm\u00e9thodes agiles (Scrum)'],
    [/\benvironnement SaaS\b/gi, 'environnement SaaS/produit'],
  ];

  for (const [re, rep] of patterns) {
    s = s.replace(re, rep);
  }

  const sentences = s.split(/[.?!]+\s*/).map((x) => x.trim()).filter(Boolean);
  let result = sentences.slice(0, 2).join('. ');
  if (result && !/[.?!]$/.test(result)) result = result + '.';

  if (sentences.length === 0 && profile) {
    const role = profile.poste || '';
    const title = offer?.titre || offer?.title || '';
    result = `Je suis intéressé(e) par le poste${title ? ` ${title}` : ''}${role ? ` en tant que ${role}` : ''}.`;
  }

  result = result.replace(/\s+/g, ' ').trim();
  return result.length > 800 ? result.slice(0, 790) + '…' : result;
};
