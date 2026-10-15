import { Request, Response } from 'express';
import * as ModerationService from '../services/moderationService.js';
import { Prisma } from '../utils/prisma.js';

const isKnownPrismaError = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
    error instanceof Prisma.PrismaClientKnownRequestError;

const parseJobPatchBody = (body: Record<string, unknown>): ModerationService.UpdateJobInput | null => {
    const updates: ModerationService.UpdateJobInput = {};

    if ('title' in body) {
        if (typeof body.title !== 'string' || !body.title.trim()) return null;
        updates.title = body.title;
    }

    if ('description' in body) {
        if (typeof body.description !== 'string' || !body.description.trim()) return null;
        updates.description = body.description;
    }

    if ('description_preview' in body) {
        if (body.description_preview !== null && typeof body.description_preview !== 'string') return null;
        updates.description_preview = body.description_preview;
    }

    if ('raw_description' in body) {
        if (body.raw_description !== null && typeof body.raw_description !== 'string') return null;
        updates.raw_description = body.raw_description;
    }

    if ('helmet_handle' in body) {
        if (body.helmet_handle !== null && typeof body.helmet_handle !== 'string') return null;
        updates.helmet_handle = body.helmet_handle;
    }

    if ('seo_alias' in body) {
        if (body.seo_alias !== null && typeof body.seo_alias !== 'string') return null;
        updates.seo_alias = body.seo_alias;
    }

    if ('status' in body) {
        if (body.status !== null && (typeof body.status !== 'string' || !body.status.trim())) return null;
        updates.status = body.status ?? null;
    }

    if ('application_30_days' in body) {
        if (body.application_30_days !== null && typeof body.application_30_days !== 'boolean') return null;
        updates.application_30_days = body.application_30_days ?? null;
    }

    if ('ranking' in body) {
        if (body.ranking === null) {
            updates.ranking = null;
        } else if (typeof body.ranking === 'number' && Number.isFinite(body.ranking)) {
            updates.ranking = BigInt(Math.trunc(body.ranking));
        } else {
            return null;
        }
    }

    if ('premium_bool' in body) {
        if (body.premium_bool !== null && typeof body.premium_bool !== 'boolean') return null;
        updates.premium_bool = body.premium_bool ?? null;
    }

    if ('premium_int' in body) {
        if (body.premium_int === null) {
            updates.premium_int = null;
        } else if (typeof body.premium_int === 'number' && Number.isFinite(body.premium_int)) {
            updates.premium_int = BigInt(Math.trunc(body.premium_int));
        } else {
            return null;
        }
    }

    if (Object.keys(updates).length === 0) {
        return null;
    }

    return updates;
};

export const deleteJob = async (req: Request, res: Response) => {
    try {
        const rawId = req.params.id;
        const jobId = Array.isArray(rawId) ? rawId[0] : rawId;
        await ModerationService.deleteJob(jobId);
        return res.status(200).json({ message: 'Offre supprimee avec succes' });
    } catch (error) {
        if (isKnownPrismaError(error) && error.code === 'P2025') {
            return res.status(404).json({ message: 'Offre introuvable' });
        }

        return res.status(500).json({ message: "Erreur lors de la suppression de l'offre" });
    }
};

export const patchJob = async (req: Request, res: Response) => {
    if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
        return res.status(400).json({ message: 'Payload de mise a jour invalide' });
    }

    const updates = parseJobPatchBody(req.body);

    if (!updates) {
        return res.status(400).json({ message: 'Payload de mise a jour invalide' });
    }

    try {
        const rawId = req.params.id;
        const jobId = Array.isArray(rawId) ? rawId[0] : rawId;
        const updatedJob = await ModerationService.updateJob(jobId, updates);
        return res.status(200).json(updatedJob);
    } catch (error) {
        if (isKnownPrismaError(error) && error.code === 'P2025') {
            return res.status(404).json({ message: 'Offre introuvable' });
        }

        return res.status(500).json({ message: "Erreur lors de la mise a jour de l'offre" });
    }
};

export const banUser = async (req: Request, res: Response) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({ message: 'Identifiant utilisateur invalide' });
    }

    try {
        const bannedUser = await ModerationService.banUser(userId);
        return res.status(200).json({
            message: 'Utilisateur banni avec succes',
            user: bannedUser
        });
    } catch (error) {
        if (isKnownPrismaError(error) && error.code === 'P2025') {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        return res.status(500).json({ message: "Erreur lors du bannissement de l'utilisateur" });
    }
};
