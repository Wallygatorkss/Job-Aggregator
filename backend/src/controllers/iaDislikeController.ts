import { Request, Response } from 'express';
import * as iaDislikeService from '../services/iaDislikeService.js';

export const createIaDislike = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { offerId } = req.body ?? {};
    if (typeof offerId !== 'string' || !offerId) return res.status(400).json({ error: 'offerId manquant' });

    await iaDislikeService.createIaDislike(userId, offerId);
    return res.status(201).json({ data: { offerId } });
  } catch (error) {
    const e = error as any;
    if (e && e.code === 'P2002') {
      return res.status(409).json({ error: 'Offre déjà marquée comme non pertinente' });
    }
    console.error('Erreur creating ia dislike', error);
    return res.status(500).json({ error: "Impossible d'enregistrer le dislike" });
  }
};

export const deleteIaDislike = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { offerId } = req.params ?? {};
    if (typeof offerId !== 'string' || !offerId) return res.status(400).json({ error: 'offerId manquant' });

    await iaDislikeService.deleteIaDislike(userId, offerId);
    return res.json({ data: { offerId } });
  } catch (error) {
    console.error('Erreur deleting ia dislike', error);
    return res.status(500).json({ error: "Impossible de supprimer le dislike" });
  }
};

export const listIaDislikes = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const items = await iaDislikeService.listIaDislikesForUser(userId);
    return res.json({ data: items });
  } catch (error) {
    console.error('Erreur listing ia dislikes', error);
    return res.status(500).json({ error: "Impossible de charger les dislikes" });
  }
};
