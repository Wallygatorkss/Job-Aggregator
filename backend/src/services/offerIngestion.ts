import { prisma, Prisma } from "../utils/prisma.js";

const SOURCE = "welovedevs";

export type ApiJob = {
    id: string;
    title?: string;
    descriptionPreview?: string;
    createdAt?: number;
    lastUpdate?: number;
    publishDate?: number;
    premium?: string | null;
    contractTypes?: string[];
    skillsList?: { name: string; value?: number }[];
    status?: string;
    companyId?: string;
    creatorId?: string;
    helmetHandle?: string;
    seoAlias?: string;
    application30Days?: boolean;
    reference?: string;
    ranking?: number;
    objectID?: string;
    type?: string;
    details?: {
        acceptRemote?: string;
        contracts?: { permanent?: boolean };
        currency?: string;
        locale?: string;
        professionId?: string;
        requiredExperience?: Prisma.InputJsonValue;
        requiredExperiencePro?: Prisma.InputJsonValue;
        start?: string;
        remotePolicy?: { frequency?: string; daysPerWeek?: number };
        salary?: {
            currency?: string;
            max?: number;
            min?: number;
            recurrence?: string;
            maxPerYear?: number;
        };
        places?: Prisma.InputJsonValue;
    };
    smallCompany?: {
        companyName?: string;
        handle?: string;
        id?: string;
        seoAlias?: string;
        gallery?: { handle?: string };
        companyType?: number;
        companyTypeExplicit?: string;
        sectors?: string[];
        fallbackGalleryUrl?: string;
    };
    profession?: {
        algoliaKeyword?: string;
        langContent?: Prisma.InputJsonValue;
    };
    _geoloc?: { lat?: number; lng?: number }[];
    formattedPlaces?: string[];
    analytics?: {
        applications?: number;
        applyBtnClicks?: number;
        atsApplications?: number;
        cta?: number;
        ctr?: number;
        remoteApplications?: number;
        totalApplications?: number;
        updatedAt?: number;
        visitsCount?: number;
    };
};

export const toEpochMs = (value?: number | string | null): number | null => {
    if (value === null || value === undefined) return null;
    const numeric = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numeric)) return null;
    if (numeric > 1e14) return Math.trunc(numeric / 1000);
    if (numeric > 1e11) return Math.trunc(numeric);
    return Math.trunc(numeric * 1000);
};

export const toDate = (value?: number | string | null): Date | null => {
    const epochMs = toEpochMs(value);
    return epochMs ? new Date(epochMs) : null;
};

export const toBigInt = (value?: number | string | null): bigint | null => {
    if (value === null || value === undefined) return null;
    const numeric = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numeric)) return null;
    return BigInt(Math.trunc(numeric));
};

export const toInt = (value?: number | null): number | null => {
    if (value === null || value === undefined) return null;
    if (!Number.isFinite(value)) return null;
    return Math.trunc(value);
};

