import argon2 from 'argon2';
import { generateToken, type UserRole } from '../utils/jwt.js';
import { prisma } from '../utils/prisma.js';

const MAX_IMAGE_BYTES = 1_500_000;
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|webp|gif));base64,([a-z0-9+/=\s]+)$/i;

type ProfileMediaPatch = {
    avatar_url?: string | null;
    banner_url?: string | null;
};

const publicUserSelect = {
    id: true,
    email: true,
    username: true,
    role: true,
    is_active: true,
    professional_status: true,
    avatar_url: true,
    banner_url: true,
    phone: true,
    language: true,
    bio: true,
    interests: true,
    formations: true,
    website: true,
    location: true,
    created_at: true,
    updated_at: true,
    contract_preferences: { select: { contract_type: true } },
    location_preferences: { select: { location: true } },
} as const;

const normalizeImageDataUrl = (value: string, fieldName: string) => {
    const trimmedValue = value.trim();
    const match = DATA_URL_PATTERN.exec(trimmedValue);

    if (!match) {
        throw new Error(`${fieldName} invalide`);
    }

    const mimeType = match[1].toLowerCase();

    if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
        throw new Error(`${fieldName} invalide`);
    }

    const normalizedBase64 = match[2].replace(/\s+/g, '');
    const rawSize = Buffer.byteLength(normalizedBase64, 'base64');

    if (!Number.isFinite(rawSize) || rawSize <= 0 || rawSize > MAX_IMAGE_BYTES) {
        throw new Error(`${fieldName} trop volumineux`);
    }

    return `data:${mimeType};base64,${normalizedBase64}`;
};

const assertValidRole = (role: string): UserRole => {
    if (role === 'user' || role === 'admin') {
        return role;
    }

    throw new Error('Role utilisateur invalide');
};

export const authenticate = async (email: string, password_plain: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw new Error("Identifiants incorrects");
    if (!user.is_active) throw new Error('Ce compte a ete banni. Contactez un administrateur.');

    const isPasswordValid = await argon2.verify(user.password_hash, password_plain);
    if (!isPasswordValid) throw new Error("Identifiants incorrects");

    const role = assertValidRole(user.role);
    const token = generateToken({ userId: user.id, role });

    return { token, user: { email: user.email, role } };
};

export const register = async (email: string, password_plain: string) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) throw new Error("Cet email est déjà utilisé");

    const password_hash = await argon2.hash(password_plain);
    const baseUsername = email.split('@')[0];

    let username = baseUsername;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
        username = `${baseUsername}_${Math.random().toString(36).slice(2, 6)}`;
    }
    const newUser = await prisma.user.create({
        data: {
            email,
            password_hash,
            username,
            role: 'user'
        }
    });

    const role = assertValidRole(newUser.role);
    const token = generateToken({ userId: newUser.id, role });

    return { token, user: { email: newUser.email, role } };
};

export const getCurrentUser = async (userId: number) => {
    return prisma.user.findUnique({
        where: { id: userId },
        select: publicUserSelect,
    });
};

export const updateProfileMedia = async (userId: number, mediaPatch: ProfileMediaPatch) => {
    const data: ProfileMediaPatch = {};

    if (mediaPatch.avatar_url !== undefined) {
        data.avatar_url = mediaPatch.avatar_url === null ? null : normalizeImageDataUrl(mediaPatch.avatar_url, 'Photo de profil');
    }

    if (mediaPatch.banner_url !== undefined) {
        data.banner_url = mediaPatch.banner_url === null ? null : normalizeImageDataUrl(mediaPatch.banner_url, 'Bannière');
    }

    if (Object.keys(data).length === 0) {
        throw new Error('Aucune image à mettre à jour');
    }

    return prisma.user.update({
        where: { id: userId },
        data,
        select: publicUserSelect,
    });
};

type ProfilePatch = {
    username?: string;
    email?: string;
    professional_status?: string;
    phone?: string | null;
    language?: string | null;
    bio?: string | null;
    interests?: string[] | null;
    formations?: Array<{ diplome?: string | null; ecole?: string | null; dates?: string | null }> | null;
    website?: string | null;
    contractTypes?: string[] | undefined;
    locations?: string[] | undefined;
    location?: string | null;
};

