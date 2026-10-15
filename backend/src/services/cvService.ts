import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prisma } from '../utils/prisma.js';
import { generateOfferMatch, reformulateOfferMatch } from './offerAnalyzer.js';

type CvOfferInput = {
  titre?: string;
  societe?: string;
  mots_cles?: string[];
  offer_match?: string;
};

type CvGenerationResult = {
  fileName: string;
  buffer: Buffer;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPT_PATH = path.resolve(__dirname, '../../IA/GenerateCV.py');
const prismaClient = prisma as any;

type UserSkillWithSkill = {
  skill: { name: string };
};

type ExperienceRecord = {
  title: string;
  company: string;
  start_date: Date;
  end_date: Date | null;
  description: string | null;
};

const splitUsername = (username: string | null, email: string | null) => {
  if (!username) {
    if (email && email.includes('@')) {
      const base = email.split('@')[0];
      return { prenom: base, nom: '' };
    }
    return { prenom: '', nom: '' };
  }
  const parts = username.replace(/[_-]+/g, ' ').trim().split(/\s+/g).filter(Boolean);
  if (parts.length === 0) return { prenom: '', nom: '' };
  if (parts.length === 1) return { prenom: parts[0], nom: '' };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
};

const formatDateRange = (startDate: Date | null, endDate: Date | null) => {
  if (startDate && endDate) {
    return `${startDate.getFullYear()} – ${endDate.getFullYear()}`;
  }
  if (startDate) {
    return `${startDate.getFullYear()} – Présent`;
  }
  return '';
};

const buildProfilePayload = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      phone: true,
      language: true,
      bio: true,
  interests: true,
  formations: true,
      website: true,
      location: true,
      avatar_url: true,
      banner_url: true,
    } as any,
  }) as any;

  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  const { prenom, nom } = splitUsername(user.username, user.email);

  const profile: Record<string, unknown> = {
    id: user.id,
    prenom,
    nom,
    email: user.email,
  };

  if (user.phone) profile.phone = user.phone;
  if (user.language) profile.language = user.language;
  if (user.bio) profile.bio = user.bio;
  if (user.website) profile.website = user.website;
  if (user.location) profile.location = user.location;
  if (user.avatar_url) profile.avatar_url = user.avatar_url;
  if (user.banner_url) profile.banner_url = user.banner_url;

  const interests = Array.isArray(user.interests)
    ? user.interests.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];

  if (interests.length > 0) {
    profile.interets = interests;
  }

  const formations = Array.isArray(user.formations)
    ? user.formations
        .map((entry: any) => {
          const diplome = entry?.diplome ? String(entry.diplome).trim() : '';
          const ecole = entry?.ecole ? String(entry.ecole).trim() : '';
          const dates = entry?.dates ? String(entry.dates).trim() : '';
          if (!diplome && !ecole && !dates) return null;
          return {
            diplome,
            ecole,
            dates,
          };
        })
        .filter(Boolean)
    : [];

  if (formations.length > 0) {
    profile.formations = formations;
  }

  const userSkills = (await prismaClient.userSkill.findMany({
    where: { user_id: userId },
    include: { skill: true },
    orderBy: { skill: { name: 'asc' } },
  })) as UserSkillWithSkill[];

  if (userSkills.length > 0) {
    profile.skills = userSkills.map((item: UserSkillWithSkill, index: number) => [
      item.skill.name,
      Math.max(50, 80 - index * 2),
    ]);
  }

  const experiences = (await prismaClient.experience.findMany({
    where: { user_id: userId },
    orderBy: [{ start_date: 'desc' }, { createdAt: 'desc' }],
  })) as ExperienceRecord[];

  if (experiences.length > 0) {
    profile.experiences = experiences.map((experience: ExperienceRecord) => ({
      titre: experience.title,
      societe: experience.company,
      lieu: '',
      dates: formatDateRange(experience.start_date, experience.end_date),
      bullets: experience.description ? [experience.description] : [],
    }));
  }

  if (user.phone) profile.telephone = user.phone;
  if (user.location) profile.ville = user.location;
  if (user.bio) profile.summary = user.bio;
  if (user.website) profile.linkedin = user.website;

  if (experiences.length > 0 && experiences[0].title) {
    profile.poste = experiences[0].title;
  }

  if (user.language) {
    const code = String(user.language).toLowerCase();
    const langMap: Record<string, string> = { fr: 'Français', en: 'Anglais', es: 'Espagnol', de: 'Allemand', it: 'Italien', pt: 'Portugais' };
    const display = langMap[code] ?? code;
    profile.langues = [[display, 'Natif']];
  }

  return profile;
};