export const upsertOfferFromApi = async (job: ApiJob) => {
    return prisma.$transaction(async (tx) => {
        const publishedAt = toDate(job.publishDate) ?? new Date();
        const sourceCreatedAt = toDate(job.createdAt);
        const sourceLastUpdateAt = toDate(job.lastUpdate);
        const ranking = toBigInt(job.ranking);
        const premiumBool = Boolean(job.premium);

        const offer = await tx.offer.upsert({
            where: {
                external_id_source: {
                    external_id: job.id,
                    source: SOURCE
                }
            },
            update: {
                source_object_id: job.objectID ?? null,
                source_reference: job.reference ?? null,
                source_type: job.type ?? null,
                source_created_at: sourceCreatedAt,
                source_last_update_at: sourceLastUpdateAt,
                creator_id: job.creatorId ?? null,
                company_id: job.companyId ?? null,
                title: job.title ?? "",
                description: job.descriptionPreview ?? job.title ?? "",
                description_preview: job.descriptionPreview ?? null,
                helmet_handle: job.helmetHandle ?? null,
                seo_alias: job.seoAlias ?? null,
                status: job.status ?? null,
                application_30_days: job.application30Days ?? null,
                ranking,
                premium_bool: premiumBool,
                premium_int: null,
                published_at: publishedAt,
                source_payload: job as Prisma.InputJsonValue
            },
            create: {
                external_id: job.id,
                source: SOURCE,
                source_object_id: job.objectID ?? null,
                source_reference: job.reference ?? null,
                source_type: job.type ?? null,
                source_created_at: sourceCreatedAt,
                source_last_update_at: sourceLastUpdateAt,
                creator_id: job.creatorId ?? null,
                company_id: job.companyId ?? null,
                title: job.title ?? "",
                description: job.descriptionPreview ?? job.title ?? "",
                description_preview: job.descriptionPreview ?? null,
                helmet_handle: job.helmetHandle ?? null,
                seo_alias: job.seoAlias ?? null,
                status: job.status ?? null,
                application_30_days: job.application30Days ?? null,
                ranking,
                premium_bool: premiumBool,
                premium_int: null,
                published_at: publishedAt,
                source_payload: job as Prisma.InputJsonValue
            }
        });

        if (job.details) {
            const salary = job.details.salary ?? {};
            const remotePolicy = job.details.remotePolicy ?? {};
            await tx.offerDetails.upsert({
                where: { offer_id: offer.id },
                update: {
                    accept_remote: job.details.acceptRemote ?? null,
                    contract_permanent: job.details.contracts?.permanent ?? null,
                    currency: job.details.currency ?? null,
                    locale: job.details.locale ?? null,
                    profession_id: job.details.professionId ?? null,
                    required_experience: job.details.requiredExperience ?? Prisma.DbNull,
                    required_experience_pro: job.details.requiredExperiencePro ?? Prisma.DbNull,
                    start: job.details.start ?? null,
                    salary_min: toInt(salary.min),
                    salary_max: toInt(salary.max),
                    salary_currency: salary.currency ?? null,
                    salary_recurrence: salary.recurrence ?? null,
                    salary_max_per_year: toInt(salary.maxPerYear),
                    remote_policy_frequency: remotePolicy.frequency ?? null,
                    remote_policy_days_per_week: toInt(remotePolicy.daysPerWeek ?? null),
                    places: job.details.places ?? Prisma.DbNull
                },
                create: {
                    offer_id: offer.id,
                    accept_remote: job.details.acceptRemote ?? null,
                    contract_permanent: job.details.contracts?.permanent ?? null,
                    currency: job.details.currency ?? null,
                    locale: job.details.locale ?? null,
                    profession_id: job.details.professionId ?? null,
                    required_experience: job.details.requiredExperience ?? Prisma.DbNull,
                    required_experience_pro: job.details.requiredExperiencePro ?? Prisma.DbNull,
                    start: job.details.start ?? null,
                    salary_min: toInt(salary.min),
                    salary_max: toInt(salary.max),
                    salary_currency: salary.currency ?? null,
                    salary_recurrence: salary.recurrence ?? null,
                    salary_max_per_year: toInt(salary.maxPerYear),
                    remote_policy_frequency: remotePolicy.frequency ?? null,
                    remote_policy_days_per_week: toInt(remotePolicy.daysPerWeek ?? null),
                    places: job.details.places ?? Prisma.DbNull
                }
            });
        }

        if (job.analytics) {
            const updatedAtEpoch = toBigInt(toEpochMs(job.analytics.updatedAt));
            await tx.offerAnalytic.upsert({
                where: { offer_id: offer.id },
                update: {
                    applications: toBigInt(job.analytics.applications),
                    apply_btn_clicks: toBigInt(job.analytics.applyBtnClicks),
                    ats_applications: toBigInt(job.analytics.atsApplications),
                    cta: job.analytics.cta ?? null,
                    ctr: job.analytics.ctr ?? null,
                    remote_applications: toBigInt(job.analytics.remoteApplications),
                    total_applications: toBigInt(job.analytics.totalApplications),
                    visits_count: toBigInt(job.analytics.visitsCount),
                    updated_at_epoch: updatedAtEpoch
                },
                create: {
                    offer_id: offer.id,
                    applications: toBigInt(job.analytics.applications),
                    apply_btn_clicks: toBigInt(job.analytics.applyBtnClicks),
                    ats_applications: toBigInt(job.analytics.atsApplications),
                    cta: job.analytics.cta ?? null,
                    ctr: job.analytics.ctr ?? null,
                    remote_applications: toBigInt(job.analytics.remoteApplications),
                    total_applications: toBigInt(job.analytics.totalApplications),
                    visits_count: toBigInt(job.analytics.visitsCount),
                    updated_at_epoch: updatedAtEpoch
                }
            });
        }

        if (job.smallCompany) {
            await tx.offerSmallCompany.upsert({
                where: { offer_id: offer.id },
                update: {
                    company_name: job.smallCompany.companyName ?? null,
                    handle: job.smallCompany.handle ?? null,
                    external_id: job.smallCompany.id ?? null,
                    seo_alias: job.smallCompany.seoAlias ?? null,
                    gallery_handle: job.smallCompany.gallery?.handle ?? null,
                    company_type: toBigInt(job.smallCompany.companyType),
                    company_type_explicit: job.smallCompany.companyTypeExplicit ?? null,
                    fallback_gallery_url: job.smallCompany.fallbackGalleryUrl ?? null
                },
                create: {
                    offer_id: offer.id,
                    company_name: job.smallCompany.companyName ?? null,
                    handle: job.smallCompany.handle ?? null,
                    external_id: job.smallCompany.id ?? null,
                    seo_alias: job.smallCompany.seoAlias ?? null,
                    gallery_handle: job.smallCompany.gallery?.handle ?? null,
                    company_type: toBigInt(job.smallCompany.companyType),
                    company_type_explicit: job.smallCompany.companyTypeExplicit ?? null,
                    fallback_gallery_url: job.smallCompany.fallbackGalleryUrl ?? null
                }
            });

            await tx.offerSmallCompanySector.deleteMany({ where: { offer_id: offer.id } });
            if (job.smallCompany.sectors && job.smallCompany.sectors.length > 0) {
                await tx.offerSmallCompanySector.createMany({
                    data: job.smallCompany.sectors.map((sector) => ({
                        offer_id: offer.id,
                        sector
                    })),
                    skipDuplicates: true
                });
            }
        }

        if (job.profession) {
            await tx.offerProfession.upsert({
                where: { offer_id: offer.id },
                update: {
                    algolia_keyword: job.profession.algoliaKeyword ?? null,
                    lang_content: job.profession.langContent ?? Prisma.DbNull
                },
                create: {
                    offer_id: offer.id,
                    algolia_keyword: job.profession.algoliaKeyword ?? null,
                    lang_content: job.profession.langContent ?? Prisma.DbNull
                }
            });
        }

        if (job.contractTypes) {
            await tx.offerContractType.deleteMany({ where: { offer_id: offer.id } });
            if (job.contractTypes.length > 0) {
                await tx.offerContractType.createMany({
                    data: job.contractTypes.map((contract_type) => ({
                        offer_id: offer.id,
                        contract_type
                    })),
                    skipDuplicates: true
                });
            }
        }

        if (job.skillsList) {
            await tx.offerSkill.deleteMany({ where: { offer_id: offer.id } });
            if (job.skillsList.length > 0) {
                await tx.offerSkill.createMany({
                    data: job.skillsList.map((skill) => ({
                        offer_id: offer.id,
                        skill_name: skill.name,
                        skill_value: skill.value ?? null
                    })),
                    skipDuplicates: true
                });
            }
        }

        if (job._geoloc) {
            await tx.offerGeoloc.deleteMany({ where: { offer_id: offer.id } });
            if (job._geoloc.length > 0) {
                await tx.offerGeoloc.createMany({
                    data: job._geoloc.map((geo, index) => ({
                        offer_id: offer.id,
                        position: index,
                        lat: geo.lat ?? null,
                        lng: geo.lng ?? null
                    })),
                    skipDuplicates: true
                });
            }
        }

        if (job.formattedPlaces) {
            await tx.offerFormattedPlace.deleteMany({ where: { offer_id: offer.id } });
            if (job.formattedPlaces.length > 0) {
                await tx.offerFormattedPlace.createMany({
                    data: job.formattedPlaces.map((place, index) => ({
                        offer_id: offer.id,
                        position: index,
                        place
                    })),
                    skipDuplicates: true
                });
            }
        }

        return offer;
    });
};