const sanitizeOptionalString = (
    value: string | null | undefined,
    fieldName: string,
    maxLength: number,
): string | null => {
    if (value === null) return null;
    if (typeof value !== 'string') {
        throw new Error(`${fieldName} invalide`);
    }
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.length > maxLength) {
        throw new Error(`${fieldName} trop long (max ${maxLength} caractères)`);
    }
    return trimmed;
};

const validatePhone = (value: string | null | undefined): string | null => {
    const trimmed = sanitizeOptionalString(value, 'Numéro de téléphone', 32);
    if (trimmed === null) return null;
    if (!/^[+\d][\d\s().-]{5,}$/.test(trimmed)) {
        throw new Error('Numéro de téléphone invalide');
    }
    return trimmed;
};

const validateWebsite = (value: string | null | undefined): string | null => {
    const trimmed = sanitizeOptionalString(value, 'Lien', 512);
    if (trimmed === null) return null;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        new URL(withProtocol);
    } catch (e) {
        throw new Error('Lien invalide', { cause: e });
    }
    return withProtocol;
};

const ALLOWED_LANGUAGES = new Set(['fr', 'en', 'es', 'de', 'it', 'pt']);

const validateLanguage = (value: string | null | undefined): string | null => {
    const trimmed = sanitizeOptionalString(value, 'Langue', 16);
    if (trimmed === null) return null;
    const lower = trimmed.toLowerCase();
    if (!ALLOWED_LANGUAGES.has(lower)) {
        throw new Error('Langue non prise en charge');
    }
    return lower;
};

const sanitizeInterests = (value: string[] | null): string[] | null => {
    if (value === null) return null;
    if (!Array.isArray(value)) {
        throw new Error('Centres d\'intérêt invalides');
    }
    const normalized = Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)))
        .slice(0, 12);
    for (const interest of normalized) {
        if (interest.length > 64) {
            throw new Error('Centre d\'intérêt trop long');
        }
    }
    return normalized.length > 0 ? normalized : null;
};

type FormationInput = { diplome?: string | null; ecole?: string | null; dates?: string | null };

const sanitizeFormations = (value: FormationInput[] | null): FormationInput[] | null => {
    if (value === null) return null;
    if (!Array.isArray(value)) {
        throw new Error('Formations invalides');
    }

    const sanitized: FormationInput[] = [];
    for (const entry of value.slice(0, 8)) {
        if (!entry || typeof entry !== 'object') {
            continue;
        }
        const diplome = sanitizeOptionalString(entry.diplome ?? null, 'Diplôme', 120);
        const ecole = sanitizeOptionalString(entry.ecole ?? null, 'École', 120);
        const dates = sanitizeOptionalString(entry.dates ?? null, 'Dates', 64);

        if (!diplome && !ecole && !dates) {
            continue;
        }

        sanitized.push({
            diplome: diplome ?? undefined,
            ecole: ecole ?? undefined,
            dates: dates ?? undefined,
        });
    }

    return sanitized.length > 0 ? sanitized : null;
};

const validateEmail = (email: string): string => {
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(trimmed)) {
        throw new Error('Email invalide');
    }
    
    return trimmed;
};

