import { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddlewares.js';
import { generateCvForUser } from '../services/cvService.js';
import { getCvTemplateHtml, getSampleCvPdf } from '../services/cvTemplateService.js';
import fs from 'node:fs/promises';
import path from 'node:path';

type CvOfferInput = {
  titre?: string;
  societe?: string;
  mots_cles?: string[];
  offer_match?: string;
};

export const generateMyCv = async (req: Request, res: Response) => {
  try {
    const authRequest = req as AuthenticatedRequest;
    const userId = authRequest.auth?.userId;

    if (typeof userId !== 'number') {
      return res.status(401).json({ message: 'Vous devez être connecté pour générer un CV.' });
    }

    const rawOffer = (req.body ?? {}) as CvOfferInput;
    const offer: CvOfferInput = { ...rawOffer };
    if (Array.isArray(rawOffer.mots_cles)) {
      offer.mots_cles = rawOffer.mots_cles.map((s: any) => String(s)).filter(Boolean).slice(0, 8);
    }
    const result = await generateCvForUser(userId, offer);

    if (offer && Object.keys(offer).length > 0) {
      const publicDir = path.resolve(__dirname, '../../public/generated_cvs');
      try {
        await fs.mkdir(publicDir, { recursive: true });
      } catch (error) {
        console.warn('Impossible de créer le dossier des CV générés', error);
      }
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${result.fileName}`;
      const fullPath = path.join(publicDir, uniqueName);
      await fs.writeFile(fullPath, result.buffer);

      const host = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/+$/,'') : `http://localhost:3000`;
      const hostedUrl = `${host}/generated_cvs/${uniqueName}`;
      return res.status(200).json({ url: hostedUrl, fileName: result.fileName });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    return res.status(200).send(result.buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de générer le CV';
    return res.status(500).json({ message });
  }
};

export const getCvTemplate = async (_req: Request, res: Response) => {
  try {
    const html = await getCvTemplateHtml();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de charger le template';
    return res.status(500).json({ message });
  }
};

export const getSampleCv = async (_req: Request, res: Response) => {
  try {
    const buffer = await getSampleCvPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="CV_Sophie_Martin.pdf"');
    return res.status(200).send(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de charger le CV exemple';
    return res.status(500).json({ message });
  }
};
