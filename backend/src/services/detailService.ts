import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const detailSelect = {
    id: true,
    title: true,
    description: true,
    description_preview: true,
    raw_description: true,
    status: true,
    published_at: true,
    source_reference: true,
    source_type: true,
    source_created_at: true,
    source_last_update_at: true,
    details: {
        select: {
            accept_remote: true,
            contract_permanent: true,
            currency: true,
            locale: true,
            required_experience: true,
            required_experience_pro: true,
            start: true,
            salary_min: true,
            salary_max: true,
            salary_currency: true,
            salary_recurrence: true,
            salary_max_per_year: true,
            remote_policy_frequency: true,
            remote_policy_days_per_week: true,
        },
    },
    contract_types: {
        select: { contract_type: true },
    },
    skills: {
        select: { skill_name: true },
    },
    tags: {
        select: { tag: true },
    },
    small_company: {
        select: {
            company_name: true,
            fallback_gallery_url: true,
            company_type_explicit: true,
            handle: true,
        },
    },
    formatted_places: {
        select: { place: true, position: true },
        orderBy: { position: 'asc' as const },
    },
};

const normalizeDetail = (offer: {
    id: string;
    title: string;
    description: string;
    description_preview: string | null;
    raw_description: string | null;
    status: string | null;
    published_at: Date;
    source_reference: string | null;
    source_type: string | null;
    source_created_at: Date | null;
    source_last_update_at: Date | null;
    details: {
        accept_remote: string | null;
        contract_permanent: boolean | null;
        currency: string | null;
        locale: string | null;
        required_experience: unknown;
        required_experience_pro: unknown;
        start: string | null;
        salary_min: number | null;
        salary_max: number | null;
        salary_currency: string | null;
        salary_recurrence: string | null;
        salary_max_per_year: number | null;
        remote_policy_frequency: string | null;
        remote_policy_days_per_week: number | null;
    } | null;
    contract_types: { contract_type: string }[];
    skills: { skill_name: string }[];
    tags: { tag: string }[];
    small_company: {
        company_name: string | null;
        fallback_gallery_url: string | null;
        company_type_explicit: string | null;
        handle: string | null;
    } | null;
    formatted_places: { place: string; position: number }[];
}) => {
    const primaryPlace = offer.formatted_places[0]?.place ?? 'Non précisé';
    const details = offer.details ?? null;

    return {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        description_preview: offer.description_preview,
        raw_description: offer.raw_description,
        status: offer.status,
        published_at: offer.published_at,
        source_type: offer.source_type,
        source_created_at: offer.source_created_at,
        source_last_update_at: offer.source_last_update_at,
        location: primaryPlace,
        original_url: offer.source_reference,
        contract_type: offer.contract_types[0]?.contract_type ?? null,
        contract_types: offer.contract_types.map((item) => item.contract_type),
        skills: offer.skills.map((item) => item.skill_name),
        tags: offer.tags.map((item) => item.tag),
        company_name: offer.small_company?.company_name ?? 'Entreprise',
        company_logo_url: offer.small_company?.fallback_gallery_url ?? null,
        company_website_url: offer.small_company?.handle
            ? `https://${offer.small_company.handle}`
            : null,
        company_type: offer.small_company?.company_type_explicit ?? null,
        details,
        salary_min: details?.salary_min ?? null,
        salary_max: details?.salary_max ?? null,
        salary_currency: details?.salary_currency ?? null,
        salary_recurrence: details?.salary_recurrence ?? null,
        salary_max_per_year: details?.salary_max_per_year ?? null,
        remote_policy_frequency: details?.remote_policy_frequency ?? null,
        remote_policy_days_per_week: details?.remote_policy_days_per_week ?? null,
        accept_remote: details?.accept_remote ?? null,
        start: details?.start ?? null,
        locale: details?.locale ?? null,
        required_experience: details?.required_experience ?? null,
        required_experience_pro: details?.required_experience_pro ?? null,
    };
};

export const getDetails = async () => {
    const offers = await prisma.offer.findMany({
        select: detailSelect,
    });
    return offers.map(normalizeDetail);
};

export const getDetailById = async (id: string) => {
    const offer = await prisma.offer.findUnique({
        where: { id },
        select: detailSelect,
    });
    if (!offer) {
        return null;
    }
    return normalizeDetail(offer);
};