const validateUsername = (username: string): string => {
    const trimmed = username.trim();
    
    if (trimmed.length < 3) {
        throw new Error('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    }
    
    if (trimmed.length > 30) {
        throw new Error('Le nom d\'utilisateur ne peut pas dépasser 30 caractères');
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        throw new Error('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
    }
    
    return trimmed;
};

const validateProfessionalStatus = (status: string): string => {
    const validStatuses = ['looking_for_work', 'employed'];
    const trimmed = status.trim().toLowerCase();
    
    if (!validStatuses.includes(trimmed)) {
        throw new Error('Statut professionnel invalide');
    }
    
    return trimmed;
};

export const updateProfile = async (userId: number, profilePatch: ProfilePatch) => {
    const data: ProfilePatch = {};
    
    if (profilePatch.username !== undefined) {
        const validatedUsername = validateUsername(profilePatch.username);
        
        const existingUser = await prisma.user.findUnique({
            where: { username: validatedUsername }
        });
        
        if (existingUser && existingUser.id !== userId) {
            throw new Error('Ce nom d\'utilisateur est déjà utilisé');
        }
        
        data.username = validatedUsername;
    }
    
    if (profilePatch.email !== undefined) {
        const validatedEmail = validateEmail(profilePatch.email);
        
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedEmail }
        });
        
        if (existingUser && existingUser.id !== userId) {
            throw new Error('Cet email est déjà utilisé');
        }
        
        data.email = validatedEmail;
    }

    if (profilePatch.professional_status !== undefined) {
        const validatedStatus = validateProfessionalStatus(profilePatch.professional_status);
        data.professional_status = validatedStatus;
    }

    if (profilePatch.phone !== undefined) {
        data.phone = validatePhone(profilePatch.phone);
    }

    if (profilePatch.language !== undefined) {
        data.language = validateLanguage(profilePatch.language);
    }

    if (profilePatch.bio !== undefined) {
        data.bio = sanitizeOptionalString(profilePatch.bio, 'Description', 1000);
    }

    if (profilePatch.interests !== undefined) {
        data.interests = sanitizeInterests(profilePatch.interests);
    }

    if (profilePatch.formations !== undefined) {
        data.formations = sanitizeFormations(profilePatch.formations);
    }

    if (profilePatch.website !== undefined) {
        data.website = validateWebsite(profilePatch.website);
    }

    if (profilePatch.location !== undefined) {
        data.location = sanitizeOptionalString(profilePatch.location, 'Localisation', 255);
    }

    const contractTypes = profilePatch.contractTypes;
    const locations = profilePatch.locations;

    if (Object.keys(data).length === 0) {
        if (!contractTypes && !locations) {
            throw new Error('Aucune modification à appliquer');
        }
    }

    return prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({ where: { id: userId }, data, select: publicUserSelect });

        if (Array.isArray(contractTypes)) {
            const normalized = Array.from(new Set(contractTypes.map((c) => String(c).trim()).filter(Boolean)));
            const t = tx as any;
            await t.userContractPreference.deleteMany({ where: { user_id: userId } });
            if (normalized.length > 0) {
                const data = normalized.map((ct) => ({ user_id: userId, contract_type: ct }));
                if (typeof t.userContractPreference.createMany === 'function') {
                    try {
                        await t.userContractPreference.createMany({ data });
                    } catch (err) {
                        for (const d of data) {
                            try {
                                await t.userContractPreference.create({ data: d });
                            } catch (error) {
                                console.warn('Impossible de sauvegarder une préférence de contrat', error);
                            }
                        }
                    }
                } else {
                    for (const d of data) {
                        try {
                            await t.userContractPreference.create({ data: d });
                        } catch (error) {
                            console.warn('Impossible de sauvegarder une préférence de contrat', error);
                        }
                    }
                }
            }
        }

        if (Array.isArray(locations)) {
            const normalized = Array.from(new Set(locations.map((l) => String(l).trim()).filter(Boolean)));
            const t = tx as any;
            await t.userLocationPreference.deleteMany({ where: { user_id: userId } });
            if (normalized.length > 0) {
                const data = normalized.map((loc) => ({ user_id: userId, location: loc }));
                if (typeof t.userLocationPreference.createMany === 'function') {
                    try {
                        await t.userLocationPreference.createMany({ data });
                    } catch (err) {
                        for (const d of data) {
                            try {
                                await t.userLocationPreference.create({ data: d });
                            } catch (error) {
                                console.warn('Impossible de sauvegarder une préférence de localisation', error);
                            }
                        }
                    }
                } else {
                    for (const d of data) {
                        try {
                            await t.userLocationPreference.create({ data: d });
                        } catch (error) {
                            console.warn('Impossible de sauvegarder une préférence de localisation', error);
                        }
                    }
                }
            }
        }

        return tx.user.findUnique({ where: { id: userId }, select: publicUserSelect });
    });
};

export const changePassword = async (userId: number, currentPassword: string, newPassword: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Utilisateur introuvable');

    const isValid = await argon2.verify(user.password_hash, currentPassword);
    if (!isValid) throw new Error('Mot de passe actuel incorrect');

    if (newPassword.length < 8) throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères');

    const password_hash = await argon2.hash(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password_hash } });
};
