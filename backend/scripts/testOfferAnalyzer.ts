import { generateOfferMatch } from '../src/services/offerAnalyzer.js';
const profile = {
  prenom: 'Alice',
  nom: 'Dupont',
  poste: 'Développeuse Front-End',
  summary: '5 ans d\'expérience en React et TypeScript, création d\'interfaces accessibles.',
  skills: [['React', 90], ['TypeScript', 85], ['Node.js', 60]],
  experiences: [
    { titre: 'Front-End', societe: 'Acme', bullets: ['Refonte SPA React', 'Tests E2E'] },
  ],
};

const offer = { titre: 'Développeur Front-End React', societe: 'Acme', mots_cles: ['React', 'TypeScript', 'Agile'] };

const out = generateOfferMatch(profile, offer);
console.log('Generated offer_match:\n', out);

const frontendPayload = {
  titre: 'Développeur Back',
  societe: 'Acme',
  mots_cles: ['Docker', 'Kubernetes'],
  offer_match: JSON.stringify({ matchedSkills: [], suggestedSkills: ['Ada', 'Docker', 'Express', 'Kubernetes', 'React', 'Vite'] }),
};


const sanitized = { ...frontendPayload } as any;
try {
  const parsed = JSON.parse(String(sanitized.offer_match));
  const matchedSkills = Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [];
  const suggestedSkills = Array.isArray(parsed.suggestedSkills) ? parsed.suggestedSkills : [];
  sanitized.mots_cles = [...matchedSkills.slice(0, 6), ...suggestedSkills].slice(0, 8);
  sanitized.offer_match = generateOfferMatch(profile as any, sanitized as any);
} catch {
  sanitized.offer_match = String(sanitized.offer_match).replace(/\s+/g, ' ').trim();
}

console.log('\nFrontend-style input produced:\n', sanitized.offer_match);
