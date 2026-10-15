import { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyToken, type AuthTokenPayload } from '../utils/jwt.js';

export type AuthenticatedRequest = import('express').Request & {
    auth?: AuthTokenPayload;
};

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 login attempts per IP per 15 min
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.ip === '::1' || req.ip === '127.0.0.1';
    },
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max 3 registrations per IP per hour
    message: "Trop d'inscriptions depuis votre IP. Réessayez dans 1 heure.",
    standardHeaders: true,
    legacyHeaders: false,
});

export const mediaUploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Max 10 uploads per IP per minute
    message: "Trop d'uploads. Attendez 1 minute avant de réessayer.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.ip === '::1' || req.ip === '127.0.0.1';
    },
});

const getBearerToken = (authorizationHeader: string | undefined) => {
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return null;
    }

    return authorizationHeader.slice(7).trim();
};

export const requireAuth: RequestHandler = (req, res, next) => {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
        return res.status(401).json({ message: 'Token manquant ou invalide' });
    }

    try {
        const payload = verifyToken(token);
        (req as AuthenticatedRequest).auth = payload;
        return next();
    } catch (error) {
        return res.status(401).json({ message: error instanceof Error ? error.message : 'Token invalide' });
    }
};

export const isAdmin: RequestHandler = (req, res, next) => {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
        return res.status(401).json({ message: 'Token manquant ou invalide' });
    }

    try {
        const payload = verifyToken(token);
        (req as AuthenticatedRequest).auth = payload;

        if (payload.role !== 'admin') {
            return res.status(403).json({ message: 'Acces reserve aux administrateurs' });
        }

        return next();
    } catch (error) {
        return res.status(401).json({ message: error instanceof Error ? error.message : 'Token invalide' });
    }
};
