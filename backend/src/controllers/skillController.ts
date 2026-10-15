import { Request, Response } from 'express';
import * as SkillService from '../services/skillService.js';
import type { AuthenticatedRequest } from '../middlewares/authMiddlewares.js';

export const getAllSkills = async (req: Request, res: Response) => {
  try {
    const skills = await SkillService.getAllSkills();
    return res.status(200).json(skills);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement des compétences';
    return res.status(500).json({ message });
  }
};

export const getUserSkills = async (req: Request, res: Response) => {
  try {
    const authRequest = req as AuthenticatedRequest;
    const userId = authRequest.auth?.userId;

    if (typeof userId !== 'number') {
      return res.status(401).json({ message: 'Token invalide' });
    }

    const userSkills = await SkillService.getUserSkills(userId);
    return res.status(200).json(userSkills);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de charger les compétences';
    return res.status(500).json({ message });
  }
};

export const updateUserSkills = async (req: Request, res: Response) => {
  try {
    const authRequest = req as AuthenticatedRequest;
    const userId = authRequest.auth?.userId;

    if (typeof userId !== 'number') {
      return res.status(401).json({ message: 'Token invalide' });
    }

    const { skillIds } = req.body as { skillIds?: number[] };

    if (!Array.isArray(skillIds)) {
      return res.status(400).json({ message: 'skillIds doit être un tableau' });
    }

    if (!skillIds.every((id) => typeof id === 'number' && id > 0)) {
      return res.status(400).json({ message: 'skillIds doit contenir des nombres positifs' });
    }

    const userSkills = await SkillService.updateUserSkills(userId, skillIds);
    return res.status(200).json(userSkills);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mise à jour impossible';
    return res.status(400).json({ message });
  }
};
