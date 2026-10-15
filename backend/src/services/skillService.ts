import { prisma } from '../utils/prisma.js';
import { SKILLS_LIST } from '../utils/skillsList.js';

export const getAllSkills = async () => {
  return prisma.skill.findMany({
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
};

export const getUserSkills = async (userId: number) => {
  return prisma.userSkill.findMany({
    where: { user_id: userId },
    include: { skill: true },
    orderBy: { skill: { name: 'asc' } },
  });
};

export const updateUserSkills = async (userId: number, skillIds: number[]) => {
  const skills = await prisma.skill.findMany({
    where: { id: { in: skillIds } },
  });

  if (skills.length !== skillIds.length) {
    throw new Error('Une ou plusieurs compétences n\'existent pas');
  }

  const uniqueSkillIds = [...new Set(skillIds)];

  await prisma.userSkill.deleteMany({
    where: { user_id: userId },
  });

  await prisma.userSkill.createMany({
    data: uniqueSkillIds.map((skillId) => ({
      user_id: userId,
      skill_id: skillId,
    })),
  });

  return getUserSkills(userId);
};

export const seedSkills = async () => {
  const existingCount = await prisma.skill.count();
  if (existingCount > 0) {
    console.log(`Skills already seeded (${existingCount} skills found)`);
    return;
  }

  const skillsToCreate = [
    ...SKILLS_LIST.hardskill.map((name) => ({ name, type: 'hardskill' as const })),
    ...SKILLS_LIST.softskill.map((name) => ({ name, type: 'softskill' as const })),
  ];

  const uniqueSkills = Array.from(
    new Map(
      skillsToCreate.map((skill) => [skill.name.toLowerCase(), skill])
    ).values()
  );

  await prisma.skill.createMany({
    data: uniqueSkills,
  });

  console.log(`Seeded ${uniqueSkills.length} skills (${skillsToCreate.length - uniqueSkills.length} duplicates removed)`);
};
