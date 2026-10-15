import { prisma } from '../utils/prisma.js';

export const getCharts = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [savedRaw, applicationsRaw, contractRaw, citiesRaw, publishedRaw, usersRaw] = await Promise.all([
    prisma.savedOffer.findMany({
      where: { saved_at: { gte: thirtyDaysAgo } },
      select: { saved_at: true },
    }),
    prisma.application.findMany({
      where: { created_at: { gte: thirtyDaysAgo } },
      select: { created_at: true },
    }),
    prisma.offerContractType.groupBy({
      by: ['contract_type'],
      _count: { contract_type: true },
      orderBy: { _count: { contract_type: 'desc' } },
      take: 8,
    }),
    prisma.offerFormattedPlace.groupBy({
      by: ['place'],
      _count: { place: true },
      orderBy: { _count: { place: 'desc' } },
      take: 10,
    }),
    prisma.offer.findMany({
      where: { published_at: { gte: twelveMonthsAgo } },
      select: { published_at: true },
    }),
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
      FROM User
      WHERE created_at >= ${twelveMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `,
  ]);

  const toDateKey = (d: Date) => d.toISOString().slice(0, 10);
  const toMonthKey = (d: Date) => d.toISOString().slice(0, 7);

  const savedMap: Record<string, number> = {};
  const appsMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = toDateKey(d);
    savedMap[k] = 0;
    appsMap[k] = 0;
  }
  savedRaw.forEach((s) => { const k = toDateKey(s.saved_at); if (k in savedMap) savedMap[k]++; });
  applicationsRaw.forEach((a) => { const k = toDateKey(a.created_at); if (k in appsMap) appsMap[k]++; });

  const offersMap: Record<string, number> = {};
  const usersMap: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const k = toMonthKey(d);
    offersMap[k] = 0;
    usersMap[k] = 0;
  }
  publishedRaw.forEach((o) => { const k = toMonthKey(o.published_at); if (k in offersMap) offersMap[k]++; });
  usersRaw.forEach((u) => { if (u.month in usersMap) usersMap[u.month] = Number(u.count); });

  const CONTRACT_LABELS: Record<string, string> = {
    permanent: 'CDI', fixedTerm: 'CDD', internship: 'Stage',
    apprenticeship: 'Alternance', partTime: 'Temps partiel', freelance: 'Freelance',
  };

  return {
    savedPerDay: Object.entries(savedMap).map(([date, count]) => ({ date: date.slice(5), count })),
    applicationsPerDay: Object.entries(appsMap).map(([date, count]) => ({ date: date.slice(5), count })),
    contractTypes: contractRaw.map((r) => ({
      type: CONTRACT_LABELS[r.contract_type] ?? r.contract_type,
      count: r._count.contract_type,
    })),
    topCities: citiesRaw.map((r) => ({ city: r.place, count: r._count.place })),
    offersPerMonth: Object.entries(offersMap).map(([month, count]) => ({ month: month.slice(5), count })),
    usersPerMonth: Object.entries(usersMap).map(([month, count]) => ({ month: month.slice(5), count })),
  };
};

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      is_active: true,
      created_at: true,
      login_attempts: true,
    },
    orderBy: { created_at: 'desc' },
  });
};

export const getStats = async () => {
  const totalUsers = await prisma.user.count();
  const totalOffers = await prisma.offer.count();
  const totalSavedOffers = await prisma.savedOffer.count();
  const activeUsers = await prisma.user.count({ where: { is_active: true } });

  return {
    totalUsers,
    activeUsers,
    bannedUsers: totalUsers - activeUsers,
    totalOffers,
    totalSavedOffers,
  };
};
