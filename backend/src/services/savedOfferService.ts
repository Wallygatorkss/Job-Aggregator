import { prisma } from "../utils/prisma.js";

export const listSavedOffersForUser = async (userId: number) =>
  prisma.savedOffer.findMany({
    where: { user_id: userId },
    orderBy: { saved_at: "desc" },
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          small_company: {
            select: {
              company_name: true,
            },
          },
          formatted_places: {
            select: {
              place: true,
            },
            take: 1,
          },
        },
      },
    },
  });

export const createSavedOffer = async (userId: number, offerId: string) =>
  prisma.savedOffer.create({ data: { user_id: userId, offer_id: offerId } });

export const deleteSavedOffer = async (userId: number, offerId: string) =>
  prisma.savedOffer.deleteMany({ where: { user_id: userId, offer_id: offerId } });
