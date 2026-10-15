import { Request, Response } from "express";
import * as detailService from "../services/detailService.js";

export const getDetails = async (_req: Request, res: Response) => {
  try {
    const details = await detailService.getDetails();
    res.json({ data: details });
  } catch (error) {
    console.error("Erreur impossible de récupérer les détails:", error);
    res.status(500).json({ error: "Impossible de récupérer les détails" });
  }
};

export const getDetailById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resolvedId = Array.isArray(id) ? id[0] : id;
    const detail = await detailService.getDetailById(resolvedId);
    if (!detail) {
      res.status(404).json({ error: "Détail introuvable" });
      return;
    }
    res.json({ data: detail });
  } catch (error) {
    console.error("Erreur impossible de récupérer le détail:", error);
    res.status(500).json({ error: "Impossible de récupérer le détail" });
  }
};