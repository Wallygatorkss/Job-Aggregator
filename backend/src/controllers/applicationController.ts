import { Request, Response } from "express";
import * as applicationService from "../services/applicationService.js";

const mapApplication = (application: {
  id: string;
  offer_id: string;
  offer_title: string;
  company_name: string;
  location: string;
  first_name: string;
  last_name: string;
  cv_url: string;
  linkedin_url: string | null;
  created_at: Date;
}) => ({
  id: application.id,
  offerId: application.offer_id,
  offerTitle: application.offer_title,
  companyName: application.company_name,
  location: application.location,
  firstName: application.first_name,
  lastName: application.last_name,
  cvUrl: application.cv_url,
  linkedinUrl: application.linkedin_url,
  createdAt: application.created_at,
});

const isNonEmptyString = (value: unknown) => typeof value === "string" && value.trim().length > 0;

export const listApplications = async (_req: Request, res: Response) => {
  try {
    const userId = (_req as any).auth?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const applications = await applicationService.listApplicationsForUser(userId);
    res.json({ data: applications.map(mapApplication) });
  } catch (error) {
    console.error("Erreur lors du chargement des candidatures:", error);
    res.status(500).json({ error: "Impossible de charger les candidatures" });
  }
};

export const createApplication = async (req: Request, res: Response) => {
  try {
    const {
      offerId,
      offerTitle,
      companyName,
      location,
      username,
      firstName: bodyFirstName,
      lastName: bodyLastName,
      cvUrl,
      linkedinUrl,
    } = req.body ?? {};

    let firstName = typeof bodyFirstName === 'string' && bodyFirstName.trim().length > 0 ? bodyFirstName.trim() : undefined;
    let lastName = typeof bodyLastName === 'string' && bodyLastName.trim().length > 0 ? bodyLastName.trim() : undefined;

    if ((!firstName) && typeof username === 'string' && username.trim().length > 0) {
      const parts = username.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 1) {
        firstName = parts[0];
        lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
      }
    }

    if (
      !isNonEmptyString(offerId) ||
      !isNonEmptyString(offerTitle) ||
      !isNonEmptyString(companyName) ||
      !isNonEmptyString(location) ||
      !isNonEmptyString(firstName) ||
      !isNonEmptyString(cvUrl)
    ) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const application = await applicationService.createApplication({
      offerId,
      offerTitle,
      companyName,
      location,
      firstName: firstName as string,
      lastName: (typeof lastName === 'string' ? lastName : ''),
      cvUrl,
      linkedinUrl: isNonEmptyString(linkedinUrl) ? linkedinUrl : undefined,
      userId: (req as any).auth?.userId ?? null,
    });

    return res.status(201).json({ data: mapApplication(application) });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_APPLICATION") {
      return res.status(409).json({ error: "Candidature déjà enregistrée" });
    }
    console.error("Erreur lors de la création d'une candidature:", error);
    return res.status(500).json({ error: "Impossible d'envoyer la candidature" });
  }
};
