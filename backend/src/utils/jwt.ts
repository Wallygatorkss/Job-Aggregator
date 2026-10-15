import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'ta_cle_secrete';

export type UserRole = 'user' | 'admin';

export interface AuthTokenPayload extends jwt.JwtPayload {
    userId: number;
    role: UserRole;
}

export const generateToken = (payload: Pick<AuthTokenPayload, 'userId' | 'role'>) => {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
};

export const verifyToken = (token: string): AuthTokenPayload => {
    const decoded = jwt.verify(token, getJwtSecret());

    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid token payload');
    }

    const payload = decoded as jwt.JwtPayload & { userId?: unknown; role?: unknown };

    if (
        typeof payload.userId !== 'number' ||
        !Number.isInteger(payload.userId) ||
        payload.userId <= 0 ||
        (payload.role !== 'user' && payload.role !== 'admin')
    ) {
        throw new Error('Invalid token payload');
    }

    return payload as AuthTokenPayload;
};
