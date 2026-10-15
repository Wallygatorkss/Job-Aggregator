import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import * as analyticsService from '../services/analyticsService.js';

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const normalizedUsers = users.map((user) => ({ ...user }));

    return res.status(200).json(normalizedUsers);
  } catch {
    return res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

export const getCharts = async (_req: Request, res: Response) => {
  try {
    const data = await analyticsService.getCharts();
    return res.status(200).json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[getCharts] error:', msg);
    return res.status(500).json({ message: msg });
  }
};

export const getPublicStats = async (_req: Request, res: Response) => {
  try {
    const [users, offers, companies] = await Promise.all([
      prisma.user.count(),
      prisma.offer.count(),
      prisma.offerSmallCompany.findMany({
        select: { company_name: true },
        where: { company_name: { not: null } },
        distinct: ['company_name'],
      }),
    ]);

    return res.status(200).json({
      users,
      offers,
      companies: companies.length,
    });
  } catch {
    return res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const offerCount = await prisma.offer.count();
    const activeUsers = await prisma.user.count({
      where: { is_active: true },
    });

    return res.status(200).json({
      users: userCount,
      offers: offerCount,
      activeUsers,
    });
  } catch {
    return res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};
