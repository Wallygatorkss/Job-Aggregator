import { prisma } from '../utils/prisma.js';

type ExperienceInput = {
  company: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
};

type ExperienceRecord = {
  id: number;
  company: string;
  title: string;
  start_date: Date;
  end_date: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const assertNonEmpty = (value: string, fieldName: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} requis`);
  }
  return trimmed;
};

const parseDateOnly = (value: string, fieldName: string) => {
  const trimmed = value.trim();

  if (!DATE_ONLY_PATTERN.test(trimmed)) {
    throw new Error(`${fieldName} invalide`);
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== trimmed) {
    throw new Error(`${fieldName} invalide`);
  }

  return parsed;
};

const mapExperience = (experience: ExperienceRecord) => ({
  id: String(experience.id),
  company: experience.company,
  title: experience.title,
  startDate: experience.start_date.toISOString().slice(0, 10),
  endDate: experience.end_date ? experience.end_date.toISOString().slice(0, 10) : null,
  description: experience.description,
  createdAt: experience.createdAt,
  updatedAt: experience.updatedAt,
});

const getExperienceOrThrow = async (userId: number, experienceId: number) => {
  const experience = await prisma.experience.findFirst({
    where: { id: experienceId, user_id: userId },
  });

  if (!experience) {
    throw new Error('EXPERIENCE_NOT_FOUND');
  }

  return experience;
};

export const listExperiencesForUser = async (userId: number) => {
  const experiences = await prisma.experience.findMany({
    where: { user_id: userId },
    orderBy: [{ start_date: 'desc' }, { createdAt: 'desc' }],
  });

  return experiences.map(mapExperience);
};

export const createExperienceForUser = async (userId: number, input: ExperienceInput) => {
  const company = assertNonEmpty(input.company, 'Entreprise');
  const title = assertNonEmpty(input.title, 'Intitulé du poste');
  const startDate = parseDateOnly(input.startDate, 'Date de début');
  const endDate = input.endDate ? parseDateOnly(input.endDate, 'Date de fin') : null;

  if (endDate && endDate.getTime() < startDate.getTime()) {
    throw new Error('La date de fin doit être postérieure à la date de début');
  }

  const experience = await prisma.experience.create({
    data: {
      user_id: userId,
      company,
      title,
      start_date: startDate,
      end_date: endDate,
      description: input.description?.trim() ? input.description.trim() : null,
    },
  });

  return mapExperience(experience as ExperienceRecord);
};

export const updateExperienceForUser = async (userId: number, experienceId: number, input: ExperienceInput) => {
  await getExperienceOrThrow(userId, experienceId);

  const company = assertNonEmpty(input.company, 'Entreprise');
  const title = assertNonEmpty(input.title, 'Intitulé du poste');
  const startDate = parseDateOnly(input.startDate, 'Date de début');
  const endDate = input.endDate ? parseDateOnly(input.endDate, 'Date de fin') : null;

  if (endDate && endDate.getTime() < startDate.getTime()) {
    throw new Error('La date de fin doit être postérieure à la date de début');
  }

  const experience = await prisma.experience.update({
    where: { id: experienceId },
    data: {
      company,
      title,
      start_date: startDate,
      end_date: endDate,
      description: input.description?.trim() ? input.description.trim() : null,
    },
  });

  return mapExperience(experience as ExperienceRecord);
};

export const deleteExperienceForUser = async (userId: number, experienceId: number) => {
  await getExperienceOrThrow(userId, experienceId);
  await prisma.experience.delete({ where: { id: experienceId } });
};
