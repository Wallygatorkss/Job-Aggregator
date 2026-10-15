import { prisma } from "../utils/prisma.js";

type CreateApplicationInput = {
  offerId: string;
  offerTitle: string;
  companyName: string;
  location: string;
  firstName: string;
  lastName: string;
  cvUrl: string;
  linkedinUrl?: string;
  userId?: number | null;
};

export const createApplication = async (input: CreateApplicationInput) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.application.findFirst({
      where: {
        offer_id: input.offerId,
        cv_url: input.cvUrl,
        first_name: input.firstName,
        last_name: input.lastName,
      },
    });

    if (existing) {
      throw new Error("DUPLICATE_APPLICATION");
    }

    return tx.application.create({
      data: {
        offer_id: input.offerId,
        offer_title: input.offerTitle,
        company_name: input.companyName,
        location: input.location,
        first_name: input.firstName,
        last_name: input.lastName,
        cv_url: input.cvUrl,
        linkedin_url: input.linkedinUrl ?? null,
        user_id: input.userId ?? null,
      } as any,
    });
  });

export const listApplications = async () =>
  prisma.application.findMany({
    orderBy: { created_at: "desc" },
  });

export const listApplicationsForUser = async (userId: number) =>
  prisma.application.findMany({ where: { user_id: userId } as any, orderBy: { created_at: "desc" } });
