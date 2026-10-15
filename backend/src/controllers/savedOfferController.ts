import { Request, Response } from "express";
import * as savedOfferService from "../services/savedOfferService.js";

export const listSavedOffers = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const items = await savedOfferService.listSavedOffersForUser(userId);
    return res.json({ data: items });
  } catch (error) {
    console.error("Erreur listing saved offers", error);
    return res.status(500).json({ error: "Impossible de charger les offres enregistrées" });
  }
};

export const createSavedOffer = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { offerId } = req.body ?? {};
    if (typeof offerId !== "string" || !offerId) {
      return res.status(400).json({ error: "offerId manquant" });
    }

    await savedOfferService.createSavedOffer(userId, offerId);
    return res.status(201).json({ data: { offerId } });
  } catch (error) {
    const e = error as any;
    if (e && e.code === 'P2002') {
      return res.status(409).json({ error: 'Offre déjà enregistrée' });
    }
    console.error("Erreur creating saved offer", error);
    return res.status(500).json({ error: "Impossible d'enregistrer l'offre" });
  }
};

export const deleteSavedOffer = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { offerId } = req.params ?? {};
    if (typeof offerId !== "string" || !offerId) {
      return res.status(400).json({ error: "offerId manquant" });
    }

    await savedOfferService.deleteSavedOffer(userId, offerId);
    return res.json({ data: { offerId } });
  } catch (error) {
    console.error("Erreur deleting saved offer", error);
    return res.status(500).json({ error: "Impossible de supprimer l'offre" });
  }
};

