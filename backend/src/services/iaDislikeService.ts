import { prisma } from '../utils/prisma.js';

export const createIaDislike = async (userId: number, offerId: string) =>
  prisma.iaDislike.create({ data: { user_id: userId, offer_id: offerId } });

export const deleteIaDislike = async (userId: number, offerId: string) =>
  prisma.iaDislike.deleteMany({ where: { user_id: userId, offer_id: offerId } });

export const listIaDislikesForUser = async (userId: number) =>
  prisma.iaDislike.findMany({ where: { user_id: userId }, select: { offer_id: true } });