const resolvePythonPath = () => {
  if (process.env.CV_PYTHON_PATH) {
    return process.env.CV_PYTHON_PATH;
  }

  const candidates = ['/bin/python3', '/usr/bin/python3', 'python3'];

  for (const candidate of candidates) {
    try {
      fsSync.accessSync(candidate, fsSync.constants.X_OK);
      return candidate;
    } catch (error) {
      console.warn('Python3 candidate unavailable', candidate, error);
    }
  }

  return null;
};

const runPythonScript = (env: NodeJS.ProcessEnv) =>
  new Promise<void>((resolve, reject) => {
    const pythonPath = resolvePythonPath();

    if (!pythonPath) {
      reject(new Error('Python3 est introuvable sur le serveur. Configurez CV_PYTHON_PATH.'));
      return;
    }
    const processRef = spawn(pythonPath, [SCRIPT_PATH], {
      env: { ...process.env, ...env },
    });

    let stderr = '';

    processRef.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    processRef.on('error', (error) => reject(error));
    processRef.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `La génération du CV a échoué (code ${code})`));
    });
  });

export const generateCvForUser = async (userId: number, offer?: CvOfferInput): Promise<CvGenerationResult> => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-'));

  try {
    const profilePayload = await buildProfilePayload(userId);
    const profilePath = path.join(tmpDir, 'profile.json');
    await fs.writeFile(profilePath, JSON.stringify(profilePayload, null, 2), 'utf-8');

    let offerPath: string | null = null;
    if (offer && Object.keys(offer).length > 0) {
      const sanitizedOffer = { ...offer } as any;
      if (Array.isArray((offer as any).mots_cles)) {
        sanitizedOffer.mots_cles = (offer as any).mots_cles.map((s: any) => String(s)).filter(Boolean).slice(0, 8);
      }
      try {
        if (sanitizedOffer.offer_match) {
          let parsed = null;
          try {
            parsed = JSON.parse(String(sanitizedOffer.offer_match));
          } catch {
            parsed = null;
          }

          if (parsed && (Array.isArray(parsed.matchedSkills) || Array.isArray(parsed.suggestedSkills))) {
            const matchedSkills = Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills.map((s: any) => String(s)) : [];
            const suggestedSkills = Array.isArray(parsed.suggestedSkills) ? parsed.suggestedSkills.map((s: any) => String(s)) : [];
            sanitizedOffer.mots_cles = [...matchedSkills.slice(0, 6), ...suggestedSkills].slice(0, 8);
            sanitizedOffer.offer_match = generateOfferMatch(profilePayload as any, sanitizedOffer as any);
          } else {
            sanitizedOffer.offer_match = reformulateOfferMatch(String(sanitizedOffer.offer_match), profilePayload as any, sanitizedOffer as any);
          }
        } else {
          sanitizedOffer.offer_match = generateOfferMatch(profilePayload as any, sanitizedOffer as any);
        }
      } catch (e) {
        console.warn('Impossible de générer le résumé de correspondance du CV', e);
        sanitizedOffer.offer_match = sanitizedOffer.offer_match || '';
      }
      offerPath = path.join(tmpDir, 'offer.json');
      await fs.writeFile(offerPath, JSON.stringify(sanitizedOffer, null, 2), 'utf-8');
    }

    await runPythonScript({
      CV_PROFILE_JSON: profilePath,
      CV_OFFER_JSON: offerPath || undefined,
      CV_OUTPUT_DIR: tmpDir,
    });

    const files = await fs.readdir(tmpDir);
    const pdfName = files.find((name) => name.toLowerCase().endsWith('.pdf'));

    if (!pdfName) {
      throw new Error('Le PDF n\'a pas été généré');
    }

    const pdfPath = path.join(tmpDir, pdfName);
    const buffer = await fs.readFile(pdfPath);

    return { fileName: pdfName, buffer };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
};
