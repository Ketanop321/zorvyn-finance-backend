/**
 * Shared test helpers used across test files.
 * Centralizes cleanup logic so all test suites use the same pattern.
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Clean up all records created by users in the given domain.
 * Correctly handles soft-deleted transactions (bypasses Prisma middleware).
 * @param {string} domain - email domain suffix e.g. 'zorvyn-test.dev'
 */
const cleanupByDomain = async (domain) => {
  const users = await prisma.user.findMany({
    where: { email: { contains: domain } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) return;

  // Delete audit logs first (references users)
  await prisma.auditLog.deleteMany({ where: { performedBy: { in: userIds } } });

  // Delete transactions using $executeRawUnsafe to bypass soft-delete middleware
  // and support the IN clause with string array
  if (userIds.length > 0) {
    const idList = userIds.map((id) => `'${id}'`).join(',');
    await prisma.$executeRawUnsafe(
      `DELETE FROM transactions WHERE "createdBy"::text IN (${idList})`
    );
  }

  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
};

const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

module.exports = { cleanupByDomain, disconnectPrisma, prisma };
