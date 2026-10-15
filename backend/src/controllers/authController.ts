import { Request, Response } from "express";
import * as AuthService from "../services/authService.js";
import type { AuthenticatedRequest } from "../middlewares/authMiddlewares.js";

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const result = await AuthService.authenticate(email, password);

        return res.status(200).json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        const statusCode = message.includes('banni') ? 403 : 401;
        return res.status(statusCode).json({ message });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email et mot de passe requis" });
        }

        const result = await AuthService.register(email, password);

        return res.status(201).json(result);
    } catch (error) {
        return res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
};

export const me = async (req: Request, res: Response) => {
    try {
        const authRequest = req as AuthenticatedRequest;
        const userId = authRequest.auth?.userId;

        if (typeof userId !== 'number') {
            return res.status(401).json({ message: 'Token invalide' });
        }

        const user = await AuthService.getCurrentUser(userId);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        return res.status(200).json(user);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Impossible de charger le profil';
        return res.status(500).json({ message });
    }
};

export const updateProfileMedia = async (req: Request, res: Response) => {
    try {
        const authRequest = req as AuthenticatedRequest;
        const userId = authRequest.auth?.userId;

        if (typeof userId !== 'number') {
            return res.status(401).json({ message: 'Token invalide' });
        }

        const { avatar_url, banner_url } = req.body as {
            avatar_url?: string | null;
            banner_url?: string | null;
        };

        const user = await AuthService.updateProfileMedia(userId, { avatar_url, banner_url });

        return res.status(200).json(user);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Mise à jour impossible';
        return res.status(400).json({ message });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const authRequest = req as AuthenticatedRequest;
        const userId = authRequest.auth?.userId;

        if (typeof userId !== 'number') {
            return res.status(401).json({ message: 'Token invalide' });
        }

        const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis' });
        }

        await AuthService.changePassword(userId, currentPassword, newPassword);
        return res.status(200).json({ message: 'Mot de passe mis à jour' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Impossible de changer le mot de passe';
        return res.status(400).json({ message });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const authRequest = req as AuthenticatedRequest;
        const userId = authRequest.auth?.userId;

        if (typeof userId !== 'number') {
            return res.status(401).json({ message: 'Token invalide' });
        }

        const { username, email, professional_status, phone, language, bio, interests, formations, website, location, contractTypes, locations } = req.body as {
            username?: string;
            email?: string;
            professional_status?: string;
            phone?: string | null;
            language?: string | null;
            bio?: string | null;
            interests?: string[] | null;
            formations?: Array<{ diplome?: string | null; ecole?: string | null; dates?: string | null }> | null;
            website?: string | null;
            location?: string | null;
            contractTypes?: string[] | undefined;
            locations?: string[] | undefined;
        };

        const user = await AuthService.updateProfile(userId, {
            username,
            email,
            professional_status,
            phone,
            language,
            bio,
            interests,
            formations,
            website,
            location,
            contractTypes,
            locations,
        });

        return res.status(200).json(user);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Mise à jour impossible';
        return res.status(400).json({ message });
    }
};