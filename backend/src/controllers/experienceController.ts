import { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddlewares.js';
import * as experienceService from '../services/experienceService.js';

const getAuthenticatedUserId = (req: Request) => {
  const authRequest = req as AuthenticatedRequest;
  const userId = authRequest.auth?.userId;

  if (typeof userId !== 'number') {
    throw new Error('Token invalide');
  }

  return userId;
};

const parseExperienceId = (value: string) => {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('ID expérience invalide');
  }
  return id;
};

export const listMyExperiences = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const experiences = await experienceService.listExperiencesForUser(userId);
    return res.status(200).json(experiences);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de charger les expériences';
    const statusCode = message === 'Token invalide' ? 401 : 500;
    return res.status(statusCode).json({ message });
  }
};

export const createMyExperience = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { company, title, startDate, endDate, description } = req.body ?? {};

    const experience = await experienceService.createExperienceForUser(userId, {
      company,
      title,
      startDate,
      endDate: endDate === undefined ? null : endDate,
      description,
    });

    return res.status(201).json(experience);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de créer l’expérience';
    const statusCode = message === 'Token invalide' ? 401 : 400;
    return res.status(statusCode).json({ message });
  }
};

export const updateMyExperience = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const experienceId = parseExperienceId(req.params.id);
    const { company, title, startDate, endDate, description } = req.body ?? {};

    const experience = await experienceService.updateExperienceForUser(userId, experienceId, {
      company,
      title,
      startDate,
      endDate: endDate === undefined ? null : endDate,
      description,
    });

    return res.status(200).json(experience);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de mettre à jour l’expérience';
    if (message === 'Token invalide') return res.status(401).json({ message });
    if (message === 'ID expérience invalide') return res.status(400).json({ message });
    if (message === 'EXPERIENCE_NOT_FOUND') return res.status(404).json({ message: 'Expérience introuvable' });
    return res.status(400).json({ message });
  }
};

export const deleteMyExperience = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const experienceId = parseExperienceId(req.params.id);
    await experienceService.deleteExperienceForUser(userId, experienceId);
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de supprimer l’expérience';
    if (message === 'Token invalide') return res.status(401).json({ message });
    if (message === 'ID expérience invalide') return res.status(400).json({ message });
    if (message === 'EXPERIENCE_NOT_FOUND') return res.status(404).json({ message: 'Expérience introuvable' });
    return res.status(400).json({ message });
  }
};
