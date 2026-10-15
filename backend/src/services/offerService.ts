import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type OfferFilters = {
  q?: string;
  location?: string;
  locations?: string[];
  contractTypes?: string[];
  salaryMin?: number;
  salaryMax?: number;
  experience?: string;
  sort?: string;
};

export const getAvailableCities = async (): Promise<string[]> => {
  const results = await prisma.offerFormattedPlace.groupBy({
    by: ['place'],
    _count: { place: true },
    orderBy: { _count: { place: 'desc' } },
  });
  return results.map((r) => r.place).filter(Boolean);
};

export const getOffers = async (cursor?: string, limit = 8, filters?: OfferFilters, options?: { includeSkills?: boolean }) => {
  const where: any = {};
  if (filters) {
    const { q, location, salaryMin, salaryMax, experience, sort } = filters;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { small_company: { company_name: { contains: q } } },
        { contract_types: { some: { contract_type: { contains: q } } } },
        { tags: { some: { tag: { contains: q } } } },
        { skills: { some: { skill_name: { contains: q } } } },
        { ai_data: { keywords: { contains: q } } },
        { profession: { algolia_keyword: { contains: q } } },
      ];
    }
    if (location) {
      where.formatted_places = { some: { place: { contains: location } } };
    }

    if (filters.locations && filters.locations.length) {
      where.AND = where.AND ?? [];
      where.AND.push({
        OR: filters.locations.map((l: string) => ({ formatted_places: { some: { place: { contains: l } } } })),
      });
    }

    if (filters.contractTypes && filters.contractTypes.length) {
      where.AND = where.AND ?? [];
      where.AND.push({
        OR: filters.contractTypes.map((ct: string) => ({
          contract_types: { some: { contract_type: { contains: ct } } },
        })),
      });
    }
    if (salaryMin != null || salaryMax != null) {
      where.details = {};
      if (salaryMin != null) where.details.salary_min = { gte: salaryMin };
      if (salaryMax != null) where.details.salary_max = { lte: salaryMax };
    }

    if (experience) {
      where.AND = where.AND ?? [];
      where.AND.push({
        OR: [
          { title: { contains: experience } },
          { description: { contains: experience } },
          { skills: { some: { skill_name: { contains: experience } } } },
          { profession: { algolia_keyword: { contains: experience } } },
        ],
      });
    }
  }

  const offers = await prisma.offer.findMany({
    where,
    take: limit,
    ...(cursor
      ? {
          skip: 1,
          cursor: {
            id: cursor,
          },
        }
      : {}),

    orderBy: {
      published_at: "desc",
    },

    select: {
      id: true,
      title: true,
      published_at: true,

      small_company: {
        select: {
          company_name: true,
          fallback_gallery_url: true,
        },
      },

      details: {
        select: {
          salary_min: true,
          salary_max: true,
          salary_currency: true,
        },
      },

      formatted_places: {
        select: {
          place: true,
        },
      },

      contract_types: {
        select: {
          contract_type: true,
        },
      },
      ...(options?.includeSkills ? {
        skills: { select: { skill_name: true } },
      } : {}),
    },
  });

  const nextCursor = offers.length === limit ? offers[offers.length - 1].id : null;

  const total = await prisma.offer.count({ where });

  return {
    offers,
    nextCursor,
    total,
  };
};

export const deleteOffer = async (id: string): Promise<void> => {
  await prisma.offer.delete({ where: { id } });
};

export const updateOffer = async (id: string, patch: {
  title?: string;
  description_preview?: string;
  company_name?: string;
  contract_type?: string;
  place?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  accept_remote?: string;
}) => {
  const updates: Promise<unknown>[] = [];

  const offerData: Record<string, unknown> = {};
  if (patch.title !== undefined) offerData.title = patch.title;
  if (patch.description_preview !== undefined) offerData.description_preview = patch.description_preview;
  if (Object.keys(offerData).length > 0) {
    updates.push(prisma.offer.update({ where: { id }, data: offerData }));
  }

  if (patch.company_name !== undefined) {
    updates.push(prisma.offerSmallCompany.updateMany({
      where: { offer_id: id },
      data: { company_name: patch.company_name },
    }));
  }

  if (patch.contract_type !== undefined) {
    updates.push(prisma.offerContractType.updateMany({
      where: { offer_id: id },
      data: { contract_type: patch.contract_type },
    }));
  }

  if (patch.place !== undefined) {
    updates.push(prisma.offerFormattedPlace.updateMany({
      where: { offer_id: id, position: 0 },
      data: { place: patch.place },
    }));
  }

  const detailData: Record<string, unknown> = {};
  if (patch.salary_min !== undefined) detailData.salary_min = patch.salary_min;
  if (patch.salary_max !== undefined) detailData.salary_max = patch.salary_max;
  if (patch.accept_remote !== undefined) detailData.accept_remote = patch.accept_remote;
  if (Object.keys(detailData).length > 0) {
    updates.push(prisma.offerDetails.upsert({
      where: { offer_id: id },
      update: detailData,
      create: { offer_id: id, ...detailData },
    }));
  }

  await Promise.all(updates);
};
