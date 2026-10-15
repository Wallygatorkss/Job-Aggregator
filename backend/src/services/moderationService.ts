import { prisma } from '../utils/prisma.js';

export interface UpdateJobInput {
    title?: string;
    description?: string;
    description_preview?: string | null;
    raw_description?: string | null;
    helmet_handle?: string | null;
    seo_alias?: string | null;
    status?: string | null;
    application_30_days?: boolean | null;
    ranking?: bigint | null;
    premium_bool?: boolean | null;
    premium_int?: bigint | null;
}

export const deleteJob = async (id: string) => {
    return prisma.offer.delete({
        where: { id }
    });
};

export const updateJob = async (id: string, updates: UpdateJobInput) => {
    return prisma.offer.update({
        where: { id },
        data: updates
    });
};

export const banUser = async (id: number) => {
    return prisma.user.update({
        where: { id },
        data: { is_active: false },
        select: {
            id: true,
            email: true,
            role: true,
            is_active: true
        }
    });
};
