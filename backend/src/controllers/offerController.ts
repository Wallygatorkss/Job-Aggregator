import { Request, Response } from "express";
import * as offerService from "../services/offerService.js";

export const deleteOffer = async (req: Request, res: Response) => {
  try {
  const { id } = req.params;
  await offerService.deleteOffer(String(id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Impossible de supprimer l'offre" });
  }
};

export const updateOffer = async (req: Request, res: Response) => {
  try {
  const { id } = req.params;
    const { title, description_preview, company_name, contract_type, place, salary_min, salary_max, accept_remote } = req.body as {
      title?: string;
      description_preview?: string;
      company_name?: string;
      contract_type?: string;
      place?: string;
      salary_min?: number | null;
      salary_max?: number | null;
      accept_remote?: string;
    };
  await offerService.updateOffer(String(id), { title, description_preview, company_name, contract_type, place, salary_min, salary_max, accept_remote });
    res.status(200).json({ message: 'Offre mise à jour' });
  } catch (error) {
    res.status(500).json({ error: "Impossible de modifier l'offre" });
  }
};

export const listCities = async (_req: Request, res: Response) => {
  try {
    const cities = await offerService.getAvailableCities();
    res.json({ cities });
  } catch (error) {
    console.error("Erreur impossible de récupérer les villes:", error);
    res.status(500).json({ error: "Impossible de récupérer les villes" });
  }
};

export const listOffers = async (req: Request, res: Response) => {
  try {
    const limitParam = req.query.limit as string | undefined;
    const cursorParam = req.query.cursor as string | undefined;
    const qParam = req.query.q as string | undefined;
    const locationParam = req.query.location as string | undefined;
    const locationsParam = req.query.locations as string | undefined;
    const contractTypesParam = req.query.contractTypes as string | undefined;
  const experienceParam = req.query.experience as string | undefined;
  const sortParam = req.query.sort as string | undefined;
    const salaryMinParam = req.query.salaryMin as string | undefined;
    const salaryMaxParam = req.query.salaryMax as string | undefined;

    const limit = limitParam ? Number(limitParam) : undefined;

    const cursor = cursorParam && cursorParam.trim().length > 0 ? cursorParam : undefined;

    const filters = {
      q: qParam,
      location: locationParam,
      locations: locationsParam ? locationsParam.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      contractTypes: contractTypesParam ? contractTypesParam.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      experience: experienceParam,
      sort: sortParam,
      salaryMin: salaryMinParam ? Number(salaryMinParam) : undefined,
      salaryMax: salaryMaxParam ? Number(salaryMaxParam) : undefined,
    };

  const includeSkills = req.query.includeSkills === 'true' || req.query.includeSkills === '1';
  const result = await offerService.getOffers(cursor, limit, filters, { includeSkills });

    res.json({ data: { offers: result.offers, nextCursor: result.nextCursor, total: result.total } });
  } catch (error) {
    console.error("Erreur impossible de récupérer les offres:", error);
    res.status(500).json({ error: "Impossible de récupérer les offres" });
  }
};